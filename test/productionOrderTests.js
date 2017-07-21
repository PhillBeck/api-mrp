'use strict';

const assert = require('assert'),
	  config = require('./config'),
    createRequests = config.requests,
	  expect = require('chai').expect,
	  request = require('supertest'),
	  fs = require('fs'),
	  async = require('async'),
	  messages = JSON.parse(fs.readFileSync( './server/locales/pt_BR.json', 'utf8'));


exports.run = function(server) {

	describe('Create Production Order', function() {

		var productId;
    var warehouse;

		before(function(done) {
      createRequests.createWarehouse(server, undefined, function(err, doc) {
        warehouse = doc._id;
        createRequests.createProduct(server, new config.Product(warehouse), function(err, doc) {
          productId = doc._id;
          done();
        });
      });
		});

		describe('Valid Input', function() {

			it('Should Return 201', function(done) {
				request(server.listener)
				.post('/productionOrders')
				.send(new config.ProductionOrder(productId))
				.end(function(err, res) {
					expect(res.statusCode).to.equal(201);
					expect(res.body._id).to.exist;
					expect(res.body.DELETED).to.be.undefined;
					expect(res.body.__v).to.be.undefined;
					expect(res.body.createdAt).to.be.undefined;
					expect(res.body.updatedAt).to.be.undefined;
					done(err);
				});
			});
		});

		describe('Invalid Input', function() {

			it('Missing payload - Should return 400', function(done) {
				request(server.listener)
				.post('/productionOrders')
				.end(function(err, res) {
					expect(res.statusCode).to.equal(400);
					done(err);
				});
			});

			it('Missing productId - Should return 400', function(done) {
				let payload = new config.ProductionOrder();
				delete payload.product;

				request(server.listener)
				.post('/productionOrders')
				.send(payload)
				.end(function(err, res) {
					expect(res.statusCode).to.equal(400);
					expect(res.body.message).to.contain('product');
					done(err);
				});
			});

			it('Missing quantity - Should return 400', function(done) {
				let payload = new config.ProductionOrder('012345678901234567890123');
				delete payload.quantity;

				request(server.listener)
				.post('/productionOrders')
				.send(payload)
				.end(function(err, res) {
					expect(res.statusCode).to.equal(400);
					expect(res.body.message).to.contain('quantity');
					done(err);
				});
			});

			it('Missing originalDeadline - Should return 400', function(done) {
				let payload = new config.ProductionOrder('012345678901234567890123');
				delete payload.originalDeadline;

				request(server.listener)
				.post('/productionOrders')
				.send(payload)
				.end(function(err, res) {
					expect(res.statusCode).to.equal(400);
					expect(res.body.message).to.contain('originalDeadline');
					done(err);
				});
			});

			it('Invalid productId - Should return 400', function(done) {
				request(server.listener)
				.post('/productionOrders')
				.send(new config.ProductionOrder('0123'))
				.end(function(err, res) {
					expect(res.statusCode).to.equal(400);
					expect(res.body.message).to.contain('product');
					done(err);
				});
			});

			it('Invalid salesOrderId - Should return 400', function(done) {
				let payload = new config.ProductionOrder('012345678901234567890123');
				payload.salesOrderId = '0123'

				request(server.listener)
				.post('/productionOrders')
				.send(payload)
				.end(function(err, res) {
					expect(res.statusCode).to.equal(400);
					expect(res.body.message).to.contain('salesOrderId');
					done(err);
				});

			});

			it('Invalid type - should return 400', function(done) {
				let payload = new config.ProductionOrder('012345678901234567890123');
				payload.type = 4;

				request(server.listener)
				.post('/productionOrders')
				.send(payload)
				.end(function(err, res) {
					expect(res.statusCode).to.equal(400);
					expect(res.body.message).to.contain('type');
					done(err);
				});
			});

			it('Inexistent productId - Should return 422', function(done) {
				let payload = new config.ProductionOrder('012345678901234567890123');

				request(server.listener)
				.post('/productionOrders')
				.send(payload)
				.end(function(err, res) {
					expect(res.statusCode).to.equal(422);
					expect(res.body.message).to.eql(messages["productionOrder.productNotFound"]);
					expect(res.body.message).to.contain('encontrado')
					done(err);
				});
			});

			it('Duplicate code - Should return 422', function(done) {
				let payload = new config.ProductionOrder(productId);

				request(server.listener)
				.post('/productionOrders')
				.send(payload)
				.end(function(err, res) {
					request(server.listener)
					.post('/productionOrders')
					.send(payload)
					.end(function(err, res) {
						expect(res.statusCode).to.equal(422);
						expect(res.body.message).to.eql(messages["productionOrder.codeNotUnique"]);
						expect(res.body.message).to.contain('duplicado');
						done(err);
					});
				});
			});
		});
	});

	describe('Get Production Orders', function() {

		var order;
    var warehouse;

		before(function(done) {
      createRequests.createWarehouse(server, undefined, function(err, doc) {
        warehouse = doc._id;
        createRequests.createProduct(server, new config.Product(warehouse), function(err,doc) {
          let productId = doc._id;

  				request(server.listener)
  				.post('/productionOrders')
  				.send(new config.ProductionOrder(productId))
  				.end(function(err, res) {
  					order = res.body;
  					done(err);
  				});
        });
			});
		});

		describe('Valid input', function() {
			it('Should get list', function(done) {
				request(server.listener)
				.get('/productionOrders')
				.end(function(err, res) {
					expect(res.statusCode).to.equal(200);
					expect(res.body.docs).to.be.an('Array');
					expect(res.body.total).to.be.above(0);
					expect(res.body.pages).to.be.above(0);
					expect(res.body.limit).to.equal(15);
					expect(res.body.page).to.equal(1);
					done(err);
				});
			});

			it('should get document by Id', function(done) {
				request(server.listener)
				.get('/productionOrders/' + order._id)
				.end(function(err, res) {
					expect(res.statusCode).to.equal(200);
					expect(res.body).to.be.eql(order);
					done(err);
				});
			});

			it('should get document by query', function(done) {
				request(server.listener)
				.get('/productionOrders?_search=code:' + order.code)
				.end(function(err, res) {
					expect(res.statusCode).to.equal(200);
					expect(res.body.docs).to.have.lengthOf(1);
					expect(res.body.docs[0]).to.be.eql(order);
					expect(res.body.total).to.equal(1);
					expect(res.body.pages).to.equal(1);
					expect(res.body.limit).to.equal(15);
					expect(res.body.page).to.equal(1);
					done(err);
				});
			});

			it('request inexistent page - should return empty array', function(done) {
				request(server.listener)
				.get('/productionOrders?_search=code:' + order.code + '&_page=2')
				.end(function(err, res) {
					expect(res.statusCode).to.equal(200);
					expect(res.body.docs).to.be.an('Array');
					expect(res.body.docs).to.be.empty;
					done(err);
				});
			});
		});

		describe('Invalid input', function() {
			it('Invalid orderId - should return 400', function(done) {
				request(server.listener)
				.get('/productionOrders/0123')
				.end(function(err, res) {
					expect(res.statusCode).to.equal(400);
					expect(res.body.message).to.contain('orderId');
					done(err);
				});
			});

			it('Inexistent orderId - should return 404', function(done) {
				request(server.listener)
				.get('/productionOrders/012345678901234567890123')
				.end(function(err, res) {
					expect(res.statusCode).to.equal(404);
					expect(res.body.message).to.equal(messages["productionOrder.notFound"]);
					done(err);
				});
			});

			it('invalid _limit query - should return 400', function(done) {
				request(server.listener)
				.get('/productionOrders?_page=-2')
				.end(function(err, res) {
					expect(res.statusCode).to.equal(400);
					done(err);
				});
			});
		});
	});

	describe('Update Production Order', function() {
		var order;
    var warehouse;

    before(function(done) {
      createRequests.createWarehouse(server, undefined, function(err, doc) {
        warehouse = doc._id;
        createRequests.createProduct(server, new config.Product(warehouse), function(err,doc) {
          let productId = doc._id;

  				request(server.listener)
  				.post('/productionOrders')
  				.send(new config.ProductionOrder(productId))
  				.end(function(err, res) {
  					order = res.body;
  					done(err);
  				});
        });
			});
		});

		describe('Valid input', function() {
			it('Should update', function(done) {

				var updatedOrder = {};
				Object.assign(updatedOrder, order);

				updatedOrder.quantity = 150;

				request(server.listener)
				.put('/productionOrders/' + order._id)
				.send(updatedOrder)
				.end(function(err, res) {
					expect(res.statusCode).to.equal(204);
					request(server.listener)
					.get('/productionOrders/' + order._id)
					.end(function(err, res) {
						expect(res.body).to.eql(updatedOrder);
						done(err);
					});
				});
			});
		});

		describe('Invalid input', function() {

			var order;
      var warehouse;

      before(function(done) {
        createRequests.createWarehouse(server, undefined, function(err, doc) {
          warehouse = doc._id;
          createRequests.createProduct(server, new config.Product(warehouse), function(err,doc) {
            let productId = doc._id;

    				request(server.listener)
    				.post('/productionOrders')
    				.send(new config.ProductionOrder(productId))
    				.end(function(err, res) {
    					order = res.body;
    					done(err);
    				});
          });
  			});
  		});

			it('Inexistent ID - should return 404', function(done) {
				let updatedOrder = {};
				Object.assign(updatedOrder, order);

				request(server.listener)
				.put('/productionOrders/012345678901234567890213')
				.send(updatedOrder)
				.end(function(err, res) {
					expect(res.statusCode).to.equal(404);
					expect(res.body.message).to.eql(messages["productionOrder.notFound"]);
					expect(res.body.message).to.contain('encontrad');
					done(err);
				})
			});

			it('Update Deleted Order - should return 404', function(done) {

				var updatedOrder = {};
				Object.assign(updatedOrder, order);

				request(server.listener)
				.delete('/productionOrders/' + order._id)
				.end(function(err, res) {
					expect(res.statusCode).to.equal(204);
					request(server.listener)
					.put('/productionOrders/' + order._id)
					.send(updatedOrder)
					.end(function(err, res) {
						expect(res.statusCode).to.equal(404);
						done(err);
					});
				});
			});
		});
	});

	describe('Delete Production Order', function() {

		describe('Valid input', function() {
			var order;
      var warehouse;

      before(function(done) {
        createRequests.createWarehouse(server, undefined, function(err, doc) {
          warehouse = doc._id;
          createRequests.createProduct(server, new config.Product(warehouse), function(err,doc) {
            let productId = doc._id;

            request(server.listener)
            .post('/productionOrders')
            .send(new config.ProductionOrder(productId))
            .end(function(err, res) {
              order = res.body;
              done(err);
            });
          });
        });
      });


			it('Should Delete', function(done) {
				request(server.listener)
				.delete('/productionOrders/' + order._id)
				.end(function(err, res) {
					expect(res.statusCode).to.equal(204);
					request(server.listener)
					.get('/productionOrders/' + order._id)
					.end(function(err, res) {
						expect(res.statusCode).to.equal(404);
						done(err);
					});
				});
			});
		});

		describe('Invalid Input', function() {
			var order;
      var warehouse;

      before(function(done) {
        createRequests.createWarehouse(server, undefined, function(err, doc) {
          warehouse = doc._id;
          createRequests.createProduct(server, new config.Product(warehouse), function(err,doc) {
            let productId = doc._id;

            request(server.listener)
            .post('/productionOrders')
            .send(new config.ProductionOrder(productId))
            .end(function(err, res) {
              order = res.body;
              done(err);
            });
          });
        });
      });

			it('Inexistent ID - should return 404', function(done) {
				request(server.listener)
				.delete('/productionOrders/012345678901234567890123')
				.end(function(err, res) {
					expect(res.statusCode).to.equal(404);
					expect(res.body.message).to.eql(messages["productionOrder.notFound"]);
					done(err);
				});
			});

			it('Double delete - should return 404', function(done) {
				request(server.listener)
				.delete('/productionOrders/' + order._id)
				.end(function(err, res) {
					expect(res.statusCode).to.equal(204);

					request(server.listener)
					.delete('/productionOrders/' + order._id)
					.end(function(err, res) {
						expect(res.statusCode).to.equal(404);
						expect(res.body.message).to.eql(messages["productionOrder.notFound"]);
						done(err);
					});
				});
			});

			it('Order with pointed production - should return 422');

		});
	});
}
