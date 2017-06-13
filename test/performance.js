const async = require('async'),
	  request = require('supertest'),
	  server = require('../server/server'),
	  config = require('./config');



run(100,1, function(){process.exit(0)});

function run(depth, numItems, done) {

	var numProducts = depth * numItems;
	var products = [];
	var necessityId;

	async.series([
		function(next) {
			async.times(numProducts, function(n, callback) {
				request(server.listener)
				.post('/products')
				.send(new config.Product())
				.end(function(err, res) {
					callback(err, res.body);
				});
			}, function(err, docs) {
				products = docs;
				next();
			});
		},
		function(next) {
			request(server.listener)
			.post('/necessities')
			.send({name: 'test', description: 'test'})
			.end(function(err, res) {
				necessityId = res.body._id;
				next();
			});
		},
		function(next) {
			async.times(numItems, function(n, callback) {
				request(server.listener)
				.post('/necessities/' + necessityId + '/items')
				.send({productId: products[n*depth]._id, quantity: 1, deadline: '2017-06-30'})
				.end(function(err, res) {
					callback();
				});
			}, function(err, docs) {
				next();
			});
		}
		, function(next) {
			async.times(numItems, function(n, callback) {
				async.times(depth-1, function(m, back) {
					request(server.listener)
					.put('/products/' + products[n*m]._id + '/children/' + products[n*m+1]._id)
					.send({quantity: 1})
					.end(function(err, res) {
						back(err, res.statusCode);
					});
				}, function(err, docs) {
					callback(err, docs);
				});
			}, function(err, docs) {
				console.log(necessityId);
				next();
			});
		}
		], function(err, res) {
			var timer = console.time(depth + ' ' +  numItems);
			request(server.listener)
			.get('/necessities/' + necessityId + '/materials')
			.end(function(err, res) {
				console.timeEnd(depth + ' ' +  numItems);
				done();
			});
		}
	);
}