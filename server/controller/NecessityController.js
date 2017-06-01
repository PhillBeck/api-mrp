'use strict';

var Joi = require('joi'),
	Boom = require('boom'),
	httpTools = require('./../utils/httpTools'),
	Necessity = require('../model/NecessityModel').Necessity,
	Product = require('../model/ProdutoModel').Produto,
	async = require('async'),
	_ = require('lodash'),
	mongoose = require('mongoose');
Joi.objectId = require('joi-objectid')(Joi);


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
						return reply(doc);
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
			filters.populate = {path: 'items.productId'};
			filters.select = '-items';
			Necessity.paginate(search, filters, function(err, product) {
				if (!err) {
					return reply(product);
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
						return reply(Boom.notFound(request.i18n.__("necessity.notFound")));
					}

					console.log(err);
					return reply(Boom.badImplementation());
				});
			}
			else {
				switch (e.error) {
					case 404:
						return reply(Boom.notFound(request.i18n.__("necessity.productNotFoundList") + e.message));
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
		Necessity.findById(request.params.necessityId).select('-items -__v').exec(function(err, doc) {
			if (!err) {
				if (doc) {
					return reply(doc);
				}

				return reply(Boom.notFound(request.i18n.__("request.notFound")));
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
			_page: Joi.number(),
			_limit: Joi.number()
		}
	},
	handler: function(request, reply) {

		var options = {};
		options.page = request.query._page === undefined ? 1 : request.query._page;
		options.limit = request.query._limit === undefined ? 10 : request.query._limit;
		options.skip = options.limit * (options.page - 1);

		if (options.page === 0 || options.limit === 0) {
			return reply(Boom.badRequest(request.i18n.__("httpUtils.badQuery")));
		}

		Necessity.aggregate([
			{$match: {_id: mongoose.Types.ObjectId(request.params.necessityId)}},
			{$project: {
				_id: 1,
				items: 1,
				total: {$size: "$items"}
			}},
			{$unwind: "$items"},
			{$skip: options.skip},
			{$limit: options.limit},
			{$group: {
				_id: "$_id",
				docs: {$push: "$items"},
				total: {$first: "$total"},
			}},
			{$addFields: {
				page: options.page,
				pages: {$ceil: {$divide: ["$total", options.limit]}},
				limit: options.limit
			}},
			{$project: {_id: 0}}],
			function(err, doc) {
				if (!err) {
					return reply(doc[0]);
				}
				console.log(err);
				return reply(Boom.badImplementation());
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
		
		Product.count({ _id: request.payload.productId }, function(err, count) {
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
								return reply(Boom.notFound(request.i18n.__("necessity.notFound")));
							}
						}
						else {
							console.log(e);
							return reply(Boom.badImplementation());
						}
					});
				}
				else {
					return reply(Boom.notFound(request.i18n.__("necessity.productNotFound")));
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
					try {
						item = doc.items.id(request.params.itemId).remove();

						doc.save(function(e) {
							if (!e) {
								return reply().code(204);
							}
							return reply(Boom.badImplementation());
						});
					}
					catch (e) {
						console.log(e);
						return reply().code(204);
					}
				}
				return reply(Boom.notFound(request.i18n.__("necessity.notFound")));
			}
			console.log(err);
			return reply(Boom.badImplementation());
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
						return reply(Boom.notFound(request.i18n.__("necessity.items.notFound")));
					}
				}
				else {
					return reply(Boom.notFound(request.i18n.__("necessity.notFound")));
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
			necessityId: Joi.objectId().required()
		}
	},
	handler: function(request, reply) {

		Necessity.findById(request.params.necessityId, function(err, doc) {
			if (!err) {
				if (doc) {
						calculateMaterials(doc, reply);
				}
				else {
					return reply(Boom.notFound(request.i18n.__("necessity.notFound")));
				}
			}
			else {
				console.log(err);
				return reply(Boom.badImplementation());
			}
		});
	}
};

function calculateMaterials(necessity, reply) {
	if (!necessity.items || !(necessity.items.length > 0)) {
		done(new Error('Empty items list'));
	}

	async.map(necessity.items, function(item, done) {

		var searchConfig = {
			depth: 0,
			direction: '<',
			recordsPerPage: 10,
			page: 0,
			document : {}
		};

		searchConfig.document._id = item.productId;

		Product.getRelationships(searchConfig, function(err, obj) {
			if (!err) {

				let materials = [];
				prepareMaterialsArray(obj.docs, item.quantity, materials);
				done(undefined,materials);
				return
			}
			done();
			return;
		});
	}, function(err, results) {

		let aux = _.flatten(results);

		console.log(results[0]);
		console.log(aux);

		let ret = groupObjectArrayBy(aux, 'id', function(element, acumulator) {
			if (acumulator && acumulator.quantity) {
				acumulator.quantity += element.quantity;
				return acumulator;
			}

			return element;

		})

		return reply(ret);
	});
}

function prepareMaterialsArray(product, currentQuantity, array) { 

	currentQuantity = currentQuantity === undefined ? 1 : currentQuantity;
	var obj = {id: product._id};

	if (product.relationProperties) {
		let quantity = product.relationProperties.quantity === undefined ? 1 : product.relationProperties.quantity
		currentQuantity = currentQuantity * product.relationProperties.quantity;
	}

	obj.quantity = currentQuantity;

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
	Product.find({_id: ids}, '_id', function(err, docs) {
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