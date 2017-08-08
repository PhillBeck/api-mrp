'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	mongoosePaginate = require('mongoose-paginate'),
	mongooseAggregatePaginate = require('mongoose-aggregate-paginate');

mongoose.Promise = require('q').Promise;


var NFSchema = new Schema ({
  nf: {type: String, required: true},
  serie: {type: String, required: true},
  emittedAt: {type: Date, required: true},
	items:[{
		productId: {type: Schema.Types.ObjectId, ref: 'produtos', required: true},
		quantity: {type: Number, required: true},
		batch: {type: Number, required: true},
		unitPrice: {type: Number, required: true},
		movementId: {type: Schema.Types.ObjectId, ref: 'movements', required: true}
	}],
  DELETED: {type: Boolean, default: false}
}, {timestamps: true});

NFSchema.plugin(mongoosePaginate);
NFSchema.plugin(mongooseAggregatePaginate);

var nf = mongoose.model('nf', NFSchema);

module.exports = {
	NF : nf
}
