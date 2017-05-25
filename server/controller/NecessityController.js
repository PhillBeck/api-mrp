'use strict';

var Joi = require('joi'),
Boom = require('boom'),
httpTools = require('./../utils/httpTools'),
Necessity = require('../model/NecessityModel').Necessity,
Product = require('../model/ProdutoModel').Produto,
mongoose = require('mongoose'),
fs = require('fs'),
fsExtra = require('fs-extra'),
uuidV4 = require('uuid/v4'),
flattenMongooseValidationError = require('flatten-mongoose-validation-error'),
findRemoveSync = require('find-remove');


exports.create = {
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

		checkItems(request.payload, function(e) {

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


function checkItems(necessity, callback) {

	if (!necessity) {
		callback({error: 422, message:'Items Array Cannot Be Empty'});
	}

	try {
		var ids = necessity.items.map(a => a.productId).filter(onlyUnique);
	}
	catch (e) {
		console.log(e);
		throw 'Unexpected Error';
	}

	console.log(ids);

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