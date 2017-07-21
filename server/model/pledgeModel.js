'use strict';

const mongoose = require('mongoose'),
	Schema = mongoose.Schema,
  uuid = require('uuid/v4'),
  idExists = require('mongoose-idexists'),
  Q = require('q'),
  mongoosePaginate = require('mongoose-paginate');

  mongoose.Promise = Q.Promise;
  
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

pledgeSchema.statics.calculatePledges = calculatePledgeTotal;

var pledgeModel = mongoose.model('pledge', pledgeSchema);

module.exports = pledgeModel



function calculatePledgeTotal(product, warehouse) {
  return Q.Promise(function(resolve, reject) {
    if (typeof(product) === 'string') {
      product = mongoose.Types.ObjectId(product);
    }

    if (typeof(warehouse) === 'string') {
      warehouse = mongoose.Types.ObjectId(warehouse);
    }


    pledgeModel.aggregate([
      { $match: { 'product': product, 'warehouse': warehouse }},
      { $group: {
        _id: null,
        product: {$first: '$product'},
        warehouse: {$first: '$warehouse'},
        quantity: {$sum: '$quantity'}
      }},
      {$project: {_id: 0}}
    ],function(err, pledge) {
      if (err) {
        return reject(err);
      }
      
      return resolve(pledge);
    });
  });
}