'use strict';

const shallowClone = require('./shallowClone.js');

function formatOutput(docs, exclude) {

	var obj;

	if (docs instanceof Array) {

		obj = docs.map(item => {
			let ret = shallowClone(item);

			exclude.forEach(field => {delete ret[field]});

			return ret;
		});
	}else if (docs.docs instanceof Array) {

		obj = docs.docs.map(item => {
			let ret = shallowClone(item);

			exclude.forEach(field => {delete ret[field]});

			return ret;
		});
	} else {
		let ret = shallowClone(docs);
		exclude.forEach(field => {delete ret[field]});
		obj = ret;
	}

	return obj
}

module.exports = formatOutput;