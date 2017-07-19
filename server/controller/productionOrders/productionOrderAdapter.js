'use strict';

const Q = require('q'),
  productModel = require('../../model/ProductModel').Product,
  pledgeModel = require('../../model/pledgeModel'),
  log = require('logbro'),
  orderModel = require('../../model/productionOrderModel');

class Transaction {
  constructor(orderInstance) {
    this.orderInstance = orderInstance;
    this.orderSaved = false;
    this.pledges = [];
    this.operation = '';
    this.savedPledges = [];
  }

  createOrder() {
    log.debug('createOrder starting');
      var self = this;
      self.operation = 'create'

      return self.saveOrder.bind(self)()
      .then(self.calculatePledges.bind(self, self.orderInstance, self.orderInstance.quantity))
      .then(self.savePledges.bind(self))
      .then(() => { 
        log.debug('createOrder Resolved');
        return self.orderInstance;
      })
      .catch((err) => {
        log.debug('createOrder Rejected - starting rollback');

        return self.rollbackOrder.bind(self)()
        .then(self.rollbackPledges.bind(self))
        .then(() => { return Q.reject(err) });
      });
  }

  saveOrder() {
    log.debug('saveOrder Started');
    var self = this;
    return self.orderInstance.save()
           .then((savedOrder) => {
             log.debug('saveOrder Resolved');
             self.orderInstance = savedOrder;
             self.orderSaved = true;
           }).catch((err) => {
            log.debug('saveOrder Rejected');
            log.debug(err);
            return Q.reject(err);
           });
  }

  calculatePledges(product, quantity) {
    log.debug('calculatePledges Started');
    var self = this;

    var produto = product;
    var quantidade = quantity;

    return Q.Promise(function(resolve, reject) {
      
      // Here just to allow recursive behavior.
      // Now it can be called as calculatePledges(orderInstance, quantity)
      // Or calculatePledges(productId, quantity)
      product = product.productId || product;
      quantity = quantity || 1;

      var searchConfig = {
        depth: 1,
        direction: '<',
        recordsPerPage: 20,
        page: 0,
        document : { _id: product }
      };

      var getChildren = Q.nbind(productModel.getRelationships, productModel);

      var promises = [];

      getChildren(searchConfig)
      .then(function(structure) {

        structure = structure.docs;

        if (!structure.relationships) {
          log.debug('calculatePledges Resolved');
          return resolve();
        }

        structure.relationships.forEach((element) => {
          let newQuantity = quantity * element.relationProperties.quantity;
          
          if (element.ghost) {
            // If the element is a ghost, pledge its children
            promises.push(self.calculatePledges.apply(self, [element._id, newQuantity]));
          } else {
            let pledge = {
              product: element._id,
              quantity: newQuantity,
              warehouse: element.stdWarehouse,
              productionOrder: self.orderInstance._id
            };

            self.pledges.push(pledge);

            promises.push(Q.resolve());
          }
        });

        Q.all(promises).then(() => {
          if (process.env.TRETA) {
            reject('forced error');
          }

          log.debug('calculatePledges Resolved');
          resolve();
        }).catch((err) => {
          log.debug('calculatePledges Rejected internal');
          log.debug(err)
          reject(err);
        });


      }).catch((err) => {
        log.debug('calculatePledges Rejected external');
        log.debug(err)
        reject(err);
      });
    });
  }

  savePledges() {
    log.debug('savePledges Started');
    var self = this;

    let promises = self.pledges.map((element) => {
      let pledgeInstance = new pledgeModel(element);
      return pledgeInstance.save().then((pledge) => { self.savedPledges.push(pledge) })
    });

    return Q.all(promises)
           .then(() => {
              log.debug('savePledges Resolved');
            })
           .catch((err) => {
             log.debug('savePledges Rejected');
             return Q.reject(err);
           });
  }

  rollbackOrder() {
    var self = this;

    if (!self.orderInstance._version || self.orderInstance._version === 0) {
      return self.rollbackPledges.apply(self)
             .then(self.orderInstance.remove.bind(self.orderInstance))
    }

    return self.rollbackPledges.apply(self)
           .then(() => {
             let version = self.orderInstance._version - 1;
             return self.orderInstance.revert.apply(self.orderInstance, version);
           });
  }

  rollbackPledges() {
    log.debug('rollbackPledges Started');
    var self = this;
    var promises;

    if (self.operation === 'create') {
      promises = self.savedPledges.map((element) => { return element.remove(); });
    } else {
      promises = self.savedPledges.map((element) => { return element.save(); });
    }

    return Q.all(promises)
    .then(() => { log.debug('rollbackPledges Resolved'); })
    .catch((err) => {
      log.debug('rollbackPledges Rejected');
      return Q.reject(err);
    });

  }

}

function createOrder(orderInstance) {

  if (typeof(orderInstance.save) !== 'function') {
    orderInstance = new orderModel(orderInstance);
  }

  var transaction = new Transaction(orderInstance);

  return transaction.createOrder()
  .then((order) => {
    return pledgeModel.find({productionOrder: order._id})
  }).catch((err) => {
    if (err === 'forced error') {
      return pledgeModel.find({productionOrder: orderInstance._id})
    }

    return Q.reject(err);
  })
}

module.exports = {
  createOrder: createOrder
}