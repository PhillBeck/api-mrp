'use strict';

var Joi = require('joi'),
  Boom = require('boom'),
  httpTools = require('./../utils/httpTools'),
  Produto = require('../model/ProdutoModel').Produto,
  mongoose = require('mongoose'),
  fs = require('fs'),
  fsExtra = require('fs-extra'),
  uuidV4 = require('uuid/v4'),
  flattenMongooseValidationError = require('flatten-mongoose-validation-error'),
  findRemoveSync = require('find-remove');


function validateChildren(produto, listOfAncestors){
  var ret = true;
  var children = produto.children;

  if(listOfAncestors.indexOf(produto._id) != -1) {
    return false;
  }

  listOfAncestors.push(produto._id);
  for (var i = 0; i < children.length; i++) { 
    ret = ret && validateChildren(children[i].childrenId, listOfAncestors);
  }
  listOfAncestors.splice(listOfAncestors.indexOf(produto._id),1);
  return ret;
}


exports.create = {
  validate: {
    payload: {
      code : Joi.string().required(),
      name : Joi.string().required(),
      family : Joi.string(),  
      description : Joi.string(),
      amountInStock : Joi.number(),
      unit : Joi.string(),
      leadTime : Joi.number(),
      costValue : Joi.number(),
      children : Joi.array().items(Joi.object().keys({
        childrenId : Joi.string(),
        quantity : Joi.number(),
      }))
    }
  },
  handler: function (request, reply) {
    var produto = new Produto(request.payload);
    produto.save(function (err, produto) {
      if (!err) {
        return reply(produto).created('/produtos/' + produto.cod); // HTTP 201
      }
      console.log(err)
      return reply(Boom.badData()); // HTTP 422 error
    });
  }
};

exports.remove = {
  validate: {
    params : {
      _id: Joi.string().required()
    }
  },
  handler: function(request, reply) {
    Produto.findByIdAndRemove(request.params._id, function(err, doc) {
      if (!err) {
        return reply().code(204);
      }
      return reply(Boom.badData());
    })
  }
};

exports.update = {
  validate : {
    payload : {
      _id : Joi.string().required(),
      code : Joi.string().required(),
      name : Joi.string().required(),
      family : Joi.string(),
      description : Joi.string(),
      amountInStock : Joi.number(),
      unit : Joi.string(),
      leadTime : Joi.number(),
      costValue : Joi.number(),
      children : Joi.array().items(Joi.object().keys({
        childrenId : Joi.string(),
        quantity : Joi.number(),
      }))
    }
  },
  handler: function (request, reply) {
    
    if(request.params._id != request.payload._id) {
      return reply(Boom.badData('Payload has different Id than path parameter'));   //HTTP 422 Error
    };

    if(!validateChildren(request.payload,[])) {
      return reply(Boom.badData('A Product cannot reference itself as a children'));   //HTTP 422 Error
    };

    var query = {};
    query._id = request.params._id;

    Produto.findOneAndUpdate(query, request.payload, {upsert:'true'}, function(err, doc) {
      if (!err) {
        return reply().code(204);
      }
      console.log(err);
      return reply(Boom.badRequest(err)); //HTTP 500 error

    });
  }
};

exports.getProducts = {
  validate : {
    query: {
      _page : Joi.number().integer(),
      _limit : Joi.number().integer(),
      _search : Joi.string()
    }
  },
  handler: function(request, reply) { 
    httpTools.searchQuery(null, request.query, {populate: {path: 'children.childrenId', model: 'produto'}}, function(search, filters){
      Produto.paginate(search, filters, function(err, product){
        if (!err) {
          return reply(product);
        }
        return reply(Boom.badImplementation(err));  //HTTP 500 error

      });
    }, function(err) {
      reply(Boom.BadData(err)); //HTTP 500 error
    });
  }
};

exports.getProductById = {
  validate : {
    params : {
      _id : Joi.string().required()
    }
  },
  handler: function(request, reply) {
    Produto.findById(request.params._id, function(err, doc) {
      if (err) {
        return reply(Boom.badData('Product not found'));
      }
      return reply(doc);
    });
  }

};