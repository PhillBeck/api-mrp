'use strict';

module.exports = {
  server: {
    host: '0.0.0.0',
    port: 9002
  },
  database: {
  	host: '127.0.0.1',
    port: 27017,
    db: 'umaflex',
    username: '',
    password: '',
    url : 'mongodb://<user>:<password>@<url>'
  },
  neo4j: {
    connectURI: 'bolt://localhost',
    user: 'neo4j',
    password: 'q1w2e3www'
  }
};
