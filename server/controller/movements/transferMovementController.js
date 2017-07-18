'use strict';

var Joi = require('joi'),
	Boom = require('boom'),
	httpTools = require('../../utils/httpTools'),
  movementModel = require('../../model/MovementModel'),
  movementAdapter = require('./movementAdapter'),
	mongoose = require('mongoose'),
  logFactory = require('../../utils/log'),
  log = new logFactory.Logger('transferMovementController'),
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

    movementAdapter.createMovement(movementInstance)
    .then((savedMovement) => {
      reply(savedMovement).created(`/movements/${savedMovement._id}`);
    }).catch((err) => {
      err.name = err.name || 'undefined';

      switch (err.name) {
        case 'ValidationError':
          return reply(Boom.badData(request.i18n.__(movementAdapter.getErrorMessage(err))));
        case 'NotFound':
          return reply((Boom.notFound(request.i18n.__("movement.notFound"))));
        default:
          log.error(request, err);
          return reply(Boom.badImplementation());
      }
    });
  }
}

exports.patch = {
  validate: {
    payload: {
      cancelled: Joi.boolean().valid([true]).required()
    },
    params: {
      movementId: Joi.objectId().required()
    }
  },
  handler: function(request, reply) {

    movementAdapter.cancelMovement(request.params.movementId)
    .then(() => {
      reply().code(204);
    }).catch((err) => {
      err.name = err.name || 'undefined';
      switch (err.name) {
        case 'ValidationError':
          return reply(Boom.badData(request.i18n.__(movementAdapter.getErrorMessage(err))));
        case 'NotFound':
          return reply((Boom.notFound(request.i18n.__("movement.notFound"))));
        default:
          log.error(request, err);
          return reply(Boom.badImplementation());
      }
    });
  }
}