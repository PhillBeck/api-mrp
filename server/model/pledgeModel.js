'use strict';

const mongoose = require('mongoose'),
	Schema = mongoose.Schema,
  uuid = require('uuid/v4'),
  idExists = require('mongoose-idexists'),
  mongoosePaginate = require('mongoose-paginate');
  
const pledgeSchema = new Schema({
  product: {type: Schema.Types.ObjectId, ref: 'product', required: true},
  warehouse: {type: Schema.Types.ObjectId, ref: 'warehouse', required: true},
  productionOrder: {type:Schema.Types.ObjectId, ref: 'productionOrder', required: true},
  quantity: {type: Number}
}, {timestamps: true});

pledgeSchema.index({warehouse: 1, product: 1});
pledgeSchema.index({productionOrder: 1});

pledgeSchema.plugin(idExists.forSchema);
pledgeSchema.plugin(mongoosePaginate);

var pledgeModel = mongoose.model('pledge', pledgeSchema);

module.exports = pledgeModel