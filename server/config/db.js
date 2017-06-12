'use strict';

var Mongoose = require('mongoose'),
	config = process.env.NODE_ENV === undefined ? require('./development') : require('./' + process.env.NODE_ENV);

//Mongoose.connect(config.database.url);
Mongoose.connect('mongodb://' + config.database.host + '/' + config.database.db);
var db = Mongoose.connection;
db.on('error', console.error.bind(console, 'connection error'));
db.once('open', function callback() {
	console.log("Connection with MongoDb succeeded.");
});

exports.Mongoose = Mongoose;
exports.db = db;