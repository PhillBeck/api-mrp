'use strict';

const assert = require('assert'),
  config = require('./config'),
  requests = config.requests,
  expect = require('chai').expect,
  fs = require('fs'),
  async = require('async'),
  messages = JSON.parse(fs.readFileSync( './server/locales/pt_BR.json', 'utf8'));


exports.run = function(server) {
  describe('Transfer Movements', function() {

    describe('Create', function() {

      describe('Valid Input', function() {
        it('Transfer with positive stock - should return 201');
        it('Transfer with allowed negative stock - should return 201');
      });

      describe('Invalid input', function() {

        it('Invalid fromProduct - should return 400', function(done) {
          let movement = new config.Movement();
          movement.fromProduct = '123';

          postMovement(server, movement, function(err, res) {
            expect(res.statusCode).to.equal(400);
            done();
          });
        });

        it('Invalid fromWareHouse - should return 400', function(done) {
          let movement = new config.Movement();
          movement.fromWarehouse = '123';

          postMovement(server, movement, function(err, res) {
            expect(res.statusCode).to.equal(400);
            done();
          });
        });

        it('Invalid fromQuantity - should return 400', function(done) {
          let movement = new config.Movement();
          movement.fromQuantity = -2;

          postMovement(server, movement, function(err, res) {
            expect(res.statusCode).to.equal(400);
            done();
          });
        });

        it('Invalid toProduct - should return 400', function(done) {
          let movement = new config.Movement();
          movement.toProduct = '123'

          postMovement(server, movement, function(err, res) {
            expect(res.statusCode).to.equal(400);
            done();
          });
        });

        it('Invalid toWarehouse - should return 400', function(done) {
          let movement = new config.Movement();
          movement.toWarehouse = '123'

          postMovement(server, movement, function(err, res) {
            expect(res.statusCode).to.equal(400);
            done();
          });
        });

        it('Invalid toQuantity - should return 400', function(done) {
          let movement = new config.Movement();
          movement.toQuantity = -5

          postMovement(server, movement, function(err, res) {
            expect(res.statusCode).to.equal(400);
            done();
          });
        });

        it('Invalid productionOrder - should return 400', function(done) {
          let movement = new config.Movement();
          movement.productionOrder = '123'

          postMovement(server, movement, function(err, res) {
            expect(res.statusCode).to.equal(400);
            done();
          });
        });

        it('Invalid type - should return 400', function(done) {
          let movement = new config.Movement();
          movement.type = '123'

          postMovement(server, movement, function(err, res) {
            expect(res.statusCode).to.equal(400);
            done();
          });
        });

        it('Cancelled movement - should return 400', function(done) {
          let movement = new config.Movement();
          movement.cancelled = true;

          postMovement(server, movement, function(err, res) {
            expect(res.statusCode).to.equal(400);
            done();
          });
        });

        it('Missing fromProduct - should return 400', function(done) {
          let movement = new config.Movement();
          delete movement.fromProduct;

          postMovement(server, movement, function(err, res) {
            expect(res.statusCode).to.equal(400);
            done();
          });
        });

        it('Missing fromWarehouse - should return 400', function(done) {
          let movement = new config.Movement();
          delete movement.fromWarehouse;

          postMovement(server, movement, function(err, res) {
            expect(res.statusCode).to.equal(400);
            done();
          });
        });

        it('Missing fromQuantity - should return 400', function(done) {
          let movement = new config.Movement();
          delete movement.fromQuantity;

          postMovement(server, movement, function(err, res) {
            expect(res.statusCode).to.equal(400);
            done();
          });
        });

        it('Missing toProduct - should return 400', function(done) {
          let movement = new config.Movement();
          delete movement.toProduct;

          postMovement(server, movement, function(err, res) {
            expect(res.statusCode).to.equal(400);
            done();
          });
        });

        it('Missing toWarehouse - should return 400', function(done) {
          let movement = new config.Movement();
          delete movement.toWarehouse;

          postMovement(server, movement, function(err, res) {
            expect(res.statusCode).to.equal(400);
            done();
          });
        });

        it('Missing toQuantity - should return 400', function(done) {
          let movement = new config.Movement();
          delete movement.toQuantity;

          postMovement(server, movement, function(err, res) {
            expect(res.statusCode).to.equal(400);
            done();
          });
        });

        it('Inexistent fromProduct - should return 422', function(done) {
          async.parallel({
            fromWarehouse: function(next) { requests.createWarehouse(server, undefined, next) },
            toWarehouse: function(next) { requests.createWarehouse(server, undefined, next) },
            toProduct: function(next) { requests.createProduct(server, undefined, next) }
          }, function(err, docs) {
            let movement = new config.Movement();
            movement.fromWarehouse = docs.fromWarehouse._id;
            movement.toWarehouse = docs.toWarehouse._id;
            movement.toProduct = docs.toProduct._id;

            postMovement(server, movement, function(err, res) {
              expect(res.statusCode).to.equal(422);
              expect(res.body.message).to.equal(messages["movement.productNotFound"]);
              done();
            });
          });
        });

        it('Inexistent fromWareHouse - should return 422', function(done) {
          async.parallel({
            fromProduct: function(next) { requests.createProduct(server, undefined, next) },
            toWarehouse: function(next) { requests.createWarehouse(server, undefined, next) },
            toProduct: function(next) { requests.createProduct(server, undefined, next) }
          }, function(err, docs) {
            let movement = new config.Movement();
            movement.fromProduct = docs.fromProduct._id;
            movement.toWarehouse = docs.toWarehouse._id;
            movement.toProduct = docs.toProduct._id;

            postMovement(server, movement, function(err, res) {
              expect(res.statusCode).to.equal(422);
              expect(res.body.message).to.equal(messages["movement.warehouseNotFound"]);
              done();
            });
          });
        });

        it('Inexistent toProduct - should return 422', function (done) {
          async.parallel({
            fromProduct: function(next) { requests.createProduct(server, undefined, next) },
            fromWarehouse: function(next) { requests.createWarehouse(server, undefined, next) },
            toWarehouse: function(next) { requests.createWarehouse(server, undefined, next) }
          }, function(err, docs) {
            let movement = new config.Movement();
            movement.fromProduct = docs.fromProduct._id;
            movement.fromWarehouse = docs.fromWarehouse._id;
            movement.toWarehouse = docs.toWarehouse._id;

            postMovement(server, movement, function(err, res) {
              expect(res.statusCode).to.equal(422);
              expect(res.body.message).to.equal(messages["movement.productNotFound"]);
              done();
            });
          });
        });

        it('Inexistent toWarehouse - should return 422', function(done) {
          async.parallel({
            fromProduct: function(next) { requests.createProduct(server, undefined, next) },
            fromWarehouse: function(next) { requests.createWarehouse(server, undefined, next) },
            toProduct: function(next) { requests.createProduct(server, undefined, next) }
          }, function(err, docs) {
            let movement = new config.Movement();
            movement.fromProduct = docs.fromProduct._id;
            movement.fromWarehouse = docs.fromWarehouse._id;
            movement.toProduct = docs.toProduct._id;

            postMovement(server, movement, function(err, res) {
              expect(res.statusCode).to.equal(422);
              expect(res.body.message).to.equal(messages["movement.warehouseNotFound"]);
              done();
            });
          });
        });

        it('Nonallowed Negative stock - should return 422');
      });
    });
  });
}

function postMovement(server, movement, callback) {
  var request = require('supertest');

  request(server.listener)
  .post('/movements/transfers')
  .send(movement)
  .end(callback)
}
