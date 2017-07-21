'use strict';

const Joi = require('joi'),
	  Boom = require('boom'),
	  httpTools = require('../utils/httpTools'),
		ProductModel = require('../model/ProductModel').Produto,
		stockModel = require('../model/stockModel'),
		pledgeModel = require('../model/pledgeModel'),
		WarehouseModel = require('../model/WarehouseModel').Warehouse,
		productionOrderModel = require('../model/productionOrderModel'),
	  format = require('../utils/format'),
	  _ = require('lodash'),
	  logFactory = require('../utils/log'),
	  log = new logFactory.Logger('WarehouseController');

Joi.objectId = require('joi-objectid')(Joi);


//Request Validation Objects
const warehouseloadValidate = {
	_id: Joi.objectId(),
	code: Joi.string().required(),
	description: Joi.string(),
	validSince: Joi.date().required(),
	unitId: Joi.objectId().required(),
	allowNegativeStock: Joi.boolean(),
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
		ProductModel.find({'stdWarehouse': response._id}, (err, response) => {

			if(err) {
				return reply(Boom.badImplementation(err));
			}
			else if (response) {
				if(response.length > 0){
					return reply(Boom.badData(request.i18n.__("warehouse.removeError")));
				}
			}

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
		});
	}
}

exports.getProductStock = {
	validate: {
		params: {
			warehouseId: Joi.objectId().required(),
			productId: Joi.objectId().required()
		}
	},
	handler: function(request, reply) {

		let promises = [];
		var product = request.params.productId;
		var warehouse = request.params.warehouseId;

		getStock(warehouse, product)
		.then(reply)
		.done();
	}
}

function getStock(warehouse, product) {
	return stockModel
		.findOne({warehouse: warehouse, product: product})
		.then((stock) => {
			if (!stock) {
				stock = {
					product: product,
					warehouse: warehouse,
				}
			}
	
			stock.stock = stock.quantity || 0;
			delete stock.quantity;

			return stock;
		})
		.then(getPledgeTotal.bind(this, warehouse, product))
		.then(getTotalPlannedProduction.bind(this, warehouse, product))
		.catch((err) => { throw err });
}

function getPledgeTotal(warehouse, product, stock) {
	return pledgeModel
		.calculatePledges(product, warehouse)
		.then((pledges) => {
			return (pledges[0] && pledges[0].quantity) || 0;
		}).then((pledge) => {
			stock.pledged = pledge;
			return stock;
		})
		.catch((err) => { throw err });
}

function getTotalPlannedProduction(warehouse, product, stock) {
	return productionOrderModel
		.getTotalPlannedProduction(warehouse, product)
		.then((planned) => {
			stock.planned = planned || 0;
			return stock;
		})
		.catch((err) => { throw err });
}