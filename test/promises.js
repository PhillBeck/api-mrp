'use strict';

const Q = require('q'),
  request = require('supertest'),
  config = require('./config');

function promiseProduct(server, warehouse) {
  return Q.Promise(function(resolve, reject, notify) {
    if (warehouse) {
      return resolve(new config.Product(warehouse));
    }

    saveWarehouse(server).then(function(warehouse) {
      resolve(new config.Product(warehouse._id))
    });
  });
}

function saveWarehouse(server) {
  return Q.Promise(function(resolve, reject, notify) {
    request(server.listener)
    .post('/warehouses')
    .send(new config.Warehouse())
    .end(function(err, res) {
      return resolve(res.body);
    });
  });
}

function saveProduct(server, warehouse) {
  return Q.Promise(function(resolve, reject, notify) {
    promiseProduct(server, warehouse).then(function(product) {
      request(server.listener)
      .post('/products')
      .send(product)
      .end(function(err, res) {
        resolve(res.body);
      });
    }).catch(reject);
  });
}

function promiseInputMovement(server) {
  return Q.Promise(function(resolve, reject) {
    saveProduct(server)
    .then(function(product) {
      resolve(new config.InputMovement(product));
    })
    .catch(reject);
  });
}

function saveInputMovement(server) {
  return Q.Promise(function(resolve, reject) {
    promiseInputMovement(server).then(function(movement) {
      request(server.listener)
      .post('/movements/input')
      .send(movement)
      .then((res) => {
        resolve(res.body);
      })
    })
  });
}

function saveProductionOrder(server, product) {
  return Q.Promise(function(resolve, request, notify) {
    promiseProductionOrder(server, product).then(function(productionOrder) {
      request(server.listener)
      .post('/productionOrders')
      .send(productionOrder)
      .end(function(err, res) {
        resolve(res.body);
      });
    });
  });
}

function promiseProductionOrder(server, product) {
  return Q.Promise(function(resolve, reject, notify) {
    if (product) {
      return resolve(new config.ProductionOrder(product))
    }

    saveProduct(server).then(function(product) {
      resolve(new config.ProductionOrder(product._id))
    });
  });
}

module.exports = {
  saveWarehouse: saveWarehouse,
  saveProduct: saveProduct,
  saveInputMovement: saveInputMovement
}