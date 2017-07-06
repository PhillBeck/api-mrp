'use strict';

const mongoose = require('mongoose'),
	Schema = mongoose.Schema,
  uuid = require('uuid/v4'),
  idExists = require('mongoose-idexists'),
	mongoosePaginate = require('mongoose-paginate');

var movementItemSchema = new Schema({
  product: {type: Schema.Types.ObjectId, ref: 'product', required: true},
  warehouse: {type: Schema.Types.ObjectId, ref: 'warehouse', required: true},
  quantity: {type: Number, required: true}
});

var movementSchema = new Schema({
  type: {type: String, required: true},
  cancelled: {type: Boolean, default: false},
  in: {type: [movementItemSchema], required: true},
  out: {type: [movementItemSchema], required: true}
}, {timestamps: true});

movementSchema.index({'in.product': 1, 'in.warehouse': 1});
movementSchema.index({'out.product': 1, 'out.warehouse': 1});

movementSchema.plugin(mongoosePaginate);
movementSchema.plugin(idExists.forSchema);

var movementModel = mongoose.model('movement', movementSchema);

module.exports = movementModel;
