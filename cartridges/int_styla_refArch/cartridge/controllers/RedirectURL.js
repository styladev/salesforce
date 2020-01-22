'use strict';

var server = require('server');

server.extend(module.superModule);

server.append('Start', function (req, res, next) {
	var URLRedirectMgr = require('dw/web/URLRedirectMgr');

	var redirect = URLRedirectMgr.redirect;
	var location = redirect ? redirect.location : null;

	if (!location) {
		var StylaMain,
			path = URLRedirectMgr.redirectOrigin,
			handledByStyla = false;
		if (dw.system.Site.current.getCustomPreferenceValue('stylaEnabled') == true) {
			StylaMain = require('/int_styla_refArch/cartridge/scripts/stylaMain');
			handledByStyla = StylaMain.Alias(path);
		}

		if (handledByStyla) {
			return handledByStyla;
		}
	}

	next();
});

module.exports = server.exports();