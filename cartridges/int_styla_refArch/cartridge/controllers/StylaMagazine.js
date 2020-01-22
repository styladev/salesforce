'use strict';

var server = require('server');
/**
 * Controller exposes methods for injecting Styla JavaScript and SEO content.
 *
 * @module controllers/StylaMagazine
 *
 *
 * Do not reference the storefront controller cartridge here (e.g to re-use 'app' or 'guard'):
 * This montroller module is also called via remote include even when the storefront uses pipelines.
 * IOW: the storefront controller cartridge may or may not exist when this controller executes.
 *
 */

var StylaMain = require('/int_styla_refArch/cartridge/scripts/stylaMain');
var cache = require('*/cartridge/scripts/middleware/cache');

function renderContent(template, res) {
    var pdict = StylaMain.GetRenderContent();
    if (pdict) {
        res.render(template, pdict);
    } else {
        res.render('styla/empty');
    }
}

server.get('HeaderContent', cache.applyStylaCustomCache, function (req, res, next) {
    renderContent('styla/headercontent', res);
    return next();
});

server.get('BodyContent', cache.applyStylaCustomCache, function (req, res, next) {
    renderContent('styla/bodycontent', res);
    return next();
});

module.exports = server.exports();
