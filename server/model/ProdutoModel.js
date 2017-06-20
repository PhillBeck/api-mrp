'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  mongoosePaginate = require('mongoose-paginate'),
  mongooseAggregatePaginate = require('mongoose-aggregate-paginate'),
  neomongoose = require('neomongoose'),
  config = process.env.NODE_ENV === undefined ? require('../config/development') : require('../config/' + process.env.NODE_ENV),
  options = config.neo4j;
/**
  * @module  Produto
  * @description Produto schema
*/

var ProdutoSchema = new Schema({
  code:          {type: String, required: true, unique: true},
  name:          {type: String, required: true},
  family:        {type: String},
  productType:   {type: Number}, //1 for bought, 2 for manufatured
  description:   {type: String},
  amountInStock: {type: Number},
  unit:          {type: String},
  leadTime:      {type: Number},
  purchasePrice: {type: Number},
  costValue:     {type: Number},
  DELETED:       {type: Boolean, default: false}
});

ProdutoSchema.plugin(mongoosePaginate);
ProdutoSchema.plugin(mongooseAggregatePaginate);
ProdutoSchema.plugin(neomongoose, options);

var produto = mongoose.model('Produto', ProdutoSchema);


/** export schema */
module.exports = {
  Produto : produto
};