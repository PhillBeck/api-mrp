'use strict';

require('any-promise/register/q');

// Import Models
const movementModel = require('../../model/MovementModel'),
  stockModel = require('../../model/stockModel');

//Import libraries
const Q = require('q'),
  request = require('request-promise-any'),
  bro = require('logbro'),
  mongoose = require('mongoose'),
  shallowClone = require('../../utils/shallowClone');

mongoose.Promise = Q.Promise;

class Transaction {
  constructor(movementInstance) {
    this.movementInstance = movementInstance;
    this.stocks = [];
    this.MovementSaved = false;
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
        _self.rollbackMovement(_self.movementInstance)
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

  cancel() {
    var _self = this;
    bro.debug('create Starting');
    return Q.Promise(function(resolve,reject) {
      _self.movementInstance.save()
      .then(_self.revertQuantities)
      .then(_self.saveStocks.bind(_self))
      .then(() => {
        bro.debug('createMovement resolved'); 
        resolve(_self.movementInstance)
      })
      .catch(function(err) {
        bro.debug('createMovement rejected - starting rollback');
        bro.debug(err);
        _self.rollbackMovement(_self.movementInstance)
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

  revertQuantities(movementInstance) {
    return Q.Promise(function(resolve, reject) {
      let outItems = movementInstance.in.map((item) => {return shallowClone(item)});
      let inItems = movementInstance.out.map((item) => {return shallowClone(item)});

      movementInstance.in = inItems;
      movementInstance.out = outItems;

      setImmediate(resolve, movementInstance);
    });
  }

  saveStocks() {
    var _self = this;
    _self.MovementSaved = true;
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
        return _self.verifyNegativeStock(element)
        .then(_self.prepareStockInstance)
        .then(_self.saveOneStock)
        .then(function(stock) {
          _self.stocks.push(stock);
        });
      });

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

  saveOneStock(stockInstance) {
    return stockInstance.save();
  }

  rollbackMovement(movementInstance) {
    bro.debug('rollbackMovement starting');
    return this.rollbackStocks(this)
    .then(() => {
      if (movementInstance._version === 0 || !movementInstance._version) {
        bro.debug('rollbackMovement resolved - removing');
        return movementInstance.remove();
      }

      return Q.Promise(function(resolve,reject) {
        movementInstance.revert(0, function(err, doc) {
          if (err) {
            bro.debug('rollbackMovement rejected');
            return reject(err);
          }

          bro.debug('rollbackMovement resolved');
          return resolve()
        });
      });
    }).catch((err) => {
      bro.debug('rollbackMovement rejected');
      bro.debug(err);
      reject(err);
    });
  }

  rollbackStocks(_self) {
    bro.debug('rollbackStocks starting');
    return Q.Promise(function(resolve, reject) {
      let promises = _self.stocks.map((element) => { return _self.rollbackOneStock(element) });
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
  }

  rollbackOneStock(stock) {
    bro.debug('rollbackOneStock starting');
    if (stock._version < 1) {
      bro.debug('rrollbackOneStock resolved');
      return stock.remove()
    }

    return Q.Promise(function(resolve, reject) {
      stock.revert(stock._version - 1, function(err, stock) {
        if (err) {
          bro.debug('rollbackOneStock rejected');
          reject(err)
        }

        bro.debug('rollbackOneStock resolved');
        resolve();
      });
    })
  }

}

function createMovement(movementInstance) {
  var transaction = new Transaction(movementInstance);
  return transaction.create();
}

function cancelMovement(movementId) {

  return Q.Promise(function(resolve, reject) {
    movementModel.findById(movementId)
    .then(function(movementInstance) {

      if (!movementInstance) {
        return reject({name: 'NotFound'})
      }

      var transaction = new Transaction(movementInstance);

      transaction.cancel().then(resolve).catch(reject)

    }).catch(reject)
  });
}

module.exports = {
  createMovement: createMovement,
  cancelMovement: cancelMovement
}