'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	mongoosePaginate = require('mongoose-paginate'),
	mongooseAggregatePaginate = require('mongoose-aggregate-paginate');


var NecessityItemSchema = new Schema({
	productId: {type: Schema.Types.ObjectId, ref: 'Produto', required: true},
	quantity:  {type: Number, required: true},
	deadline:  {type: Date}
});

var NecessitySchema = new Schema({
	name: {type: String, required: true},
	description: {type: String, required: true},
	items: [NecessityItemSchema]
}, {timestamps: true});

NecessitySchema.plugin(mongoosePaginate);
NecessitySchema.plugin(mongooseAggregatePaginate);

var necessity = mongoose.model('Necessity', NecessitySchema);

module.exports = {
	Necessity : necessity
}