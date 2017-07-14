'use strict';

require('any-promise/register/q');

var Joi = require('joi'),
	Boom = require('boom'),
	httpTools = require('../../utils/httpTools'),
  movementModel = require('../../model/MovementModel'),
	mongoose = require('mongoose'),
  logFactory = require('../../utils/log'),
  requestInstance = require('request-promise-any'),
  Q = require('q'),
  log = new logFactory.Logger('transferMovementController'),
	formatOutput = require('../../utils/format'),
  stockModel = require('../../model/stockModel'),
  movementAdapter = require('./movementAdapter'),
	shallowClone = require('../../utils/shallowClone');
Joi.objectId = require('joi-objectid')(Joi);

mongoose.Promise = Q.Promise;

exports.create = {
  validate: {
    payload: {
      product: Joi.objectId().required(),
      warehouse: Joi.objectId().required(),
      quantity: Joi.number().min(0).required(),
      type: Joi.string().valid(['IN']),
      cancelled: Joi.boolean().valid([false]),
      createdAt: Joi.date().iso(),
      updatedAt: Joi.date().iso()
    }
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

    movementAdapter.createMovement(movementInstance)
    .then((savedMovement) => {
      reply(savedMovement).created(`/movements/${savedMovement._id}`);
    })
    .catch((err) => {
      err.name = err.name || 'undefined';

      switch (err.name) {
        case 'ValidationError':
          return reply(Boom.badData(request.i18n.__(getErrorMessage(err))));
        case 'NotFound':
          return reply((Boom.notFound(request.i18n.__("movement.notFound"))));
        default:
          log.error(request, err);
          return reply(Boom.badImplementation());
      }
    });
  }
}

function getErrorMessage(err) {
  if (err.type === 'NonAllowed Negative Stock') {
    return "movement.negativeStock"
  }

  let errorKeys = Object.keys(err.errors).join('');
  let documentNotFoundRegex = /(?:\b(in|out).\d.)(\S+)/;

  let regexOutput = documentNotFoundRegex.exec(errorKeys);

  if (regexOutput[2]) {
    switch(regexOutput[2]) {
      case 'product':
        return "movement.productNotFound";
      case 'warehouse':
        return 'movement.warehouseNotFound';
      default:
        return "movement.unexpectedValidationError";
    }
  }

  return "movement.unexpectedValidationError";
}