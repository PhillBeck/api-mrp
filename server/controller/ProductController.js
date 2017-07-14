'use strict';

var Joi = require('joi'),
	Boom = require('boom'),
	httpTools = require('./../utils/httpTools'),
	ProductModel = require('../model/ProductModel').Product,
	mongoose = require('mongoose'),
	uuidV4 = require('uuid/v4'),
	_ = require('lodash'),
	async = require('async'),
	formatOutput = require('../utils/format'),
	logFactory = require('../utils/log'),
	productionOrderModel = require('../model/productionOrderModel'),
	necessityModel = require('../model/NecessityModel').Necessity,

	log = new logFactory.Logger('ProductController');

mongoose.Promise = require('q').Promise;
Joi.objectId = require('joi-objectid')(Joi);

function DocNode() {
	this.node= {
		data:{
			nodeData: {},
			parentNode: {},
			sonNode: {},
			relationNode: {}
		},
		isMultiDelete: false,
		direction: '<',
		relationName: 'COMPOSED_BY',
		labels:{
			nodeLabel:'Product',
			parentLabel:'Product',
			sonLabel:'Product'
		}
	},
	this.document= {}
};

const productPayloadValidate = {
	code:          Joi.string().required(),
	name:          Joi.string().required(),
	family:        Joi.string(),
	productType:   Joi.number(),
	description:   Joi.string(),
	unit:          Joi.string(),
	leadTime:      Joi.number(),
	purchasePrice: Joi.number(),
	_id: 		       Joi.objectId(),
  stdWarehouse:  Joi.objectId(),
  stock: Joi.array().sparse().items(
    Joi.object().keys({
      warehouse: Joi.objectId().required(),
      quantity: Joi.number().required()
    })
  )
}

exports.create = {
	validate: {
		payload: productPayloadValidate
	},
	handler: function (request, reply) {

		if (!isValidProductType(request.payload)) {
			return reply(Boom.badData(request.i18n.__("product.invalidProductType")));
		}

		var config = new DocNode();

		config.document = request.payload;
		delete config.document._id;

		ProductModel.insertDocNode(config, function (err, product) {
			if (!err) {
				return reply(formatOutput(product, ['__v', 'DELETED'])).created('/products/' + product._id);
			}

			switch (err.error) {
				case 'duplicateKeyError':
					return reply(Boom.badData(request.i18n.__("product.codeNotunique")));
					break;
				case 'invalidConfigError':
				case 'mongoError':
				case 'neo4jError':
				default:
					log.error(request, err);
					return reply(Boom.badImplementation());
			}
		});
	}
};

exports.remove = {
	validate: {
		params : {
			_id: Joi.objectId().required()
		}
	},
	handler: function(request, reply) {

		validateDelete(request.params._id, function(err) {

			if (err) {
				switch (err.error) {
					case 'productionOrderValidationError':
						return reply(Boom.badData(request.i18n.__("product.delete.productionOrderReference")));
						break;
					case 'necessityValidationError':
						return reply(Boom.badData(request.i18n.__("product.delete.necessityReference")));
						break;
					case 'structureValidationError':
						return reply(Boom.badData(request.i18n.__("product.delete.structureReference")));
						break;
					default:
						log.error(request, err);
						return reply(Boom.badImplementation());
				}
			}

			var config = new DocNode();
			config.document._id = request.params._id;

			ProductModel.softDeleteDocNode(config, function(err) {
				if (!err) {
					reply().code(204);
					return;
				}

				switch (err.error) {
					case 'notFound':
						return reply(Boom.notFound(request.i18n.__("product.notFound")));
						break;
					default:
						log.error(request, err);
						return reply(Boom.badImplementation());
				}
			});
		});
	}
};

exports.update = {
	validate: {
		payload: productPayloadValidate,
		params: {
			_id:  		   Joi.objectId().required()
		}
	},
	handler: function (request, reply) {

		if (!isValidProductType(request.payload)) {
			return reply(Boom.badData(request.i18n.__("product.invalidProductType")));
		}

		var config = new DocNode();

		config.document = request.payload;
		config.document._id = request.params._id;

		ProductModel.updateDocNode(config, function(err, obj) {
			if (!err) {
				return reply().code(204);
			}

			switch (err.error) {
				case 'notFound':
					return reply(Boom.notFound(request.i18n.__("product.notFound")));
					break;
				default:
					log.error(request, err);
					return reply(Boom.badImplementation());
			}
		});
	}
};

exports.getProducts = {
	validate: {
		query: {
			_page: Joi.number().integer(),
			_limit: Joi.number().integer(),
			_search:  Joi.string()
		}
	},
	handler: function(request, reply) {
		httpTools.searchQuery(null, request.query, null, function(search, filters) {
			search["$and"] = [{DELETED: {$eq: false}}];
			ProductModel.paginate(search, filters, function(err, product){
				if (!err) {
					return reply(formatOutput(product, ['__v', 'DELETED']));
				}

				switch (err.error) {
					case 'notFound':
						return reply(Boom.notFound(request.i18n.__("product.notFound")));
						break;
					default:
						log.error(request, err);
						return reply(Boom.badImplementation(err));
				}
			});
		}, function(err) {
			reply(Boom.badRequest(request.i18n.__( "httpUtils.badQuery" )));
		});
	}
};

exports.getProductById = {
	validate: {
		params: {
			_id: Joi.objectId().required()
		}
	},
	handler: function(request, reply) {
		ProductModel.findById(request.params._id, function(err, doc) {
			if (err) {
				log.error(request, err)
				return reply(Boom.badImplementation);
			}

			if (!doc || doc.DELETED != false) {
				return reply(Boom.notFound(request.i18n.__("product.notFound")));
			}
			try {
				var ret = formatOutput(doc, ['__v', 'DELETED']);
			}
			catch (e) {
				log.error(request, e);
			}
			return reply(ret);
		});
	}
};

exports.addChildren = {
	validate: {
		params: {
			_parentId: Joi.string().required(),
			_childId: Joi.string().required()
		},
		payload: {
			quantity: Joi.number().required(),
			relationshipId: Joi.string()
		}
	},
	handler: function(request, reply) {

		if (request.params._parentId == request.params._childId) {
			return reply(Boom.badData('Product cannot reference itself as a child'));
		}

		var config = new DocNode();

		config.node.data.parentNode._id = request.params._parentId;
		config.node.data.sonNode._id = request.params._childId;
		config.node.data.relationNode.quantity = request.payload.quantity;
		if (request.payload.relationshipId) {
			config.node.data.relationNode.relationshipId = request.payload.relationshipId;
		}
		else {
			config.node.data.relationNode.relationshipsId = uuidV4();
		}

		validateChildren(request.params._parentId, request.params._childId, function(err) {
			if (err) {
				return reply(Boom.badData(request.i18n.__("produto.addChildren.circularDependencies")));
			}

			ProductModel.associateNodes(config, function(err, obj) {
				if(!err) {
					return reply().code(204);
				}

				switch (err.error) {
					case 'notFound':
						return reply(Boom.notFound(request.i18n.__("product.notFound")));
						break;
					default:
						log.error(request, err);
						return reply(Boom.badImplementation());
				}
			});
		});
	}
};

exports.getChildren = {
	validate: {
		params: {
			_id: Joi.objectId().required()
		}
	},
	handler: function(request, reply) {

		var searchConfig = {
			depth: 0,
			direction: '<',
			recordsPerPage: 10,
			page: 0,
			document : {}
		};

		searchConfig.document._id = request.params._id;

		ProductModel.getRelationships(searchConfig, function(err, obj) {
			if (!err) {
				var docs = [];
				docs.push(extractTreeData(obj.docs));
				return reply(docs);
			}

			switch(err.error) {
				case 'notFound':
					return reply(Boom.notFound(request.i18n.__("product.notFound")));
					break;
				default:
					log.error(request, err);
					return reply(Boom.badImplementation());
			}
		});
	}
};

exports.removeChildren = {
	validate: {
		params: {
			_parentId: Joi.string().required(),
			_childId: Joi.string().required()
		}
	},
	handler: function(request, reply) {

		var config = new DocNode();
		config.node.data.parentNode._id = request.params._parentId;
		config.node.data.sonNode._id = request.params._childId;

		ProductModel.disassociate(config, function(err, obj) {
			if (!err) {
				return reply().code(204);
			}

			switch(err.error) {
				case 'notFound':
					return reply(Boom.notFound(request.i18n.__("product.notFound")));
					break;
				default:
					log.error(request, err);
					return reply(Boom.badImplementation());

			}
		});
	}
};

function validateChildren(parentId, childId, callback) {

	var searchConfig = {
		depth: 0,
		direction: '<',
		recordsPerPage: 10,
		page: 0,
		document : {}
	};

	searchConfig.document._id = childId;

	ProductModel.getDependencies(searchConfig, function(err, obj) {
		if (err) {
			return callback(err);
		}

		if (obj.indexOf(parentId) != -1) {
		    return callback(422);
		}
		else {
			return callback(undefined)
		}
	});
}

function validateDelete(id, callback) {
	async.parallel([
		validateProductionOrder.bind(null, id),
		validateNecessity.bind(null, id),
		validateStructure.bind(null, id)
	], function(err) {
		callback(err);
	});
}

function validateProductionOrder(id, callback) {
	productionOrderModel.count(
		{ productId: id, DELETED: false }
		, function(err, count) {
			if (err) {
				return callback({error: 'mongoError', message: err}, null);
			}

			if (count > 0) {
				let error = {
					error: 'productionOrderValidationError',
					message: ''
				};
				return callback(error, null);
			}

			return callback(null, null);
		}
	);
}

function validateNecessity(id, callback) {
	necessityModel.count(
		{ 'items.productId': mongoose.Types.ObjectId(id) }
		, function(err, count) {
			if (err) {
				return callback({error: 'mongoError', message: err}, null);
			}

			if (count > 0) {
				let error = {
					error: 'necessityValidationError',
					message: ''
				};
				return callback(error, null);
			}

			return callback(null, null);
		}
	);
}

function validateStructure(id,callback) {
	let searchConfig = {
		depth: 1,
		direction: '>',
		recordsPerPage: 10,
		page: 0,
		document : {}
	};

	searchConfig.document._id = id;

	ProductModel.getRelationships(searchConfig, function(err, obj) {
		if (err) {
			if (err.error === 'notFound') {
				return callback(null, null);
			}
			return callback(err);
		}

		if (obj.docs.relationships) {
			let error ={
				error: 'structureValidationError',
				message: ''
			}

			return callback(error, null);
		}

		return callback(null, null);
	});
}

function extractTreeData(obj) {

	var ret = {};

	ret.id = uuidV4();
	ret.text = obj.code + ' - ' + obj.name;
	ret.data = obj.relationProperties;
	if(ret.data == undefined){
		ret.data = {};
	}

	ret.data._id = obj._id;

	if (obj.relationships) {
		ret.children = obj.relationships.map(extractTreeData);
	}
	return ret;
}

function arrayObjectIndexOf(myArray, searchTerm, property) {
	for(var i = 0, len = myArray.length; i < len; i++) {
		if (myArray[i][property] == searchTerm) {
			return i;
		}
	}
	return -1;
}

function isValidProductType(data) {
	return _.includes([1,2], data.productType);
}
