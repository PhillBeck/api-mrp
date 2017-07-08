'use strict';

var Joi = require('joi'),
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

var payloadValidation = {
  _id: Joi.objectId(),
  fromProduct: Joi.objectId().required(),
  fromWarehouse: Joi.objectId().required(),
  fromQuantity: Joi.number().min(0).required(),
  toProduct: Joi.objectId().required(),
  toWarehouse: Joi.objectId().required(),
  toQuantity: Joi.number().min(0).required(),
  type: Joi.string().valid(['TR']),
  cancelled: Joi.boolean().valid(false),
  createdAt: Joi.date().iso()
}

exports.create = {
  validate: {
    payload: payloadValidation
  },
  handler: function(request, reply) {

    let movement = {
      type: 'TR',
      cancelled: false,
      out: [{
        product: request.payload.fromProduct,
        warehouse: request.payload.fromWarehouse,
        quantity: request.payload.fromQuantity
      }],
      in: [{
        product: request.payload.toProduct,
        warehouse: request.payload.toWarehouse,
        quantity: request.payload.toQuantity
      }]
    }

    var movementInstance = new movementModel(movement);

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

      return reply(doc);
    })
  }
}


exports.patch = {
  validate: {
    payload: {
      cancelled: Joi.boolean().required()
    },
    params: {
      _id: Joi.objectId().required()
    }
  },
  handler: function(request, reply) {
    movementModel.update({_id: request.params._id}, {cancelled: request.payload.cancelled}, function(err, numAffected) {
      if (err) {
        log.error(request, err);
        return reply(Boom.badImplementation());
      }

      if (numAffected.n === 0) {
        return reply(Boom.notFound(request.i18n.__("movement.notFound")));
      }

      return reply().code(204);
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
