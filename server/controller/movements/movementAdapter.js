'use strict';

require('any-promise/register/q');

// Import Models
const movementModel = require('../../model/MovementModel'),
  stockModel = require('../../model/stockModel');

//Import libraries
const Q = require('q'),
  request = require('request-promise-any'),
  mongoose = require('mongoose');

mongoose.Promise = Q.Promise;

function createMovement(movementInstance) {
  return Q.Promise(function(resolve,reject) {
    movementInstance.save()
    .then(saveStocks)
    .then(() => { resolve(movementInstance) })
    .catch(function(err) {
      rollbackMovement(movementInstance)
      .then(() => { reject(err) })
      .catch((err) => { reject(err) })
    });
  })
}

function saveStocks(movement) {
  return Q.Promise(function(resolve, reject) {

    let movementInItems = movement.in.map((element) => {
      return {
        product: element.product,
        warehouse: element.warehouse,
        movement: movement._id,
        quantity: element.quantity
      }
    })

    let movementItems = movementInItems.concat(movement.out.map((element) => {
      return {
        product: element.product,
        warehouse: element.warehouse,
        movement: movement._id,
        quantity: element.quantity*(-1)
      };
    }));

    let promises = movementItems.map((element) => {
      let ret = verifyNegativeStock(element)
      .then(prepareStockInstance)
      .then(saveOneStock)
      .catch((err) => { reject(err); });
      return ret;
    })

    Q.allSettled(promises)
    .then(() => {
      resolve() 
    })
    .catch((err) => {
      reject(err)
    })
  });
}

function verifyNegativeStock(stock) {
  return Q.Promise(function(resolve, reject) {
    if (stock.quantity > 0) {
      return resolve(stock);
    }

    stockModel.findOne({product: stock.product, warehouse: stock.warehouse})
    .then(function(doc) {
      let oldQuantity = (doc && doc.quantity) || 0; // doc.quantity if defined, otherwise 0
      let newQuantity = oldQuantity + stock.quantity;

      if (newQuantity >= 0) {
        console.log('verifyNegativeStock resolved newQuantity > 0')
        return resolve(stock);
      }

      let options = {
        uri: `http://localhost:9002/warehouses/${stock.warehouse}`,
        json: true
      };

      request(options).then(function(warehouse) {
        if (warehouse.allowNegativeStock) {
          return resolve(stock);
        }

        let error = {
          name: 'ValidationError',
          type: 'NonAllowed Negative Stock',
          target: {
            warehouse: warehouse._id,
            product: stock.product
          }
        }

        return reject(error)
      }).catch((err) => { reject(err) });
    }).catch((err) => { reject(err) });
  });
}

function prepareStockInstance(stock) {
  return Q.Promise(function(resolve, reject) {

    stockModel.findOne({ product: stock.product, warehouse: stock.warehouse}, function(err, doc) {
      if (err) {
        reject(err);;
      }

      if (doc) {
        doc.quantity += stock.quantity;
        doc.movement = stock.movement;
        return resolve(doc);
      }

      let stockInstance = new stockModel(stock);
      return resolve(stockInstance);

    });
  });
}

function saveOneStock(stockInstance) {
  return stockInstance.save();
}

function rollbackMovement(movementInstance) {
  return rollbackStocks(movementInstance).then(() => {
    return movementInstance.remove();
  })
}

function rollbackStocks(movement) {
  return Q.Promise(function(resolve, reject) {
    stockModel.find({movement: movement._id})
    .then(function(docs) {
      let promises = docs.map((element) => { return rollbackOneStock(element) });
      Q.all(promises)
      .then(function() { resolve() })
      .catch((err) => { reject(err) });
    });
  }); 
}

function rollbackOneStock(stock) {
  if (stock.__version < 1) {
    return stock.remove()
  }

  return Q.Promise(function(resolve, reject) {
    stock.revert(stock.__version - 1, function(err, stock) {
      if (err) {
        reject(err)
      }
      
      resolve();
    });
  })
}

module.exports = {
  createMovement: createMovement
}