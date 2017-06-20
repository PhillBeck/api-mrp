'use strict';

module.exports = {
	Product: function() {
		this.code= Math.random().toString();
		this.name= 'Test1';
		this.family= 'Test1';
		this.description= 'Test1';
		this.amountInStock= 50;
		this.unit= 'un';
		this.leadTime= 20;
		this.productType = 1;
	},

	ProductionOrder: function(productId) {
		this.productId = productId;
		this.code = Math.random().toString();
		this.originalDeadline = '2017-06-19';
		this.revisedDeadline = '2017-06-19';
		this.quantity = 1;
		this.type = 1;
	}
}