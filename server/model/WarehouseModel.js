'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	mongoosePaginate = require('mongoose-paginate'),
	mongooseAggregatePaginate = require('mongoose-aggregate-paginate');


var WarehouseSchema = new Schema ({
  code: {type: String, required: true},
  description: {type: String, required: true},
  validSince: {type: Date, required: true},
  unitId: {type: String, required: true},
  BLOCKED: {type: Boolean, default: false},
  allowNegativeStock: {type: Boolean, default: false}
}, {timestamps: true});

WarehouseSchema.plugin(mongoosePaginate);
WarehouseSchema.plugin(mongooseAggregatePaginate);

var warehouse = mongoose.model('warehouse', WarehouseSchema);

module.exports = {
	Warehouse : warehouse
}
