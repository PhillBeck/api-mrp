'use strict';

const Joi = require('joi'),
	  Boom = require('boom'),
	  httpTools = require('../utils/httpTools'),
	  WarehouseModel = require('../model/WarehouseModel').Warehouse,
	  format = require('../utils/format'),
	  _ = require('lodash'),
	  logFactory = require('../utils/log'),
	  log = new logFactory.createLogger('WarehouseController');

Joi.objectId = require('joi-objectid')(Joi);


//Request Validation Objects
const warehouseloadValidate = {
	_id: Joi.objectId(),
	code: Joi.string().required(),
	description: Joi.string(),
	validSince: Joi.date().required(),
	unitId: Joi.objectId().required(),
	BLOCKED: Joi.boolean()
}

exports.createWarehouse = {
	validate: {
		payload: warehouseloadValidate
	},
	handler: function(request, reply) {
			let warehouseInstance = WarehouseModel(request.payload);

			warehouseInstance.save(function(err, doc) {
				if (!err) {
					return reply(format(doc, ['DELETED', '__v', 'createdAt', 'updatedAt']))
					.created('/warehouses/' + doc._id);
				}

				if (err.code && err.code === 11000) {
					return reply(Boom.badData(request.i18n.__("warehouse.codeNotUnique")));
				}

				log.error(request, {err: 'Mongo Error', message: err});
				return reply(Boom.badImplementation(err));
			});
	}
}

exports.listWarehouses = {
	validate: {
		query: {
			_search: Joi.string(),
			_limit: Joi.number().min(1),
			_page: Joi.number().min(1)
		}
	},
	handler: function(request, reply) {
		httpTools.searchQuery(null, request.query, {}, function(search, filters) {
			filters.select= { __v: 0, createdAt: 0, updatedAt: 0};

			WarehouseModel.paginate(search, filters, function(err, obj) {
				if (err) {
					log.error(request, {err: 'Mongo Error', message: err});
					return reply(Boom.badImplementation());
				}

				return reply(obj);
			});
		}, function(err) {
			return reply(Boom.badData(request.i18n.__("httpUtils.badQuery")));
		})
	}
}

exports.getWarehouseById = {
	validate: {
		params: {
			warehouseId: Joi.objectId()
		}
	},
	handler: function(request, reply) {
		let options = { __v: 0, createdAt: 0, updatedAt: 0};

		WarehouseModel.find({_id: request.params.warehouseId})
		.select(options)
		.exec(function(err, docs) {
			if (err) {
				log.error(request, {err: 'Mongo Error', message: err});
				return reply(Boom.badImplementation());
			}

			if (!docs || !docs.length || docs.length < 1) {
				return reply(Boom.notFound(request.i18n.__("warehouse.notFound")));
			}

			return reply(docs[0]);
		});
	}
}

exports.updateWarehouse = {
	validate: {
		params: {
			warehouseId: Joi.objectId()
		},
		payload: warehouseloadValidate
	},
	handler: function(request, reply) {
		WarehouseModel.update({_id: request.params.warehouseId}, request.payload, function(err, numAffetcted) {
			if (err) {
				log.error(request, err);
				return reply(Boom.badImplementation());
			}

			if (numAffetcted.n === 0) {
				return reply(Boom.notFound(request.i18n.__("warehouse.notFound")));
			}

			return reply().code(204);
		});
	}
}

exports.deleteWarehouse = {
	validate: {
		params: {
			warehouseId: Joi.objectId()
		}
	},
	handler: function(request, reply) {
		WarehouseModel.remove({_id: request.params.warehouseId}, function(err, numAffetcted) {
			if (err) {
				log.error(request, err);
				return reply(Boom.badImplementation());
			}

			if (numAffetcted.n === 0) {
				return reply(Boom.notFound(request.i18n.__("warehouse.notFound")));
			}

			return reply().code(204);
		});
	}
}
