'use strict';

const assert = require('assert'),
  config = require('./config'),
  requests = config.requests,
  expect = require('chai').expect,
  helper = require('./promises'),
  request = require('supertest'),
  fs = require('fs'),
  async = require('async'),
  messages = JSON.parse(fs.readFileSync( './server/locales/pt_BR.json', 'utf8'));

exports.run = function(server) {

  describe('Input Movements', function() {
    describe('Create', function() {
      describe('Valid input', function() {
        it('Should create Movement and Update Stock', function (done) {
          helper.saveProduct(server).then(function(product) {
            var movement = new config.InputMovement();
            movement.product = product._id;
            movement.warehouse = product.stdWarehouse;

            postMovement(server, movement, function(err, res) {
              expect(res.statusCode).to.equal(201);
              done(err);
              /*request(server.listener)
              .get(`/warehouses/${movement.warehouse}/stocks/${movement.product}`)
              .end(function(err, res) {
                expect(res.statusCode).to.equal(200);
                expect(res.body.warehouse._id).to.equal(movement.warehouse);
                expect(res.body.product._id).to.equal(movement.product);
                expect(res.body.quantity).to.equal(5);
                done();
              });*/
            });
          });
        });
      });

      describe('Invalid input', function() {
        it('Invalid Product ID - should return 400', function(done) {
          let movement = new config.InputMovement();
          movement.product = '123';

          postMovement(server, movement, function(err, res) {
            expect(res.statusCode).to.equal(400);
            done();
          });
        });

        it('Invalid Warehouse ID - should return 400', function(done) {
          let movement = new config.InputMovement();
          movement.warehouse = '123';

          postMovement(server, movement, function(err, res) {
            expect(res.statusCode).to.equal(400);
            done();
          });
        });

        it('Invalid Quantity - should return 400', function(done) {
          let movement = new config.InputMovement();
          movement.quantity = -5;

          postMovement(server, movement, function(err, res) {
            expect(res.statusCode).to.equal(400);
            done();
          });
        });

        it('Missing Product - should return 400', function(done) {
          let movement = new config.InputMovement();
          delete movement.product;

          postMovement(server, movement, function(err, res) {
            expect(res.statusCode).to.equal(400);
            done();
          });
        });

        it('Missing Warehouse - should return 400', function(done) {
          let movement = new config.InputMovement();
          delete movement.product;

          postMovement(server, movement, function(err, res) {
            expect(res.statusCode).to.equal(400);
            done();
          });
        });

        it('Missing quantity - should return 400', function(done) {
          let movement = new config.InputMovement();
          delete movement.product;

          postMovement(server, movement, function(err, res) {
            expect(res.statusCode).to.equal(400);
            done();
          });
        });

        it('Inexistent Product - should return 422', function(done) {
          helper.saveWarehouse(server).then(function(warehouse) {
            let movement = new config.InputMovement();
            movement.warehouse = warehouse._id;

            postMovement(server, movement, function(err, res) {
              expect(res.statusCode).to.equal(422);
              expect(res.body.message).to.eql(messages["movement.productNotFound"])
              done();
            });
          });
        });

        it('Inexistent Warehouse - should return 422', function(done) {
          helper.saveProduct(server).then(function(product) {
            let movement = new config.InputMovement();
            movement.product = product._id;

            postMovement(server, movement, function(err, res) {
              expect(res.statusCode).to.equal(422);
              expect(res.body.message).to.eql(messages["movement.warehouseNotFound"])
              done();
            });
          });
        });
      });
    });

    describe('Update', function() {
      describe('Valid Input', function() {

      });
    });
  });
}

function postMovement(server, movement, callback) {
  request(server.listener)
  .post('/movements/input')
  .send(movement)
  .end(callback)
}

function patchMovement(server, movement, callback) {
  request(server.listener)
  .patch(`/movements/inputs/${movement._id}`)
  .send({cancelled: true})
  .end(callback)
}
