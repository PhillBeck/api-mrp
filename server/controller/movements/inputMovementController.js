'use strict';

require('any-promise/register/q');

var Joi = require('joi'),
	Boom = require('boom'),
	httpTools = require('../../utils/httpTools'),
  movementModel = require('../../model/MovementModel'),
	mongoose = require('mongoose'),
  logFactory = require('../../utils/log'),
  Q = require('q'),
  log = new logFactory.createLogger('transferMovementController'),
	formatOutput = require('../../utils/format'),
  stockModel = require('../../model/stockModel'),
  movementAdapter = require('./movementAdapter'),
	shallowClone = require('../../utils/shallowClone');
Joi.objectId = require('joi-objectid')(Joi);

mongoose.Promise = Q.Promise;

exports.teste = {
  validate: {
    payload: {
      product: Joi.objectId(),
      warehouse: Joi.objectId(),
      quantity: Joi.number()
    }
  },
  handler: function(request, reply) {
    let movement = {
      type: 'TR',
      cancelled: false,
      out: [{
        product: request.payload.product,
        warehouse: request.payload.warehouse,
        quantity: request.payload.quantity
      }],
      in: []
    };

    let movemenInstance = new movementModel(movement);

    console.log('Starting');

    movementAdapter.createMovement(movemenInstance)
    .then(function() {
      console.log('createMovement resolved')
      stockModel.findOne({product: request.payload.product, warehouse: request.payload.warehouse }, function(err, doc) {
        reply((err || doc) + '\n');
      })
    }).catch((err) => {
      console.log(err);
      reply(err);
    });
  }
}

