'use strict';

var Mongoose = require('mongoose'),
	config = process.env.NODE_ENV === undefined ? require('./development') : require(`./${process.env.NODE_ENV}`);

Mongoose.connect(`mongodb://${config.database.host}/${config.database.db}`, {keepAlive: 300});
var db = Mongoose.connection;
db.on('error', console.error.bind(console, 'connection error'));
db.once('open', function callback() {
	console.log("Connection with MongoDb succeeded.");
});

exports.logDB = `mongodb://${config.database.host}/${config.database.log}`;

exports.Mongoose = Mongoose;
exports.db = db;
