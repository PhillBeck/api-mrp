'use strict';

var Joi = require('joi'),
  Boom = require('boom'),
  httpTools = require('./../utils/httpTools'),
  Log = require('../model/LogModel').Log,
  mongoose = require('mongoose'),
  fs = require('fs'),
  uuidV4 = require('uuid/v4'),
  flattenMongooseValidationError = require('flatten-mongoose-validation-error');


exports.create = {
  validate: {
    payload: {
      user: {
        _id: Joi.string().required(),
        name: Joi.string().required().min(4).max(100)
      },
      operation: Joi.string().required().min(4).max(100),
      files: [Joi.string()]
    }
  },
  handler: function (request, reply) {
    var log = new Log(request.payload);
    log.save(function (err, log) {
      if (!err) {
        return reply(log).created('/logs/' + log._id); // HTTP 201
      }
      return reply(Boom.forbidden(err)); // HTTP 403
    });
  }
};