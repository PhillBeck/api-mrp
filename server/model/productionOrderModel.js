'use strict';

const mongoose = require('mongoose'),
		Schema = mongoose.Schema,
		Q = require('q'),
		idExists = require('mongoose-idexists'),
		mongooseRollback = require('mongoose-rollback'),
		mongoosePaginate = require('mongoose-paginate');
			
mongoose.Promise = Q.Promise;

var productionOrderSchema = new Schema({
	product: {type: Schema.Types.ObjectId, ref: 'product', required: true},
	warehouse: {type: Schema.Types.ObjectId, ref: 'warehouse', required: true},
	code: {type: String, unique: true},
	quantity: {type: Number},
	originalDeadline: {type: Date},
	revisedDeadline: {type: Date},
	type: {type: Number}, // 1 for planned, 2 for firmed
	salesOrderId: {type: Schema.Types.ObjectId, ref: 'saleOrder'},
  status: {type: Number, default: 0}, // 0 for planned, 1 for executing, 2 for completed
	DELETED: {type: Boolean, default: false}
});

productionOrderSchema.plugin(idExists.forSchema);
productionOrderSchema.plugin(mongoosePaginate);
productionOrderSchema.plugin(mongooseRollback, {
  index: true,
  collectionName: 'productionOrders'
});

productionOrderSchema.statics.getTotalPlannedProduction = getPlannedProduction;

var productionOrderModel = mongoose.model('productionOrder', productionOrderSchema, 'productionOrders');

module.exports = productionOrderModel;

function getPlannedProduction(warehouse, product) {
	var movementModel = require('./MovementModel');

	// TO DO: Implement cursors using co
	return productionOrderModel.find({product: product, warehouse: warehouse})
		.then((orders) => {
			let promises = orders.map((element) => {

				return movementModel.find({productionOrder: element._id.toString()}, {in: 1})
					.then((movements) => {
						var pointedProduction = movements
							.map((e) => { return e.in[0].quantity })
							.reduce((sum, q) => {return sum + q}, 0);

						return element.quantity - pointedProduction;
					});
			});

			return Q.all(promises).then((plannedProductions) => {
				return plannedProductions.reduce((sum, e) => { return sum + e }, 0);
			}).catch((err) => { throw err });

		}).catch((err) => { throw err }
	);
}