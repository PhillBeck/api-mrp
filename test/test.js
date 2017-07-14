'use strict';

const assert = require('assert'),
    config = require('./config'),
    expect = require('chai').expect,
    request = require('supertest'),
    server = require('../server/server'),
    productTests = require('./productTests'),
    necessityTests = require('./necessityTests'),
    productionOrderTests = require('./productionOrderTests'),
    warehouseTest = require('./warehouseTest'),
    transferMovementsTests = require('./transferMovementTests'),
    inputMovementTests = require('./inputMovementTests'),
    nfTests = require('./NFTests');

/*
productTests.run(server);
necessityTests.run(server);
productionOrderTests.run(server);
warehouseTest.run(server);*/
transferMovementsTests.run(server);
// inputMovementTests.run(server);