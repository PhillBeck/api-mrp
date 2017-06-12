'use strict';

const assert = require('assert'),
	config = require('./config'),
	expect = require('chai').expect,
	request = require('supertest'),
	fs = require('fs'),
	async = require('async'),
	messages = JSON.parse(fs.readFileSync( './server/locales/pt_BR.json', 'utf8'));


exports.run = function(server) {
	describe('Create Necessity', function() {
		describe('Valid Input', function() {
			it('Should save', function(done) {
				request(server.listener)
				.post('/necessities')
				.send({name: 'testName', description: 'testDescription'})
				.end(function(err, res) {
					expect(res.statusCode).to.equal(201);
					expect(res.body.name).to.equal('testName');
					expect(res.body.description).to.equal('testDescription');
					var necessity = res.body;

					request(server.listener)
					.get('/necessities/' + necessity._id)
					.end(function(err, res) {
						expect(res.statusCode).to.equal(200);
						expect(res.body).to.eql(necessity);
						done();
					});
				});
			});
		});

		describe('Invalid Inputs', function() {
			it('Missing payload - Should return 400', function(done) {
				request(server.listener)
				.post('/necessities')
				.end(function(err, res) {
					expect(res.statusCode).to.equal(400);
					expect(res.body.message).to.contain('deve ser um objeto');
					expect(res.body.validation.source).to.equal('payload');
					done();
				});
			});

			it('Missing name - should return 400', function(done) {
				request(server.listener)
				.post('/necessities')
				.send({description: 'testDescription'})
				.end(function(err, res) {
					expect(res.statusCode).to.equal(400);
					expect(res.body.message).to.contain('obrigatório');
					expect(res.body.message).to.contain('name');
					done();
				});
			});

			it('Missing description - should return 400', function(done) {
				request(server.listener)
				.post('/necessities')
				.send({name: 'testName'})
				.end(function(err, res) {
					expect(res.statusCode).to.equal(400);
					expect(res.body.message).to.contain('obrigatório');
					expect(res.body.message).to.contain('description');
					done();
				});
			});
		});	
	});

	describe('Get necessities', function() {
		describe('List necessities', function() {
			before(function(done) {

				var productId;
				var necessityId;

				async.parallel([
					function(callback) {
						request(server.listener)
						.post('/products')
						.send(new config.Product())
						.end(function(err, res) {
							productId = res.body._id;
							callback();
						});
					},
					function(callback) {
						request(server.listener)
						.post('/necessities')
						.send({name: 'testName', description: 'testDescription'})
						.end(function(err, res) {
							necessityId = res.body._id;
							callback();
						});
					}
				], function() {
					request(server.listener)
					.post('/necessities/items/')
					.send({
						productId: productId,
						quantity: 5,
						deadline: '2017-06-30'
					}).end(function(err, res) {
						done();
					});
				});
			});

			it('Should List correctly', function(done) {
				request(server.listener)
				.get('/necessities')
				.end(function(err, res) {
					expect(res.statusCode).to.equal(200);
					expect(res.body.docs).to.be.an('Array');
					expect(res.body.pages).to.be.a('Number');
					expect(res.body.total).to.be.a('Number');
					expect(res.body.page).to.be.a('Number');
					expect(res.body.limit).to.be.a('Number');
					expect(res.body.docs[0].name).to.be.a('String');
					expect(res.body.docs[0].description).to.be.a('String');
					expect(res.body.docs[0].items).to.be.undefined;
					expect(res.body.docs[0].__v).to.be.undefined;
					done();
				});
			});

			it 
		});
	});
}