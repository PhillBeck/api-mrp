'use strict';

const mongoose = require('mongoose'),
	Schema = mongoose.Schema,
  uuid = require('uuid/v4'),
  idExists = require('mongoose-idexists'),
  mongooseRollback = require('mongoose-rollback'),
  mongoosePaginate = require('mongoose-paginate');
  
mongoose.Promise = require('q').Promise;

var stockSchema = new Schema({
  product: {type: Schema.Types.ObjectId, ref: 'product', required: true},
  warehouse: {type: Schema.Types.ObjectId, ref: 'warehouse', required: true},
  movement: {type: Schema.Types.ObjectId, ref: 'movement', required: true},
  quantity: {type: Number, required: true}
});

stockSchema.plugin(mongoosePaginate);
stockSchema.plugin(idExists.forSchema);
stockSchema.plugin(mongooseRollback, {
  index: true,
  collectionName: 'stocks'
});

var model = mongoose.model('stock', stockSchema);

module.exports = model;
