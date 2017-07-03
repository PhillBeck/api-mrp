'use strict';

const Joi = require('joi'),
	  Boom = require('boom'),
	  httpTools = require('../utils/httpTools'),
	  NFModel = require('../model/NFModel').NF,
	  format = require('../utils/format'),
	  _ = require('lodash'),
	  logFactory = require('../utils/log'),
	  log = new logFactory.createLogger('NFController');

Joi.objectId = require('joi-objectid')(Joi);

const nfItemPayloadValidate = {
	productId: Joi.objectId().required(),
	quantity: Joi.number().integer().required(),
	batch: Joi.string().required(),
	unitPrice: Joi.number().required(),
	movementId: Joi.objectId()
}

//Request Validation Objects
const nfPayloadValidate = {
	_id: Joi.objectId(),
	nf: Joi.string().required(),
	cnpj: Joi.string(),
	serie: Joi.string().required(),
	emittedAt: Joi.date().required(),
	items: Joi.array().items(Joi.object().keys(nfItemPayloadValidate)),
	DELETED: Joi.boolean()
}

exports.createNF = {
	validate: {
		payload: nfPayloadValidate
	},
	handler: function(request, reply) {
			let nfInstance = NFModel(request.payload);

			nfInstance.save(function(err, doc) {
				if (!err) {
					return reply(format(doc, ['DELETED', '__v', 'createdAt', 'updatedAt']))
					.created('/nfs/' + doc._id);
				}

				if (err.code && err.code === 11000) {
					return reply(Boom.badData(request.i18n.__("nf.codeNotUnique")));
				}

				log.error(request, {err: 'Mongo Error', message: err});
				return reply(Boom.badImplementation(err));
			});
	}
}

exports.listNFs = {
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

			NFModel.paginate(search, filters, function(err, obj) {
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

exports.getNFById = {
	validate: {
		params: {
			nfId: Joi.objectId()
		}
	},
	handler: function(request, reply) {
		let options = { __v: 0, createdAt: 0, updatedAt: 0};

		NFModel.find({_id: request.params.nfId})
		.select(options)
		.exec(function(err, docs) {
			if (err) {
				log.error(request, {err: 'Mongo Error', message: err});
				return reply(Boom.badImplementation());
			}

			if (!docs || !docs.length || docs.length < 1) {
				return reply(Boom.notFound(request.i18n.__("nf.notFound")));
			}

			return reply(docs[0]);
		});
	}
}

exports.updateNF = {
	validate: {
		params: {
			nfId: Joi.objectId()
		},
		payload: nfPayloadValidate
	},
	handler: function(request, reply) {
		NFModel.update({_id: request.params.nfId}, request.payload, function(err, numAffetcted) {
			if (err) {
				log.error(request, err);
				return reply(Boom.badImplementation());
			}

			if (numAffetcted.n === 0) {
				return reply(Boom.notFound(request.i18n.__("nf.notFound")));
			}

			return reply().code(204);
		});
	}
}

exports.deleteNF = {
	validate: {
		params: {
			nfId: Joi.objectId()
		}
	},
	handler: function(request, reply) {
		NFModel.remove({_id: request.params.nfId}, function(err, numAffetcted) {
			if (err) {
				log.error(request, err);
				return reply(Boom.badImplementation());
			}

			if (numAffetcted.n === 0) {
				return reply(Boom.notFound(request.i18n.__("nf.notFound")));
			}

			return reply().code(204);
		});
	}
}
