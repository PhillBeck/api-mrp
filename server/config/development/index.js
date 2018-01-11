'use strict';

module.exports = {
	server: {
		host: '0.0.0.0',
		port: 9000
	},
	database: {
		host: 'localhost',
		port: 27017,
		db: 'umaflex',
		username: '',
		password: '',
		log: 'umaflex-log'

	},
	neo4j: {
		connectURI: 'bolt://localhost',
		user: 'neo4j',
		password: 'q1w2e3www'
	}
};