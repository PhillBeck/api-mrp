'use strict';

var assert = require('assert'),
axios = require('axios'),
config = require('./config').config,
expect = require('chai').expect;

var testProduct1 = {
  code: 'Test1',
  name: 'Test1',
  family: 'Test1',
  description: 'Test1',
  amountInStock: 50,
  unit: 'un',
  leadTime: 20,
  costValue: 325.5,
  children : [ ]
};

var testProduct2 = {
  code: 'Test2',
  name: 'Test2',
  family: 'Test2',
  description: 'Test2',
  amountInStock: 50,
  unit: 'un',
  leadTime: 20,
  costValue: 325.5,
  children : [ { } ]
};

describe('Create Product', function() {

  describe('#Create Product', function() {
    it('Should return 201', function() {
      var __self = this;
      return axios.post(config.hostCreate, testProduct1).then(function(response) {
        __self.testProduct1 = response.data;
        expect(response.status).to.equal(201);
      });
    });

    after(function() {
      var __self = this;
      return axios.delete(config.hostDelete + __self.testProduct1._id).then(function(response) {});
    });

  });



  describe('#Duplicate Product', function(){
    before(function() {
      var __self = this;
      return axios.post(config.hostCreate, testProduct2).then(function(response){
        __self.testProduct2 = response.data;
      });
    });

    after(function() {
      var __self = this;
      return axios.delete(config.hostDelete + __self.testProduct2._id).then(function(response) {});
    });


    it('Should return 422', function() {
      setTimeout( function() {
        var __self = this;
        var testReject = __self.testProduct2
        delete testReject._id;
        delete testReject.__v;
        return axios.post(config.hostCreate, testReject).then(function(response) {
          expect(response.status).to.equal(422);
        }).catch(function (err) {
          expect(err.response.status).to.equal(422);
        });
      }, 1000);
    })
  });
});

describe('Update Product', function() {

  before(function() {
    var __self = this;
    return axios.post(config.hostCreate, testProduct2).then(function(response){
      __self.testProduct2 = response.data;
    });
  });

  after(function() {
    var __self = this;
    return axios.delete(config.hostDelete + __self.testProduct2._id).then(function(response) {});
  });

  describe('#Valid Property Update', function() {

    it('Should Update Product', function() {
      var __self = this;
      __self.testProduct2.name = 'UpdatedTest2';
      return axios.put(config.hostUpdate + __self.testProduct2._id).then(function(response) {
        axios.get(config.hostGet + __self.testProduct2._id).then(function(response) {
          expect(response.data.name).to.equal(__self.testProduct2.name); 
        });
      });

    });

  });

});