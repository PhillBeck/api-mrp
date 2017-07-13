'use strict';

require('any-promise/register/q');

// Import Models
const movementModel = require('../../model/MovementModel'),
  stockModel = require('../../model/stockModel');

//Import libraries
const Q = require('q'),
  request = require('request-promise-any'),
  bro = require('logbro'),
  mongoose = require('mongoose');

mongoose.Promise = Q.Promise;

class Transaction {
  constructor(movementInstance) {
    this.movementInstance = movementInstance;
    this.stocks = [];
  }

  create() {
    var _self = this;
    bro.debug('create Starting');
    return Q.Promise(function(resolve,reject) {
      _self.movementInstance.save()
      .then(_self.saveStocks.bind(_self))
      .then(() => {
        bro.debug('createMovement resolved'); 
        resolve(_self.movementInstance)
      })
      .catch(function(err) {
        bro.debug('createMovement rejected - starting rollback');
        bro.debug(err);
        rollbackMovement(_self.movementInstance)
        .then(() => {
          bro.debug('rollbackMovement resolved');
          reject(err)
        })
        .catch((err) => {
          bro.debug('rollbackMovement rejected');
          reject(err);
        });
      });
    });
  }

  saveStocks() {
    var _self = this;
    bro.debug('saveStocks starting');
    return Q.Promise(function(resolve, reject) {

      let movementInItems = _self.movementInstance.in.map((element) => {
        return {
          product: element.product,
          warehouse: element.warehouse,
          movement: _self.movementInstance._id,
          quantity: element.quantity
        }
      })

      let movementItems = movementInItems.concat(_self.movementInstance.out.map((element) => {
        return {
          product: element.product,
          warehouse: element.warehouse,
          movement: _self.movementInstance._id,
          quantity: element.quantity*(-1)
        };
      }));

      let promises = movementItems.map((element) => {
        let ret = _self.verifyNegativeStock(element)
        .then(_self.prepareStockInstance)
        .then(saveOneStock)
        return ret;
      })

      Q.all(promises)
      .then(() => {
        bro.debug('saveStocks resolved');
        resolve() 
      })
      .catch((err) => {
        bro.debug('saveStocks rejected');
        bro.debug(err);
        reject(err)
      })
    });
  }

  verifyNegativeStock(stock) {
    var _self = this;
    bro.debug('verifyNegativeStock starting');
    return Q.Promise(function(resolve, reject) {
      if (stock.quantity > 0) {
        bro.debug('verifyNegativeStock resolved - quantity > 0');
        return resolve(stock);
      }

      stockModel.findOne({product: stock.product, warehouse: stock.warehouse})
      .then(function(doc) {
        let oldQuantity = (doc && doc.quantity) || 0; // doc.quantity if defined, otherwise 0
        let newQuantity = oldQuantity + stock.quantity;

        if (newQuantity >= 0) {
          bro.debug('verifyNegativeStock resolved newQuantity > 0')
          return resolve(stock);
        }

        let options = {
          uri: `http://localhost:9002/warehouses/${stock.warehouse}`,
          json: true
        };

        request(options).then(function(warehouse) {
          if (warehouse.allowNegativeStock) {
            bro.debug('verifyNegativeStock resolved - allowed negative stock');
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

          bro.debug('verifyNegativeStock rejected - nonallowed negative stock');
          return reject(error)
        }).catch((err) => {
          bro.debug('verifyNegativeStock rejected');
          reject(err)
        });
      }).catch((err) => {
        bro.debug('verifyNegativeStock rejected');
        reject(err)
      });
    });
  }

  prepareStockInstance(stock) {
    var _self = this;
    bro.debug('prepareStockInstance starting');
    return Q.Promise(function(resolve, reject) {

      stockModel.findOne({ product: stock.product, warehouse: stock.warehouse}, function(err, doc) {
        if (err) {
          bro.debug('prepareStockInstance rejected');
          reject(err);
        }

        if (doc) {
          doc.quantity += stock.quantity;
          doc.movement = stock.movement;
          bro.debug('prepareStockInstance resolved');
          return resolve(doc);
        }

        let stockInstance = new stockModel(stock);
        bro.debug('prepareStockInstance resolved');
        return resolve(stockInstance);
      });
    });
  }
}

function createMovement(movementInstance) {
  var transaction = new Transaction(movementInstance);
  return transaction.create();
}

function 

function saveOneStock(stockInstance) {
  return stockInstance.save();
}

function rollbackMovement(movementInstance) {
  bro.debug('rollbackMovement starting');
  bro.debug(movementInstance)
  return rollbackStocks(movementInstance).then(() => {
    return movementInstance.remove();
  })
}

function rollbackStocks(movement) {
  bro.debug('rollbackStocks starting');
  return Q.Promise(function(resolve, reject) {
    stockModel.find({movement: movement._id})
    .then(function(docs) {
      let promises = docs.map((element) => { return rollbackOneStock(element) });
      Q.all(promises)
      .then(function() {
        bro.debug('rollbackStocks resolved');
        resolve();
      })
      .catch((err) => {
        bro.debug('rollbackStocks rejected');
        reject(err);
      });
    });
  }); 
}

function rollbackOneStock(stock) {
  bro.debug('rollbackOneStock starting');
  if (stock.__version < 1) {
    bro.debug('rrollbackOneStock resolved');
    return stock.remove()
  }

  return Q.Promise(function(resolve, reject) {
    stock.revert(stock.__version - 1, function(err, stock) {
      if (err) {
        bro.debug('rollbackOneStock rejected');
        reject(err)
      }

      bro.debug('rollbackOneStock resolved');
      resolve();
    });
  })
}

function cancelMovement(movementInstance) {
  
}

module.exports = {
  createMovement: createMovement
}