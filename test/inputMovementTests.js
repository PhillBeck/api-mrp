'use strict';

const assert = require('assert'),
  config = require('./config'),
  requests = config.requests,
  expect = require('chai').expect,
  request = require('supertest'),
  fs = require('fs'),
  async = require('async'),
  messages = JSON.parse(fs.readFileSync( './server/locales/pt_BR.json', 'utf8'));

exports.run = function(server) {

  describe('Input Movements', function() {
    describe('Create', function() {
      describe('Valid input', function() {
        it('Should create', function (done) {
          async.parallel({
            product: function(next) { requests.createProduct(server, undefined, next) },
            warehouse: function(next) { requests.createWarehouse(server, undefined, next) }
          }, function(err, docs) {
            var movement = new config.InputMovement();
            movement.product = docs.product._id;
            movement.warehouse = docs.warehouse._id;

            postMovement(server, movement, function(err, res) {
              expect(res.statusCode).to.equal(201);
              done();
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
          requests.createWarehouse(server, undefined, function(err, doc) {
            let movement = new config.InputMovement();
            movement.warehouse = doc._id;

            postMovement(server, movement, function(err, res) {
              expect(res.statusCode).to.equal(422);
              done();
            });
          });
        });

        it('Inexistent Warehouse - should return 422', function(done) {
          requests.createProduct(server, undefined, function(err, doc) {
            let movement = new config.InputMovement();
            movement.product = doc._id;

            postMovement(server, movement, function(err, res) {
              expect(res.statusCode).to.equal(422);
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
