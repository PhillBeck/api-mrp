'use strict';

const mongoose = require('mongoose'),
		Schema = mongoose.Schema,
		Q = require('q'),
		mongoosePaginate = require('mongoose-paginate');
			
		mongoose.Promise = Q.Promise;

var productionOrderSchema = new Schema({
	product: {type: Schema.Types.ObjectId, ref: 'produtos', required: true},
	code: {type: String, unique: true},
	quantity: {type: Number},
	originalDeadline: {type: Date},
	revisedDeadline: {type: Date},
	type: {type: Number}, //1 for planned, 2 for firmed
	salesOrderId: {type: Schema.Types.ObjectId, ref: 'salesOrders'},
  status: {type: Number, default: 0}, // 0 for planned, 1 for executing, 2 for completed
	DELETED: {type: Boolean, default: false}
});

productionOrderSchema.plugin(mongoosePaginate);

productionOrderSchema.statics.getTotalPlannedProduction = getPlannedProduction;

var productionOrderModel = mongoose.model('productionOrder', productionOrderSchema);

module.exports = productionOrderModel;

function getPlannedProduction(warehouse, product) {
	var movementModel = require('./MovementModel');

	//product = typeof(product) === 'string' ? mongoose.Types.ObjectId(product) : product;
	//warehouse = typeof(warehouse) === 'string' ? mongoose.Types.ObjectId(warehouse) : warehouse;

	// TO DO: Implement cursors using co
	return productionOrderModel.find({productId: product})
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