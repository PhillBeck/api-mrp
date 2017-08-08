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

function saveWarehouse(server, warehouse) {
  return Q.Promise(function(resolve, reject, notify) {
    let warehouseToSend = warehouse || new config.Warehouse();

    request(server.listener)
    .post('/warehouses/')
    .send(warehouseToSend)
    .end(function(err, res) {
      return resolve(res.body);
    })
  });
}

function saveProduct(server, warehouse) {
  return Q.Promise(function(resolve, reject) {
    promiseProduct(server, warehouse).then(function(product) {
      request(server.listener)
      .post('/products')
      .send(product)
      .end(function(err, res) {
        if (err) {
          return reject(err);
        }

        return resolve(res.body);
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

function saveInputMovement(server, movement) {
  return Q.Promise(function(resolve, reject) {

    if (movement) {
      request(server.listener)
      .post('/movements/input')
      .send(movement)
      .then((res) => {
        resolve(res.body);
      })
    } else {
      promiseInputMovement(server).then(function(movement) {
        request(server.listener)
        .post('/movements/input')
        .send(movement)
        .then((res) => {
          resolve(res.body);
        })
      })
    }
  });
}

function saveProductionOrder(server, product) {
  return promiseProductionOrder(server, product)
  .then(function(productionOrder) {
    return request(server.listener)
    .post('/productionOrders')
    .send(productionOrder)
    .then((res) => { return res.body })
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

function getStockInWarehouse(server, product, warehouse) {
  return Q.Promise(function(resolve, reject) {
    request(server.listener)
    .get(`/warehouses/${warehouse}/stocks/${product}`)
    .then(function(res) {
      resolve(res.body);
    })
    .catch(reject);
  });
}


module.exports = {
  saveWarehouse: saveWarehouse,
  saveProduct: saveProduct,
  saveInputMovement: saveInputMovement,
  getStockInWarehouse: getStockInWarehouse,
  saveProductionOrder: saveProductionOrder
}