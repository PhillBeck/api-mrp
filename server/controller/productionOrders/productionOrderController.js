'use strict';

const Joi = require('joi'),
	  Boom = require('boom'),
	  httpTools = require('../../utils/httpTools'),
		orderModel = require('../../model/productionOrderModel'),
		Q = require('q'),
		orderAdapter = require('./productionOrderAdapter'),
		productModel = require('../../model/ProductModel').Product,
		pledgeModel = require('../../model/pledgeModel'),
	  format = require('../../utils/format'),
	  _ = require('lodash'),
	  logFactory = require('../../utils/log'),
	  log = new logFactory.Logger('productionOrderController');

Joi.objectId = require('joi-objectid')(Joi);


//Request Validation Objects
const orderPayloadValidate = {
	_id:              Joi.objectId(),
	code:             Joi.string(),
	product:          Joi.objectId().required(),
	warehouse:        Joi.objectId(),
	quantity:         Joi.number().required(),
	originalDeadline: Joi.date().iso().required(),
	revisedDeadline:  Joi.date().iso(),
	type:             Joi.number().valid([1, 2]).required(),
	salesOrderId:     Joi.objectId(),
	status:           Joi.number().valid([0, 1, 2]),
}

exports.createOrder = {
	validate: {
		payload: orderPayloadValidate
	},
	handler: function(request, reply) {		

		let orderInstance = new orderModel(request.payload);	

		orderAdapter.createOrder(orderInstance)
		.then((order) => {
			reply(format(order, ['DELETED', 'createdAt', 'updatedAt', '__v', '_version']))
			.created(`/movements/${order._id}`);
		})
		.catch((err) => {
			if (err.msg === 'Duplicate Key') {
				return reply(Boom.badData(request.i18n.__("productionOrder.codeNotUnique")));
			}

			if (err.name === 'ValidationError') {
				if (err.target === 'product') {
					return reply(Boom.badData(request.i18n.__("productionOrder.productNotFound")));
				}

				if (err.target === 'warehouse') {
					return reply(Boom.badData(request.i18n.__("productionOrder.warehouseNotFound")));
				}
			}

			log.error(request, err.errObj);
			return reply(Boom.badImplementation());

		}).done(undefined, (err) => {
			log.error(request, err);
			return reply(Boom.badImplementation());
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
			filters.select= {DELETED: 0, __v: 0, createdAt: 0, updatedAt: 0, _version: 0};

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
		let options = {DELETED: 0, __v: 0, createdAt: 0, updatedAt: 0, _version: 0};

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


exports.test = {
	validate: {
		payload: orderPayloadValidate
	},
	handler: function(request, reply) {

		
	}
}

exports.testAgrregate = {
	validate: {},
	handler: function(request, reply) {

		pledgeModel.calculatePledges(request.params.product, request.params.warehouse)
		.then(reply)
		.catch((err) => {
			console.log(err);
			reply(err);
		}).done();
	}
}

function getErrorMessage(err) {
	switch (err.name) {
		case 'Duplicate Key':
			return "productionOrder.codeNotUnique";
	}

	return "productionOrder."
}