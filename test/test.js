'use strict';

const assert = require('assert'),
	config = require('./config'),
	expect = require('chai').expect,
	request = require('supertest'),
	server = require('../server/server'),
	productTests = require('./productTests'),
	necessityTests = require('./necessityTests');

productTests.run(server);
necessityTests.run(server);