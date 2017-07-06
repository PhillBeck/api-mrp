'use strict';

const assert = require('assert'),
	config = require('./config'),
	expect = require('chai').expect,
	request = require('supertest'),
	fs = require('fs'),
	async = require('async'),
	messages = JSON.parse(fs.readFileSync( './server/locales/pt_BR.json', 'utf8'));

var BaseOperations = require('./BaseOperations').BaseOperations;

exports.run = function(server) {
  describe('NF', function () {
    let baseOperations = new BaseOperations(server, request);

  	describe('Create Necessity', function() {
      let testNF = new config.NF();

  		describe('Valid Input', function() {
  			it('Should save', function(done) {
          request(server.listener)
            .post(`/nfs`)
            .send(testNF)
            .end(function(err, res) {
                if (err) return done(err);
                expect(res.statusCode).to.equal(201);
                done();
            });
        });
  		});

  		describe('Invalid Inputs', function() {
  			it('Missing payload - Should return 400', function(done) {
          request(server.listener)
            .post(`/nfs`)
            .end(function(err, res) {
                if (err) return done(err);
                expect(res.statusCode).to.equal(400);
                done();
            });
  			});

  			it('Missing nf - should return 400', function(done) {
          delete(testNF.nf)
          request(server.listener)
            .post(`/nfs`)
            .send(testNF)
            .end(function(err, res) {
                if (err) return done(err);
                expect(res.statusCode).to.equal(400);
                done();
            });
  			});

  			it('Missing serie - should return 400', function(done) {
          testNF.nf = "aaaaaaaaaa"
          delete(testNF.serie)

          request(server.listener)
            .post(`/nfs`)
            .send(testNF)
            .end(function(err, res) {
                if (err) return done(err);
                expect(res.statusCode).to.equal(400);
                done();
            });
  			});

        it('Missing emittedAt - should return 400', function(done) {
          testNF.serie = "aaaaaaaaaa"
          delete(testNF.emittedAt)

          request(server.listener)
            .post(`/nfs`)
            .send(testNF)
            .end(function(err, res) {
                if (err) return done(err);
                expect(res.statusCode).to.equal(400);
                done();
            });
  			});
  		});
  	});

  	/*describe('Get necessities', function() {
  		describe('List necessities', function() {
        let testNF = new config.NF();
  			before(function(done) {
          baseOperations.setExpect(expect)
          baseOperations.executeSequece([{
              object: testNF,
              fn: "addNF"
            }], (err, result) => {
                testNF = result[0];
                done();
            });
          });
  			});

  			it('Should List correctly', function(done) {
          request(server.listener)
              .get(`/nfs`)
              .end(function(err, res) {
                  if (err) return done(err);
                  expect(res.statusCode).to.equal(200);
                  expect(res.body.docs).to.be.an('Array');
                  done();
              });
  			});
  		});

  		describe('Get Necessity By Id', function() {
  			before(function(done) {
          request(server.listener)
              .get(`/nfs/${testNF._id}`)
              .end(function(err, res) {
                  if (err) return done(err);
                  expect(res.statusCode).to.equal(200);
                  done();
              });
  			});

  			it('Should get correctly', function(done) {

  			});

  			it('Invalid Id - should return 400', function(done) {

  			});

  			it('Inexistent Id - should return 404', function(done) {

  			});
  		});

  		describe('Update Necessities', function() {

  			describe('Valid Input', function() {
  				before(function(done) {

  				});

  				it('Should Update', function(done) {
  					done();
  				});
  			});
  	});

  	describe('Get Materials', function() {




  		it('should get Materials', function(done) {
  		});
  	});
    */
  });
}
