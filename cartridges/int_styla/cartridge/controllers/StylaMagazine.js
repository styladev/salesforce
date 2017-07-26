'use strict';

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

var Logger = require('dw/system/Logger').getLogger('styla', 'StylaMagazine');
var ISML = require('dw/template/ISML');

var StylaMain = require('/int_styla/cartridge/scripts/StylaMain');


const CONFIG_CO_TYPE        = 'StylaMagazineConfiguration'; // custom object type for storing magazine configurations
const CONFIG_CO_KEY_ATTR    = 'Key_and_Sort_Order';         // name of the custom object's key attribute
const CONFIG_CO_SORT_ORRDER = 'custom.' + CONFIG_CO_KEY_ATTR + ' asc'; // sort order of custom objects



function renderContent(template) {
	var pdict = StylaMain.GetRenderContent();
	if (pdict) {
		ISML.renderTemplate(template, pdict);
	}
	else {
		ISML.renderTemplate('styla/empty');
	}	
}


/**
 * Inject Styla JavaScript library and SEO content into page header. Use as remote include.
 */
function headerContent() {
	renderContent('styla/headercontent');
}


/**
 * Inject Styla JavaScript library and SEO content into page body. Use as remote include.
 */
function bodyContent() {
	renderContent('styla/bodycontent');
}


/**
 * Render the Styla cartridge version.
 */
function cartridgeVersion() {
	
	var versionInfo = {
		    version: require('~/package.json').cartridgeVersion
		},
		str;

	if (request.httpParameterMap.isParameterSubmitted('username')) {
		var StylaMain = require('/int_styla/cartridge/scripts/StylaMain');
		var userName = request.httpParameterMap.get('username').stringValue;
		versionInfo.seoContent = StylaMain.GetContentVersion({username: userName});
	}
	
	str = JSON.stringify(versionInfo, null, '\t');
	
	response.setContentType('application/json');
	response.setExpires(5 * 60 * 1000); // 5 minutes
	response.writer.print(str);	
}


/**
 * If the current URL is part of a magazine, then jump to the corresponding 
 * controller method so that the original URL is preserved in the browser.
 * 
 * This is called from RedirectURL.start() if no matching redirect rule was found.
 * 
 * E.g. assume we have an alias 'magazine' assigned to a pipeline which renders a Styla magazine.
 * When interacting with the magazine the Styla JavaScript will modify the URL in the 
 * customer's browser to e.g. 'magazine/stories/5'.
 * Because RedirectUrl.start() doesn't find a matching rule for 'magazine/stories/5' 
 * it calls this function.    
 * 
 * @param path Original URL before redirect.
 * @returns True, if a matching magazine configuration was found and the configured 
 * controller method was called successfully.
 */
function alias(path) {
	var result = false,
		magazineConfig = StylaMain.GetConfigForAlias(path),
		parts;
	
	if (magazineConfig) {
		// read controller method method from configuration
		parts = magazineConfig.pipeline.split('-');
		if (parts.length === 3) {
			var controllerCartridge = parts[0],
				controllerName = parts[1],
				controllerMethod = parts[2],
				controllerPath = controllerCartridge + '/cartridge/controllers/' + controllerName,
				controller;
			controller = require(controllerPath);
			if (typeof controller[controllerMethod] === 'function') {
				// store category ID in case the controller method is Search.show(),
				// and header template uses this to set HTTP status
				request.custom.MagazineConfiguration = magazineConfig;
				// call controller method
				controller[controllerMethod]();
				result = true;
			}
			else {
				Logger.error('alias: method not found or not a function: ' + magazineConfig.pipeline);
			}
		}
		else {
			var pip = magazineConfig.pipeline;
			if (typeof magazineConfig.pipeline === 'undefined') {
				pip = '(undefined)';
			}
			else if (magazineConfig.pipeline === null) {
				pip = '(null)';
			}
			Logger.error('alias: invalid controller method specified: "{0}"', pip);
		}
	}
	else {
		Logger.debug('no matching config found for path: ' + path);
	}

	
	return result;
}




/*
 * Module exports
 */


/*
 * Web exposed methods - only used via 'remote include'
 */

/** Renders Styla header fragment.
 * @see module:controllers/StylaMagazine~headerContent */
exports.HeaderContent = headerContent;
exports.HeaderContent.public = true;

/** Renders Styla body fragment.
 * @see module:controllers/StylaMagazine~bodyContent */
exports.BodyContent = bodyContent;
exports.BodyContent.public = true;


/*
 * Web exposed methods
 */

/** Renders Styla cartridge version.
 * @see module:controllers/StylaMagazine~cartridgeVersion */
exports.CartridgeVersion = cartridgeVersion;
exports.CartridgeVersion.public = true;


/*
 * Local methods
 */

/** Redirect logic. Called from storefront controller RedirectURL.js.
 * @see module:controllers/StylaMagazine~alias */
exports.Alias = alias;


