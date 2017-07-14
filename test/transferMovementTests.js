'use strict';

const assert = require('assert'),
  config = require('./config'),
  requests = config.requests,
  helper = require('./promises'),
  expect = require('chai').expect,
  fs = require('fs'),
  async = require('async'),
  Q = require('q'),
  messages = JSON.parse(fs.readFileSync('./server/locales/pt_BR.json', 'utf8'));


exports.run = function (server) {
  describe('Transfer Movements', function () {

    describe('Create', function () {
      
      describe('Valid Input', function () {
        /*
        it('Transfer with positive stock - should return 201', function(done) {
          let promises = [helper.saveInputMovement(server), helper.saveProduct(server)];

          Q.all(promises).spread(function(im, p) {
            let movement = new config.TransferMovement(im.in[0].product, im.in[0].warehouse, p._id, p.stdWarehouse);
            movement.fromQuantity = 1;

            postMovement(server, movement, function(err, res) {
              let request = require('supertest');
              request(server.listener)
              .get(`/warehouses/${im.in[0].warehouse}/stocks/${im.in[0].product}`)
              .end(function(err, res) {
                expect(res.body.product).to.equal(im.in[0].product);
                expect(res.body.warehouse).to.equal(im.in[0].warehouse);
                expect(res.body.quantity).to.equal(4);
                done();
              });
            });
          });
        });
        */

        it('Transfer with allowed negative stock - should return 201', function(done) {
          let warehouse = new config.Warehouse();
          warehouse.allowNegativeStock = true;

          config.requests.createWarehouse(server, warehouse, function(err, warehouse) {
            let promises = [helper.saveProduct(server, warehouse._id), helper.saveProduct(server)];

            Q.all(promises).spread(function(fromProduct, toProduct) {
              let movement = new config.movement(fromProduct._id, fromProduct.stdWarehouse);
              movement.toProduct = toProduct._id;
              movement.toWarehouse = toProduct.stdWarehouse;

              postMovement(server, movement, function(err, res) {
                expect(res.statusCode).to.equal(201);
                done();
              });
            });
          });
        });
      });

      /*
      describe('Invalid input', function () {

        it('Invalid fromProduct - should return 400', function (done) {
          let movement = new config.TransferMovement();
          movement.fromProduct = '123';

          postMovement(server, movement, function (err, res) {
            expect(res.statusCode).to.equal(400);
            done();
          });
        });

        it('Invalid fromWareHouse - should return 400', function (done) {
          let movement = new config.TransferMovement();
          movement.fromWarehouse = '123';

          postMovement(server, movement, function (err, res) {
            expect(res.statusCode).to.equal(400);
            done();
          });
        });

        it('Invalid fromQuantity - should return 400', function (done) {
          let movement = new config.TransferMovement();
          movement.fromQuantity = -2;

          postMovement(server, movement, function (err, res) {
            expect(res.statusCode).to.equal(400);
            done();
          });
        });

        it('Invalid toProduct - should return 400', function (done) {
          let movement = new config.TransferMovement();
          movement.toProduct = '123'

          postMovement(server, movement, function (err, res) {
            expect(res.statusCode).to.equal(400);
            done();
          });
        });

        it('Invalid toWarehouse - should return 400', function (done) {
          let movement = new config.TransferMovement();
          movement.toWarehouse = '123'

          postMovement(server, movement, function (err, res) {
            expect(res.statusCode).to.equal(400);
            done();
          });
        });

        it('Invalid toQuantity - should return 400', function (done) {
          let movement = new config.TransferMovement();
          movement.toQuantity = -5

          postMovement(server, movement, function (err, res) {
            expect(res.statusCode).to.equal(400);
            done();
          });
        });

        it('Invalid productionOrder - should return 400', function (done) {
          let movement = new config.TransferMovement();
          movement.productionOrder = '123'

          postMovement(server, movement, function (err, res) {
            expect(res.statusCode).to.equal(400);
            done();
          });
        });

        it('Invalid type - should return 400', function (done) {
          let movement = new config.TransferMovement();
          movement.type = '123'

          postMovement(server, movement, function (err, res) {
            expect(res.statusCode).to.equal(400);
            done();
          });
        });

        it('Cancelled movement - should return 400', function (done) {
          let movement = new config.TransferMovement();
          movement.cancelled = true;

          postMovement(server, movement, function (err, res) {
            expect(res.statusCode).to.equal(400);
            done();
          });
        });

        it('Missing fromProduct - should return 400', function (done) {
          let movement = new config.TransferMovement();
          delete movement.fromProduct;

          postMovement(server, movement, function (err, res) {
            expect(res.statusCode).to.equal(400);
            done();
          });
        });

        it('Missing fromWarehouse - should return 400', function (done) {
          let movement = new config.TransferMovement();
          delete movement.fromWarehouse;

          postMovement(server, movement, function (err, res) {
            expect(res.statusCode).to.equal(400);
            done();
          });
        });

        it('Missing fromQuantity - should return 400', function (done) {
          let movement = new config.TransferMovement();
          delete movement.fromQuantity;

          postMovement(server, movement, function (err, res) {
            expect(res.statusCode).to.equal(400);
            done();
          });
        });

        it('Missing toProduct - should return 400', function (done) {
          let movement = new config.TransferMovement();
          delete movement.toProduct;

          postMovement(server, movement, function (err, res) {
            expect(res.statusCode).to.equal(400);
            done();
          });
        });

        it('Missing toWarehouse - should return 400', function (done) {
          let movement = new config.TransferMovement();
          delete movement.toWarehouse;

          postMovement(server, movement, function (err, res) {
            expect(res.statusCode).to.equal(400);
            done();
          });
        });

        it('Missing toQuantity - should return 400', function (done) {
          let movement = new config.TransferMovement();
          delete movement.toQuantity;

          postMovement(server, movement, function (err, res) {
            expect(res.statusCode).to.equal(400);
            done();
          });
        });

        it('Inexistent fromProduct - should return 422', function (done) {
          var array = [helper.saveProduct(server), helper.saveWarehouse(server)];

          Q.all(array).spread(function (product, warehouse) {
            let movement = new config.TransferMovement();
            movement.fromProduct = '012345678901234567890123';
            movement.toProduct = product._id;
            movement.fromWarehouse = warehouse._id;
            movement.toWarehouse = product.stdWarehouse;

            postMovement(server, movement, function (err, res) {
              expect(res.statusCode).to.equal(422);
              expect(res.body.message).to.equal(messages["movement.productNotFound"]);
              done();
            });
          });
        });

        it('Inexistent fromWareHouse - should return 422', function (done) {
          let promiseArray = [helper.saveProduct(server), helper.saveProduct(server)];

          Q.all(promiseArray).spread(function (fromProduct, toProduct) {
            let movement = new config.TransferMovement(fromProduct._id, undefined, toProduct._id, toProduct.stdWarehouse)

            postMovement(server, movement, function (err, res) {
              expect(res.statusCode).to.equal(422);
              expect(res.body.message).to.equal(messages["movement.warehouseNotFound"]);
              done();
            });
          });

        });

        it('Inexistent toProduct - should return 422', function (done) {
          let promiseArray = [helper.saveProduct(server), helper.saveProduct(server)];

          Q.all(promiseArray).spread(function (fromProduct, toProduct) {
            let movement = new config.TransferMovement(fromProduct._id, fromProduct.stdWarehouse, undefined, toProduct.stdWarehouse)

            postMovement(server, movement, function (err, res) {
              expect(res.statusCode).to.equal(422);
              expect(res.body.message).to.equal(messages["movement.productNotFound"]);
              done();
            });
          });
        });

        it('Inexistent toWarehouse - should return 422', function (done) {
          let promiseArray = [helper.saveProduct(server), helper.saveProduct(server)];

          Q.all(promiseArray).spread(function (fromProduct, toProduct) {
            let movement = new config.TransferMovement(fromProduct._id, fromProduct.stdWarehouse, toProduct._id, undefined);


            postMovement(server, movement, function (err, res) {
              expect(res.statusCode).to.equal(422);
              expect(res.body.message).to.equal(messages["movement.warehouseNotFound"]);
              done();
            });
          });
        });

        it('Nonallowed Negative stock - should return 422');
      });
      */
    });

    describe('Update', function () {
      it('Valid input');

      describe('Invalid input', function () {
        it('Invalid movement Id');
        it('Inexistent movement');
        it('Invalid payload');
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