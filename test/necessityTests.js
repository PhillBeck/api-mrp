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
					.post('/necessities/' + necessityId +'/items')
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
		});

		describe('Get Necessity By Id', function() {
				
			var productId;
			var necessity;

			before(function(done) {
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
							necessity = res.body;
							callback();
						});
					}
				], function() {
					request(server.listener)
					.post('/necessities/' + necessity._id +'/items')
					.send({
						productId: productId,
						quantity: 5,
						deadline: '2017-06-30'
					}).end(function(err, res) {
						done();
					});
				});
			});

			it('Should get correctly', function(done) {
				request(server.listener)
				.get('/necessities/' + necessity._id)
				.end(function(err, res) {
					expect(res.statusCode).to.equal(200);
					expect(res.body.items).to.be.undefined;
					expect(res.body.__v).to.be.undefined;
					expect(res.body.createdAt).to.be.undefined;
					expect(res.body.updatedAt).to.be.undefined;
					expect(res.body).to.eql(necessity);
					done();
				});
			});

			it('Invalid Id - should return 400', function(done) {
				request(server.listener)
				.get('/necessities/1')
				.end(function(err, res) {
					expect(res.statusCode).to.equal(400);
					done();
				});
			});

			it('Inexistent Id - should return 404', function(done) {
				request(server.listener)
				.get('/necessities/012345678901234567890123')
				.end(function(err, res) {
					expect(res.statusCode).to.equal(404);
					expect(res.body.message).to.equal(messages["necessity.notFound"]);
					done();
				});
			});
		});

		describe('Update Necessities', function() {

			describe('Valid Input', function() {
				var productId;
				var necessity;

				before(function(done) {
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
								necessity = res.body;
								callback();
							});
						}
					], function() {
						request(server.listener)
						.post('/necessities/' + necessity._id +'/items')
						.send({
							productId: productId,
							quantity: 5,
							deadline: '2017-06-30'
						}).end(function(err, res) {
							done();
						});
					});
				});

				it('Should Update', function(done) {
					done();
				});
			});
		});
	});

	describe('Get Materials', function() {

		var products = [];
		var necessityId;

		before(function(done) {
			async.series([
				function(next) {
					async.times(100, function(n, callback) {
						request(server.listener)
						.post('/products')
						.send(new config.Product())
						.end(function(err, res) {
							callback(err, res.body);
						});
					}, function(err, docs) {
						products = docs;
						next();
					});
				},
				function(next) {
					request(server.listener)
					.post('/necessities')
					.send({name: 'test', description: 'test'})
					.end(function(err, res) {
						necessityId = res.body._id;
						next();
					});
				},
				function(next) {
					async.times(100, function(n, callback) {
						request(server.listener)
						.post('/necessities/' + necessityId + '/items')
						.send({productId: products[n]._id, quantity: 1, deadline: '2017-06-30'})
						.end(function(err, res) {
							callback();
						});
					}, function(err, docs) {
						next();
					});
				}
			], function(err, res) {
				async.times(99, function(n, callback) {
					request(server.listener)
					.put('/products/' + products[n]._id + '/children/' + products[n+1]._id)
					.send({quantity: 1})
					.end(function(err, res) {
						callback(err, res.statusCode);
					});
				}, function(err, docs) {
					console.log(necessityId);
					done();
				});
			});
		});

		it('should get Materials', function(done) {
			request(server.listener)
			.get('/necessities/' + necessityId + '/materials')
			.end(function(err, res) {
				request(server.listener)
				.get(res.headers.location)
				.end(function(err, res) {
					expect(res.body.docs).to.have.length(15);
					done();
				});
			});
		});
	});
}