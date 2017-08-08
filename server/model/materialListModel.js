'use strict';

const mongoose = require('mongoose'),
	  Schema = mongoose.Schema,
		paginateArray = require('../utils/mongoose-paginate-array');
		
mongoose.Promise = require('q').Promise


var necessityMaterialItemSchema = new Schema({
	_id:           {type: Schema.Types.ObjectId, ref:'produtos'},
	code:          {type: String},
	name:          {type: String},
	family:        {type: String},
	productType:   {type: Number},
	description:   {type: String},
	amountInStock: {type: Number},
	unit:          {type: String},
	leadTime:      {type: Number},
	purchasePrice: {type: Number},
	costValue:     {type: Number},
	DELETED:       {type: Boolean},
	quantity:      {type: Number}
});

var necessityMaterialSchema = new Schema({
	items: [necessityMaterialItemSchema]
}, {timestamps: true});

necessityMaterialSchema.plugin(paginateArray);

var materialList = mongoose.model('necessityMaterials', necessityMaterialSchema);

module.exports = materialList