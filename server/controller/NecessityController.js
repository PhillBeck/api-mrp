'use strict';

var Joi = require('joi'),
	Boom = require('boom'),
	httpTools = require('./../utils/httpTools'),
	Necessity = require('../model/NecessityModel').Necessity,
  ProductModel = require('../model/ProductModel').Product,
	async = require('async'),
	_ = require('lodash'),
	mongoose = require('mongoose'),
	log = require('../utils/log'),
	formatOutput = require('../utils/format'),
	shallowClone = require('../utils/shallowClone'),
	materialList = require('../model/materialListModel'),
	exportNecessity = require('../service/necessityExport');
Joi.objectId = require('joi-objectid')(Joi);

mongoose.Promise = require('q').Promise;


exports.createNecessity = {
	validate: {
		payload: {
			name:          Joi.string().required(),
			description:   Joi.string().required()
		}
	},
	handler: function(request, reply) {

		checkItems(request.payload.items, function(e) {

			var necessity = new Necessity(request.payload);

			if (!e) {
				necessity.save(function(err, doc) {
					if (!err) {
						var ret = shallowClone(doc);
						delete ret.__v;
						delete ret.items;
						delete ret.createdAt;
						delete ret.updatedAt;
						return reply(ret).created('/necessities/' + doc._id);
					}

					console.log(err);
					return reply(Boom.badImplementation());
				});
			}
			else {
				switch (e.error) {
					case 404:
						return reply(Boom.notFound(request.i18n.__( "necessity.productNotFoundList" ) + e.message));
						break;
					default:
						console.log(e);
						return reply(Boom.badImplementation());
				}
			}
		});
	}
};

exports.getNecessities = {
	validate: {
		query: {
			_page: Joi.number().integer(),
			_limit: Joi.number().integer(),
			_search:  Joi.string()
		}
	},
	handler: function(request, reply) {
		httpTools.searchQuery(null, request.query, null, function(search, filters) {
			filters.select = '-items -__v -createdAt -updatedAt';
			Necessity.paginate(search, filters, function(err, doc) {
				if (!err) {
					return reply(doc);
				}

				console.log(err);
				return reply(Boom.badImplementation(err));
			});
		}, function(err) {
			console.log(err);
			switch (err.status) {
				case 400:
					return reply(Boom.badRequest(request.i18n.__("http.badQuery")));
					break;
				default:
					return reply(Boom.badImplementation());
			}
		});
	}
};

exports.updateNecessity = {
	validate: {
		payload: {
			_id:           Joi.objectId(),
			__v:           Joi.number(),
			name:          Joi.string().required(),
			createdAt:     Joi.string(),
			updatedAt:     Joi.string(),
			description:   Joi.string().required()
		},
		params: {
			_id:           Joi.objectId().required()
		}
	},
	handler: function(request, reply) {

		var obj = cleanNecessity(request.payload);
		var _id = request.params._id;


		checkItems(request.payload.items, function(e) {
			if (!e) {

				Necessity.update({_id: _id}, {$set: obj}, function(err, numAffected) {
					if (!err) {
						if (numAffected.nModified != 0) {
							return reply().code(204);
						}
						return reply(Boom.notFound(request.i18n.__( "necessity.notFound" )));
					}

					console.log(err);
					return reply(Boom.badImplementation());
				});
			}
			else {
				switch (e.error) {
					case 404:
						return reply(Boom.notFound(request.i18n.__( "necessity.productNotFoundList" ) + e.message));
						break;
					default:
						console.log(e);
						return reply(Boom.badImplementation());
				}
			}
		});
	}
};

exports.getNecessityById = {
	validate: {
		params: {
			necessityId: Joi.objectId().required()
		}
	},
	handler: function(request, reply) {
		Necessity.findById(request.params.necessityId).select('-items -__v -createdAt -updatedAt').exec(function(err, doc) {
			if (!err) {
				if (doc) {
					return reply(doc);
				}

				return reply(Boom.notFound(request.i18n.__("necessity.notFound")));
			}

			console.log(err);
			return reply(Boom.badImplementation());
		})
	}
};

exports.getItemsByNecessityId = {
	validate: {
		params: {
			necessityId: Joi.objectId().required()
		},
		query: {
			_page: Joi.number().min(1),
			_limit: Joi.number().min(1)
		}
	},
	handler: function(request, reply) {

		var options = {};
		options.page = request.query._page === undefined ? 1 : request.query._page;
		options.limit = request.query._limit === undefined ? 10000 : request.query._limit;
		options.skip = options.limit * (options.page - 1);

		Necessity.aggregate([
			{$match: {_id: mongoose.Types.ObjectId(request.params.necessityId)}},
			{$project: {
				total: {$size: "$items"}
			}}],
			function(err, doc) {
				if (!err) {
					if (doc.length === 0)
					{
						return reply(Boom.notFound(request.i18n.__( "necessity.notFound" )));
					}

					Necessity.aggregate([
						{$match: {_id: mongoose.Types.ObjectId(request.params.necessityId)}},
						{$project: {items: 1}},
						{$unwind: "$items"},
						{$skip: options.skip},
						{$limit: options.limit},
						{$lookup: {
							from: "products",
							localField: "items.productId",
							foreignField: "_id",
							as: "items.productInfo"
						}},
						{$addFields: {
							'items.product': {
								$arrayElemAt: ['$items.productInfo', 0]
							}
						}},
						{$group: {
							_id: null,
							docs: {$push: "$items"}
						}},
						{$project: {
							_id: 0,
							'docs._id': 0,
							'docs.productId': 0,
							'docs.productInfo': 0
						}}
						], function(e, docs) {
							if (e) {
								console.log(e);
								return reply(Boom.badImplementation());
							}

							console.log(docs)

							try {
								var ret = docs[0];
								ret.total = doc[0].total;
							}
							catch (error) {
								var ret = {items: []};
								ret.total = 0;
							}

							ret.pages = Math.ceil(ret.total / options.limit);
							ret.page = options.page;
							ret.limit = options.limit;

							return reply(ret);
						});
				}
				else {
					console.log(err);
					return reply(Boom.badImplementation());
				}
			});
	}
};

exports.deleteNecessity = {
	validate: {
		params: {
			_id: Joi.objectId()
		}
	},
	handler: function(request, reply) {
		Necessity.remove({_id: request.params._id}, function(err, obj) {
			if (!err) {
				if (obj.result.n != 0) {
					return reply().code(204);
				}

				return reply(Boom.notFound(request.i18n.__("necessity.notFound")));
			}

			console.log(err);
			return reply(Boom.badImplementation());
		});
	}
};

exports.addItem = {
	validate: {
		payload: {
			productId: Joi.objectId().required(),
			quantity: Joi.number().required(),
			deadline: Joi.date().iso()
		},
		params: {
			_id: Joi.objectId().required()
		}
	},
	handler: function(request, reply) {

	ProductModel.count({ _id: request.payload.productId }, function(err, count) {
			if (!err) {
				if (count > 0) {
					Necessity.findById(request.params._id, function(e, doc) {
						if (!err) {
							if(doc) {
								doc.items.push(request.payload);

								var item = doc.items[doc.items.length -1];
								doc.save(function(error) {
									if (error) {
										console.log(error);
										return reply(Boom.badImplementation());
									}
									return reply(item);
								});
							}
							else {
								return reply(Boom.notFound(request.i18n.__( "necessity.notFound" )))
							}
						}
						else {
							console.log(e);
							return reply(Boom.badImplementation());
						}
					});
				}
				else {
					return reply(Boom.notFound(request.i18n.__( "necessity.productNotFound" )));
				}
			}
			else {
				console.log(err);
				return reply(Boom.badImplementation());
			}
		});
	}
};

exports.removeItem = {
	validate : {
		params: {
			necessityId: Joi.objectId().required(),
			itemId: Joi.objectId().required()
		}
	},
	handler: function(request, reply) {
		Necessity.findById(request.params.necessityId, function(err, doc) {
			if (!err) {
				if (doc) {

					var item = doc.items.id(request.params.itemId);

					if (!item) {
						return reply(Boom.notFound(request.i18n.__( "necessity.items.notFound" )));
					}

					item.remove();

					doc.save(function(e) {
						if (!e) {
							return reply().code(204);
						}
						console.log(err);
						return reply(Boom.badImplementation());
					});
				}
			}
			else {
				console.log(err);
				return reply(Boom.badImplementation());
			}
		});
	}
};

exports.updateItem = {
	validate: {
		params: {
			necessityId: Joi.objectId().required(),
			itemId: Joi.objectId().required()
		},
		payload: {
			productId: Joi.objectId().required(),
			quantity: Joi.number().required(),
			deadline: Joi.date().iso()
		}
	},
	handler: function(request, reply) {
		Necessity.findById(request.params.necessityId, function(err, doc) {
			if (!err) {
				if (doc) {

					var i = arrayObjectIndexOf(doc.items, request.params.itemId, '_id');

					if (i != -1) {
						doc.items[i] = request.payload;
						doc.items[i]._id = request.params.itemId;
						doc.save(function(e) {

							if (!e) {
								return reply().code(204);
							}
							else {
								console.log(e);
								return reply(Boom.badImplementation());
							}
						});
					}
					else {
						return reply(Boom.notFound(request.i18n.__( "necessity.items.notFound" )));
					}
				}
				else {
					return reply(Boom.notFound(request.i18n.__( "necessity.notFound" )));
				}
			}
			else {
				console.log(err);
				return reply(Boom.badImplementation());
			}
		});
	}
};

exports.calculateMaterials = {
	validate: {
		params: {
			necessityId: Joi.objectId().required()
		},
		query: {
			_search: Joi.string()
		}
	},
	handler: function(request, reply) {

		Necessity.findById(request.params.necessityId, function(err, doc) {
			if (!err) {
				if (doc) {
					calculateMaterials(doc, function(err, docs) {
						if (err) {
							console.log(err);
							return reply(Boom.badImplementation());
						}
						let materialsModel = new materialList({items: docs});

						materialsModel.save(function(err, materials) {
							if (err) {
								console.log(err);
								return reply(Boom.badImplementation());
							}

							exportNecessity(materials)

							return reply().code(204).header('location', '/materials/' + materials._id);
						});
					});
				}
				else {
					return reply(Boom.notFound(request.i18n.__( "necessity.notFound" )));
				}
			}
			else {
				console.log(err);
				return reply(Boom.badImplementation());
			}
		});
	}
};

exports.getMaterials = {
	validate: {
		params: {
			_id: Joi.objectId().required()
		},
		query: {
			_page: Joi.number(),
			_limit: Joi.number()
		}
	},
	handler: function(request, reply) {
		let page = request.query._page === undefined ? 1 : request.query._page;
		let limit = request.query._limit === undefined ? 15 : request.query._limit;
		let id = mongoose.Types.ObjectId(request.params._id);

		materialList.paginateArray({_id: id}, 'items', {page: page, limit: limit}, function(err, obj) {
			if (err) {
				console.log(err);
				return reply(Boom.badImplementation());
			}

			return reply(obj);

		});
	}
}

function calculateMaterials(necessity, callback) {

	async.map(necessity.items, function(item, done) {

		var searchConfig = {
			depth: 0,
			direction: '<',
			recordsPerPage: 10000,
			page: 0,
			document : {}
		};

		searchConfig.document._id = item.productId;

	ProductModel.getRelationships(searchConfig, function(err, obj) {
			if (err) {
				return done(err)
			}

			let materials = [];
			prepareMaterialsArray(obj.docs, item.quantity, materials);
			return done(undefined, materials);
			
		});
	}, function(err, results) {

		if(err) {
			return callback(err);
		}

		let flattenedResults = _.flatten(results);
		let groupedResults = groupObjectArrayBy(flattenedResults, '_id', function(element, acumulator) {
			if (acumulator && acumulator.quantity) {
				acumulator.quantity += element.quantity;
				return acumulator;
			}
			return element;
		});

		return callback(undefined, groupedResults);

		return reply(formatOutput(groupedResults, ['__v', 'relationships', 'DELETED', 'relationProperties']));
	});
}

function prepareMaterialsArray(product, currentQuantity, array) {

	currentQuantity = currentQuantity === undefined ? 1 : currentQuantity;
	var obj = shallowClone(product);

	if (product.relationProperties) {
		let quantity = product.relationProperties.quantity === undefined ? 1 : product.relationProperties.quantity
		currentQuantity = currentQuantity * quantity;
	}

	obj.quantity = currentQuantity;
	delete obj.relationships

	array.push(obj);

	if (product.relationships instanceof Array) {
		product.relationships.forEach(a => {prepareMaterialsArray(a, currentQuantity, array)});
	}
}

function checkItems(items, callback) {

	if (!items) {
		return callback(undefined);
	}

	try {
		var ids = items.map(a => a.productId).filter(onlyUnique);
	}
	catch (e) {
		console.log(e);
		throw 'Unexpected Error';
	}
ProductModel.find({_id: ids}, '_id', function(err, docs) {
		if (err) {
			callback({error: 500, message: err});
		}

		if (ids.length == docs.length) {
			return callback(undefined);
		}

		let docids = docs.map(a => a._id.toString());
		let difference = ids.filter(x => docids.indexOf(x) == -1);

		callback({error: 404, message: difference.toString()});
	});
}

function onlyUnique(value, index, self) {
	return self.indexOf(value) === index;
}

function cleanNecessity(obj) {

	delete obj._id;
	delete obj.__v;
	delete obj.createdAt;
	delete obj.updatedAt;

	if (obj.items) {
		obj.items.forEach(a => {delete a._id;})
	}

	return obj;
}

function groupObjectArrayBy(array, property, iteratee) {
	var ret = [];

	array.forEach(a => {
		let i = arrayObjectIndexOf(ret, a[property], property);

		if (i != -1){
			ret [i] = iteratee(a, ret[i]);
		}
		else {
			ret.push(iteratee(a, undefined));
		}
	})

	return ret;
}

function arrayObjectIndexOf(myArray, searchTerm, property) {
	for(var i = 0, len = myArray.length; i < len; i++) {
		if (myArray[i][property].toString() == searchTerm.toString()) {
			return i;
		}
	}
	return -1;
}
