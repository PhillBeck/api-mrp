'use strict';

var host = 'http://localhost:9002';
var productsBasePath = '/products';

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
}