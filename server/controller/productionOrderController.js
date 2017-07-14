'use strict';

const Joi = require('joi'),
	  Boom = require('boom'),
	  httpTools = require('../utils/httpTools'),
	  orderModel = require('../model/productionOrderModel'),
	  productModel = require('../model/ProductModel').Product,
	  format = require('../utils/format'),
	  _ = require('lodash'),
	  logFactory = require('../utils/log'),
	  log = new logFactory.Logger('productionOrderController');

Joi.objectId = require('joi-objectid')(Joi);


//Request Validation Objects
const orderPayloadValidate = {
	_id:              Joi.objectId(),
	code:             Joi.string(),
	productId:        Joi.objectId().required(),
	quantity:         Joi.number().required(),
	originalDeadline: Joi.date().iso().required(),
	revisedDeadline:  Joi.date().iso(),
	type:             Joi.number().valid([1, 2]).required(),
	salesOrderId:     Joi.objectId(),
  status:           Joi.number().valid([0, 1, 2])
}

exports.createOrder = {
	validate: {
		payload: orderPayloadValidate
	},
	handler: function(request, reply) {

		productModel.findById(request.payload.productId, function(err, doc){
			if (err) {
				log.error(request, {err: 'Mongo Error', message: err});
				return reply(Boom.badImplementation());
			}

			if (!doc) {
				return reply(Boom.badData(request.i18n.__("productionOrder.productNotFound")));
			}

			let orderInstance = new orderModel(request.payload);

			orderInstance.save(function(err, doc) {
				if (!err) {
					return reply(format(doc, ['DELETED', '__v', 'createdAt', 'updatedAt']))
					.created('/productionOrders/' + doc._id);
				}

				if (err.code && err.code === 11000) {
					return reply(Boom.badData(request.i18n.__("productionOrder.codeNotUnique")));
				}

				log.error(request, {err: 'Mongo Error', message: err});
				return reply(Boom.badImplementation());
			});
		});
	}
}

exports.listOrders = {
	validate: {
		query: {
			_search: Joi.string(),
			_limit: Joi.number().min(1),
			_page: Joi.number().min(1)
		}
	},
	handler: function(request, reply) {
		httpTools.searchQuery(null, request.query, {}, function(search, filters) {

			search["$and"] = [{DELETED: {$eq: false}}];
			filters.select= {DELETED: 0, __v: 0, createdAt: 0, updatedAt: 0};

			orderModel.paginate(search, filters, function(err, obj) {
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

exports.getOrderById = {
	validate: {
		params: {
			orderId: Joi.objectId()
		}
	},
	handler: function(request, reply) {
		let options = {DELETED: 0, __v: 0, createdAt: 0, updatedAt: 0};

		orderModel.find({_id: request.params.orderId, DELETED: false})
		.select(options)
		.exec(function(err, docs) {
			if (err) {
				log.error(request, {err: 'Mongo Error', message: err});
				return reply(Boom.badImplementation());
			}

			if (!docs || !docs.length || docs.length < 1) {
				return reply(Boom.notFound(request.i18n.__("productionOrder.notFound")));
			}

			return reply(docs[0]);
		});
	}
}

exports.updateOrder = {
	validate: {
		params: {
			orderId: Joi.objectId()
		},
		payload: orderPayloadValidate
	},
	handler: function(request, reply) {
		orderModel.update({_id: request.params.orderId, DELETED: false}, request.payload, function(err, numAffetcted) {
			if (err) {
				log.error(request, err);
				return reply(Boom.badImplementation());
			}

			if (numAffetcted.n === 0) {
				return reply(Boom.notFound(request.i18n.__("productionOrder.notFound")));
			}

			return reply().code(204);
		});
	}
}

exports.deleteOrder = {
	validate: {
		params: {
			orderId: Joi.objectId()
		}
	},
	handler: function(request, reply) {
		orderModel.update({_id: request.params.orderId, DELETED: false}, {$set: {DELETED: true}}, function(err, numAffetcted) {
			if (err) {
				log.error(request, err);
				return reply(Boom.badImplementation());
			}

			if (numAffetcted.n === 0) {
				return reply(Boom.notFound(request.i18n.__("productionOrder.notFound")));
			}

			return reply().code(204);
		});
	}
}
