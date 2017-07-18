'use strict';

const assert = require('assert'),
  config = require('./config'),
  requests = config.requests,
  helper = require('./promises'),
  expect = require('chai').expect,
  fs = require('fs'),
  async = require('async'),
  Q = require('q'),
  messages = JSON.parse(fs.readFileSync('./server/locales/pt_BR.json', 'utf8'));

exports.run = function(server) {
  describe('Production Movement', function() {
    describe('Create', function() {
      
    });
  });
}