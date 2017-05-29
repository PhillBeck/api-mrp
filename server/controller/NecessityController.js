'use strict';

var Joi = require('joi'),
Boom = require('boom'),
httpTools = require('./../utils/httpTools'),
Necessity = require('../model/NecessityModel').Necessity,
Product = require('../model/ProdutoModel').Produto,
mongoose = require('mongoose');
Joi.objectId = require('joi-objectid')(Joi);


exports.createNecessity = {
	validate: {
		payload: {
			description:   Joi.string().required(),
			items:         Joi.array().items(Joi.object().keys({
				productId: Joi.string().required(),
				quantity:  Joi.number().required(),
				deadline:  Joi.string().required()
			}))
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
					case 400:
						return reply(Boom.badRequest(e.message));
						break;
					case 404:
						return reply(Boom.notFound(e.message));
						break;
					case 422:
						return reply(Boom.badData(e.message));
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
					return reply(Boom.badRequest(err));
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
			_id:           Joi.string(),
			__v:           Joi.number(),
			createdAt:     Joi.string(),
			updatedAt:     Joi.string(),
			description:   Joi.string().required(),
			items:         Joi.array().items(Joi.object().keys({
				productId: Joi.string().required(),
				quantity:  Joi.number().required(),
				deadline:  Joi.string().required(),
				_id:       Joi.string()
			}))
		},
		params: {
			_id:           Joi.string().required()
		}
	},
	handler: function(request, reply) {

		var obj = cleanNecessity(request.payload);
		var _id = request.params._id;


		checkItems(request.payload.items, function(e) {
			if (!e) {

				Necessity.update({_id: _id}, {$set: obj}, function(err, numAffected) {
					if (!err) {
						console.log(numAffected);
						if (numAffected.nModified != 0) {
							return reply().code(204);
						}
						return reply(Boom.notFound('Necessity Not Found'));
					}

					console.log(err);
					switch (err.name) {
						case 'CastError':
							return reply(Boom.badRequest('Invalid Id'));
							break;
						default:
							return reply(Boom.badImplementation());
					}
				});
			}
			else {
				switch (e.error) {
					case 400:
						return reply(Boom.badRequest(e.message));
						break;
					case 404:
						return reply(Boom.notFound(e.message));
						break;
					case 422:
						return reply(Boom.badData(e.message));
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
			_id: Joi.objectId()
		}
	},
	handler: function(request, reply) {

		Necessity.findById(request.params._id, function(err, doc) {
			if (!err) {
				if(doc) {
					reply(doc);
					return
				}
				reply(Boom.notFound('Necessity Not Found'));
				return
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
		Necessity.remove({_id: request.params._id}, function(err, numAffected) {
			if (!err) {
				if (numAffected.n != 0) {
					return reply().code(204);
				}

				return reply(Boom.notFound('Necessity Not Found'));
			}

			console.log(err);
			return reply(Boom.badImplementation());
		});
	}
};

exports.

function checkItems(items, callback) {

	if (!items) {
		return callback(undefined);
	}

	console.log(items);

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

		callback({error: 404, message: 'Could not find products ' + difference.toString()});
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