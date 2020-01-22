'use strict';

var sinon = require('sinon');
var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var cachePath = '../../../../../cartridges/int_styla_refArch/cartridge/scripts/middleware/cache';
var SitePath = require('../../../../mocks/dw/system/Site');

module.superModule = {
	applyDefaultCache: function () { },
	applyPromotionSensitiveCache: function () { },
	applyInventorySensitiveCache: function () { },
	applyShortPromotionSensitiveCache: function () { }
}

module.exports = module;

describe('cache', function () {
	var cache = proxyquire(cachePath, {
		'dw/system/Site': SitePath
	});

	var spy;

	var res = {
		cachePeriod: '',
		cachePeriodUnit: '',
		personalized: null
	}

	var req = {};

	beforeEach(function () {
		spy = sinon.spy();
	});

	afterEach(function () {
		spy.reset();
	});

	it('should set the cache period to the Site custom preference', function () {
		cache.applyStylaCustomCache(req, res, spy);
		assert.equal(res.cachePeriod, 60);
		assert.equal(res.cachePeriodUnit, 'minutes');
		assert.isTrue(res.personalized);
		assert.isTrue(spy.calledWith());
	});
});