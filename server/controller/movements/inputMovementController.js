'use strict';

const Joi = require('joi'),
	Boom = require('boom'),
	httpTools = require('../../utils/httpTools'),
  movementModel = require('../../model/MovementModel'),
	mongoose = require('mongoose'),
  logFactory = require('../../utils/log'),
  log = new logFactory.createLogger('transferMovementController'),
	formatOutput = require('../../utils/format'),
	shallowClone = require('../../utils/shallowClone');
Joi.objectId = require('joi-objectid')(Joi);

mongoose.Promise = require('q').Promise;

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

    movementInstance.save(function(err, doc) {
      if (err) {
        switch (err.name) {
          case 'ValidationError':
            return reply(Boom.badData(request.i18n.__(getErrorMessage(err))));
            break;
          default:
            log.error(request, err);
            return reply(Boom.badImplementation());
        }
      }

      return reply(doc).created();
    })

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
