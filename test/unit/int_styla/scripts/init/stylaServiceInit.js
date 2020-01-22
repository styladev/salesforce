'use strict';

var sinon = require('sinon');
var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var LocalServiceRegistry = require('../../../../mocks/dw/svc/LocalServiceRegistry');

describe('stylaServiceInit', function () {
	var stylaServiceInit = proxyquire('../../../../../cartridges/int_styla_refArch/cartridge/scripts/init/stylaServiceInit', {
		'dw/svc/LocalServiceRegistry': LocalServiceRegistry
	});

	it('should create service and return service methods StylaSeoContentHttpService', function () {
		var result = stylaServiceInit.StylaSeoContentHttpService;
		assert.isObject(result);
		assert.isFunction(result.createService);
		assert.isFunction(result.getURL);
		assert.isFunction(result.setURL);
		assert.isFunction(result.addParam);
		assert.isFunction(result.setCachingTTL);
		assert.isFunction(result.call);
	});

	it('should create service and return service methods StylaVersionService', function () {
		var result = stylaServiceInit.StylaVersionService;
		assert.isObject(result);
		assert.isFunction(result.createService);
		assert.isFunction(result.getURL);
		assert.isFunction(result.setURL);
		assert.isFunction(result.addParam);
		assert.isFunction(result.setCachingTTL);
		assert.isFunction(result.call);
	});
});
