'use strict';

var base = module.superModule || module.parent.superModule; //added parent to module for testing purposes only. It does not interfere with the functionality of the rest of the app

function applyStylaCustomCache(req, res, next) {
	var Site = require('dw/system/Site');
	var site = Site.getCurrent();
	let cachePeriod = site.getCustomPreferenceValue('stylaSeoCachingTTL');

    res.cachePeriod = cachePeriod; // eslint-disable-line no-param-reassign
    res.cachePeriodUnit = 'minutes'; // eslint-disable-line no-param-reassign
	res.personalized = true; // eslint-disable-line no-param-reassign

	next();
}

module.exports = {
    applyDefaultCache: base.applyDefaultCache,
    applyPromotionSensitiveCache: base.applyPromotionSensitiveCache,
    applyInventorySensitiveCache: base.applyInventorySensitiveCache,
    applyShortPromotionSensitiveCache: base.applyShortPromotionSensitiveCache,
    applyStylaCustomCache: applyStylaCustomCache
}