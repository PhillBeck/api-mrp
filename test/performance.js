'use strict';

const async = require('async'),
	  tests = require('./performance2');

var depthMin = 100;
var depthMax = 1000;
var depthStep = 50;

var itemsMin = 100;
var itemsMax = 2000;
var itemsStep = 50;

setTimeout(function() {

async.timesSeries(Math.ceil((itemsMax - itemsMin)/itemsStep + 1), function(n, next) {
	async.timesSeries(Math.ceil((depthMax - depthMin) / depthStep + 1), function(m, callback) {
		tests(depthMin + m * depthStep, itemsMin + n * itemsStep, callback);
	}, function(err, docs) {
		next();
	});
}, function(err, docs) {
	process.exit(0);
});

}, 20000);