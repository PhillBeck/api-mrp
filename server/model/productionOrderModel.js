'use strict';

const mongoose = require('mongoose'),
	  Schema = mongoose.Schema,
	  mongoosePaginate = require('mongoose-paginate');

var productionOrderSchema = new Schema({
	productId: {type: Schema.Types.ObjectId, ref: 'produtos', required: true},
	code: {type: String, unique: true},
	quantity: {type: Number},
	originalDeadline: {type: Date},
	revisedDeadline: {type: Date},
	type: {type: Number}, //1 for planned, 2 for firmed
	salesOrderId: {type: Schema.Types.ObjectId, ref: 'salesOrders'},
  status: {type: Number, default: 0},
	DELETED: {type: Boolean, default: false}
});

productionOrderSchema.plugin(mongoosePaginate);

var productionOrderModel = mongoose.model('productionOrders', productionOrderSchema);

module.exports = productionOrderModel;
