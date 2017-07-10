'use strict';
require('any-promise/register/q');

const Joi = require('joi'),
	Boom = require('boom'),
	httpTools = require('../../utils/httpTools'),
  movementModel = require('../../model/MovementModel'),
	mongoose = require('mongoose'),
  async = require('async'),
  request = require('request'),
  logFactory = require('../../utils/log'),
  log = new logFactory.createLogger('transferMovementController'),
	formatOutput = require('../../utils/format'),
  Q = require('q'),
  rp = require('request-promise-any'),
	shallowClone = require('../../utils/shallowClone');
Joi.objectId = require('joi-objectid')(Joi);

mongoose.Promise = Q.Promise;

const payloadValidation = {
  _id: Joi.objectId(),
  product: Joi.objectId().required(),
  warehouse: Joi.objectId().required(),
  quantity: Joi.number().min(0).required(),
  type: Joi.string().valid(['IN']),
  cancelled: Joi.boolean().valid(false),
  createdAt: Joi.date().iso()
}

exports.create = {
  validate: {
    payload: payloadValidation
  },
  handler: function(request, reply) {
    let movement = {
      type: 'IN',
      cancelled: false,
      out: [],
      in: [{
        product: request.payload.product,
        warehouse: request.payload.warehouse,
        quantity: request.payload.quantity
      }]
    };

    let movementInstance = new movementModel(movement);

    createMovement(movementInstance)
    .then(function(savedDocument) {
      return reply(savedDocument).created();
    }).catch(function(error) {
      switch (error.err.name) {
          case 'ValidationError':
            return reply(Boom.badData(request.i18n.__(getErrorMessage(err))));
            break;
          default:
            log.error(request, err);
            return reply(Boom.badImplementation());
        }
    });
  }
}

function getErrorMessage(err) {
  let errorKeys = Object.keys(err.errors).join('');
  let documentNotFoundRegex = /(?:\b(in|out).\d.)(\S+)/;

  let regexOutput = documentNotFoundRegex.exec(errorKeys);

  if (regexOutput[2]) {
    switch(regexOutput[2]) {
      case 'product':
        return "movement.productNotFound";
        break;
      case 'warehouse':
        return 'movement.warehouseNotFound';
        break;
      default:
        return "movement.unexpectedValidationError";
    }
  }

  return "movement.unexpectedValidationError";
}

function createMovement(movementInstance) {
  return Q.Promise(function(resolve, reject) {
    saveInputMovement(movementInstance)
    .then(updateProductStocks)
    .then(function() {
      return resolve(movementInstance)
    }).catch(function(err) {

      //
      //TODO: Implement Rollback
      //
      
      
      return reject(err);
    });
  });
}

function saveInputMovement(movementInstance) {
  return Q.Promise(function(resolve, reject, notify) {
    movementInstance.save(function(err, doc) {
      if (err) {
        return reject({err: err});
      }

      return resolve(movementInstance);
    });
  });
}

function updateProductStocks(movementInstance) {
  return Q.Promise(function(resolve, reject) {
    var updatedStocks = [];
    var updatePromises = [];
    
    movementInstance.in.forEach(function(element) {
      updatePromises.push(
        updateOneProductStock(element)
        .then(function(updatedDocument) {
          return updatedStocks.push(updatedDocument);
        })
      );
    });

    movementInstance.out.forEach(function(elemet) {
      updatePromises.push(
        updateOneProductStock(element)
        .then(function(updatedDocument) {
          return updatedStocks.push(updatedDocument);
        })
      );
    });

    Q.allSettled(updatePromises).then(function() {
      return resolve();
    }).catch(function(err) {
      return reject({
        err: err,
        updatedStocks: updatedStocks,
        createdMovement: movementInstance._id
      });
    });
  });
}

function updateOneProductStock(item) {
  var options = {
    method: 'POST',
    body: {quantity: item.quantity},
    uri: `http://localhost:9002/products/${item.product}/stock/${item.warehouse}`,
    json: true
  };

  return rp(options)
}