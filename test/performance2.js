'use srtict';

const request = require('supertest'),
	  async = require('async'),
	  Product = require('./config').Product,
	  axios = require('axios');

var instance = axios.create({
	baseURL: 'http://app:9002',
	timeout: 1000000
});

var products = [];
var necessityId;

module.exports = function(depth, items, callback) {

	function cadastraProdutos(numProducts, done) {
		async.timesLimit(numProducts, 100, function(n, next) {
			instance.post('/products', new Product())
			.then(function(res) {
				next(undefined, res.data);
			});
		}, function(err, docs) {
			products = products.concat(docs);
			done();
		});
	}

	function cadastraEstruturas(depth, done) {
		async.timesLimit(depth - 1, 100, function(n, next) {
			instance.put('/products/' + products[n]._id + '/children/' + products[n+1]._id, {quantity: 1})
			.then(function(res) {
				next(undefined, res.data);
			});
		}, function(err, docs) {
			done();
		});
	}

	function cadastraNecessidade(done) {
		instance.post('/necessities', {name: 'teste', description: 'teste'})
		.then(function(res) {
			necessityId = res.data._id;
			done();
		});
	}

	function insereItems(numItems, done) {
		async.timesLimit(numItems, 100, function(n, next) {
			instance.post('/necessities/' + necessityId + '/items', {productId: products[0]._id, quantity: 1, deadline: '2017-06-30'})
			.then(function(res) {
				next(undefined, res.data);
			});
		}, function(err, docs) {
			done();
		});
	}

	cadastraProdutos(depth, function() {
		cadastraEstruturas(depth, function() {
			cadastraNecessidade(function() {
				insereItems(items, function() {
					console.time(depth + ' ' + items)
					instance.get('/necessities/' + necessityId + '/materials')
					.then(function(res) {
						console.timeEnd(depth + ' ' + items);
						callback();
					});
				});
			});
		});
	});
}