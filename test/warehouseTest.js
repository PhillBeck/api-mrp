'use strict';

const assert = require('assert'),
	config = require('./config'),
	expect = require('chai').expect,
	request = require('supertest'),
	fs = require('fs'),
	async = require('async'),
	messages = JSON.parse(fs.readFileSync( './server/locales/pt_BR.json', 'utf8'));


exports.run = function(server) {
	describe('Create Warehouse', function() {
		describe('Valid Input', function() {
			var testWarehouse = new config.Warehouse();
			it('Should save', function(done) {
				request(server.listener)
				.post('/warehouses')
				.send(testWarehouse)
				.end(function(err, res) {
					expect(res.statusCode).to.equal(201);
					var testWarehouse = res.body;

					request(server.listener)
					.get('/warehouses/' + testWarehouse._id)
					.end(function(err, res) {
						expect(res.statusCode).to.equal(200);
						expect(res.body).to.eql(testWarehouse);
						done();
					});
				});
			});
		});

		describe('Invalid Inputs', function() {
			var testWarehouse = new config.Warehouse();

			it('Missing payload - Should return 400', function(done) {
				request(server.listener)
				.post('/warehouses')
				.end(function(err, res) {
					expect(res.statusCode).to.equal(400);
					done();
				});
			});

			it('Missing code - should return 400', function(done) {
				delete(testWarehouse.code)
				request(server.listener)
				.post('/warehouses')
				.send(testWarehouse)
				.end(function(err, res) {
					expect(res.statusCode).to.equal(400);
					done();
				});
			});
		});
	});

	describe('Get warehouses', function() {
		describe('List warehouses', function() {
			var warehouseId;
			before(function(done) {
				request(server.listener)
				.post('/warehouses')
				.send(new config.Warehouse())
				.end(function(err, res) {
					warehouseId = res.body._id;
					done();
				});
			});

			it('Should List correctly', function(done) {
				request(server.listener)
				.get(`/warehouses`)
				.end(function(err, res) {
					expect(res.statusCode).to.equal(200);
					expect(res.body.docs).to.be.an('Array');
					expect(res.body.pages).to.be.a('Number');
					expect(res.body.total).to.be.a('Number');
					expect(res.body.page).to.be.a('Number');
					expect(res.body.limit).to.be.a('Number');
					done();
				});
			});
		});

		describe('Get Warehouse By Id', function() {

			var warehouse;
			before(function(done) {
				request(server.listener)
				.post('/warehouses')
				.send(new config.Warehouse())
				.end(function(err, res) {
					warehouse = res.body;
					done();
				});
			});


			it('Should get correctly', function(done) {
				request(server.listener)
				.get(`/warehouses/${warehouse._id}`)
				.end(function(err, res) {
					expect(res.statusCode).to.equal(200);
					expect(res.body.items).to.be.undefined;
					expect(res.body.__v).to.be.undefined;
					expect(res.body.createdAt).to.be.undefined;
					expect(res.body.updatedAt).to.be.undefined;
					expect(res.body).to.eql(warehouse);
					done();
				});
			});

			it('Invalid Id - should return 400', function(done) {
				request(server.listener)
				.get('/warehouses/1')
				.end(function(err, res) {
					expect(res.statusCode).to.equal(400);
					done();
				});
			});

			it('Inexistent Id - should return 404', function(done) {
				request(server.listener)
				.get('/warehouses/012345678901234567890123')
				.end(function(err, res) {
					expect(res.statusCode).to.equal(404);
					expect(res.body.message).to.equal(messages["warehouse.notFound"]);
					done();
				});
			});
		});
	});

		describe('Update warehouse', function() {

			describe('Valid Input', function() {
				var warehouse;
				before(function(done) {
					request(server.listener)
					.post('/warehouses')
					.send(new config.Warehouse())
					.end(function(err, res) {
						warehouse = res.body;
						done();
					});
				});


				it('Should Update', function(done) {
					warehouse.code = 'abcde';

					let id = warehouse._id;
					delete(warehouse._id);
					request(server.listener)
					.put('/warehouses/' + id)
					.send(warehouse)
					.end(function(err, res) {
						request(server.listener)
						.get('/warehouses/' + id)
						.end(function(err, res) {
							expect(res.statusCode).to.equal(200);
							done();
						});
					});
				});

			});
		});

	describe('Get Warehouse', function() {

		var warehouse;
		before(function(done) {
			request(server.listener)
			.post('/warehouses')
			.send(new config.Warehouse())
			.end(function(err, res) {
				warehouse = res.body;
				done();
			});
		});


		it('should get Materials', function(done) {
			request(server.listener)
			.get('/warehouses/' + warehouse._id )
			.end(function(err, res) {
				expect(res.statusCode).to.equal(200);
				done();
			});
		});
	});
}
