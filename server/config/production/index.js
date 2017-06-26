'use strict';

module.exports = {
	server: {
		host: '0.0.0.0',
		port: 9000
	},
	database: {
		host: 'mongo',
		port: 27017,
		db: 'umaflex',
		username: '',
		password: '',
		log: 'umaflex-log'

	},
	neo4j: {
		connectURI: 'bolt://neo4j',
		user: 'neo4j',
		password: 'q1w2e3www'
	}
};
