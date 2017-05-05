'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  mongoosePaginate = require('mongoose-paginate'),
  mongooseAggregatePaginate = require('mongoose-aggregate-paginate');

/**
  * @module  Produto
  * @description Produto schema
*/

var ProdutoSchema = new Schema({
  code: {type: String, required: true, unique : true},
  name: {type: String, required : true},
  family : {type : String},
  description: {type : String},
  amountInStock : {type : Number},
  unit : {type: String},
  leadTime : {type : Number},
  costValue : {type : Number},
  children : [{
    childrenId: {
      type : Schema.Types.ObjectId,
      ref: 'Produto'
    },
    quantity : {type: Number}
  }]
});

ProdutoSchema.plugin(mongoosePaginate);
ProdutoSchema.plugin(mongooseAggregatePaginate);

var produto = mongoose.model('produto', ProdutoSchema);


/** export schema */
module.exports = {
  Produto : produto
};