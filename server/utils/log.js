'use strict';

const bunyan = require('bunyan'),
	  mongoStream = require('mongo-writable-stream'),
	  dbUrl = require('../config/db').logDB;

function createlogger(name) {
	this.logger = bunyan.createLogger({
		name: name,
		serializers: {err: errorDataSerializer},
		level: 'error',
		streams: [
			{
				stream: process.stderr
			},
			{
				stream: new mongoStream({
					url: dbUrl,
					collection: 'errors'
				})
			},
			{
				stream: new mongoStream({
					url: dbUrl,
					collection: 'warnings'
				})
			}
		]});
	this.error= error
}

function error(req, err) {
	let errorMessage = {
		err: err,
		data: {
			req_id: req.id,
			method: req.method,
			path: req.path,
			payload: req.payload
		}
	}

	console.log(errorMessage)
	this.logger.error(errorMessage);
}

function warn(err) {
	this.logger.warn({err: err});
}

function errorDataSerializer (obj) {
	if (!obj.err)
		return obj;

	var ret = {
		data: obj.data
	}

	if (obj.err.stack) {
		ret.error = {
			message: err.message,
			name: err.name,
			code: err.code,
			signal: err.signal
		}
	} else {
		ret.error = obj.err
	}
	return ret;
};

module.exports = {Logger: createlogger}
