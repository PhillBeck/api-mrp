'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  mongoosePaginate = require('mongoose-paginate'),
  mongooseAggregatePaginate = require('mongoose-aggregate-paginate'),
  neomongoose = require('neomongoose');



/**
  * @module  Produto
  * @description Produto schema
*/

var ProdutoSchema = new Schema({
  code:          {type: String, required: true, unique: true},
  name:          {type: String, required: true},
  family:        {type: String},
  productType:   {type: String},
  description:   {type: String},
  amountInStock: {type: Number},
  unit:          {type: String},
  leadTime:      {type: Number},
  costValue:     {type: Number},
});

ProdutoSchema.plugin(mongoosePaginate);
ProdutoSchema.plugin(mongooseAggregatePaginate);

var options = {
  connectURI: 'bolt://localhost',
  user: 'neo4j',
  password: 'omfgxd512'
}

ProdutoSchema.plugin(neomongoose, options);

var produto = mongoose.model('Produto', ProdutoSchema);


/** export schema */
module.exports = {
  Produto : produto
};