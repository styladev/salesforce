'use strict';

/**
 * Controller exposes methods for injecting Styla JavaScript and SEO content.
 *
 * @module controllers/StylaMagazine
 */

var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Logger = require('dw/system/Logger');
var ServiceRegistry = require('dw/svc/ServiceRegistry');
var Site = require('dw/system/Site');

var app = require('app_storefront_controllers/cartridge/scripts/app');
var guard = require('app_storefront_controllers/cartridge/scripts/guard');

const CONFIG_CO_TYPE        = 'StylaMagazineConfiguration'; // custom object type for storing magazine configurations
const CONFIG_CO_KEY_ATTR    = 'Key_and_Sort_Order';         // name of the custom object's key attribute
const CONFIG_CO_SORT_ORRDER = 'custom.' + CONFIG_CO_KEY_ATTR + ' asc'; // sort order of custom objects



/**
 * Retrieve the Styla SEO content for the current magazine URL.
 * 
 * @param config The current Magazine Config object.
 * @returns The service call response.
 */
function getSeoContent(config) {
	var response,
		locale = request.locale;
	// strip base path from current path to obtain the magazine sub path only
	var magazinePath = config['path'].replace(new RegExp('.*' + config['basePath']), '');
	if (empty(magazinePath)) {
		magazinePath = '/';
	}

	// retrieve HTTPService
	var svc = ServiceRegistry.get('StylaSeoContentHttpService');

	// append username to endpoint URL
	var url = svc.getURL();
	svc.setURL(url + config['username']);

	// set magazine sub path
	var urlParam = magazinePath;
	//if (!empty(config.queryString)) {
	//	urlParam += '?' + config.queryString;
	//}
	svc.addParam('url', urlParam);

	// set locale if not default
	if (locale !== 'default') {
		svc.addParam('lang', locale);
	}
	
	// set caching TTL (and convert from minutes to seconds)
	var cachingTTL = config['seoCachingTTL'] * 60;
	if (cachingTTL) {
		svc.setCachingTTL(cachingTTL);
	}
	
	// make the web service call
	var result = svc.call();

	// check result	
	if (result && result.isOk() && result.object && !result.object.errorMessage) {
		response = result.object;
	} else {
		if (result.errorMessage) {
			Logger.error(result.errorMessage);
		} else if (result.object && result.object.errorMessage) {
			Logger.error(result.object.errorMessage);
		}
		response = { error: true };
	}
	
	// Debug: set status here to test if alias() sets it on the HTTP response object 
	//response.status = 500;
	
	return response;
}


/**
 * Retrieve the content version to be appended to a magazine URL.
 * 
 * @param config The current Magazine Config object.
 * @returns The service call response.
 */
function getContentVersion(config) {
	var response;
	
	// retrieve HTTPService
	var svc = ServiceRegistry.get('StylaVersionService');
	
	// append username to endpoint URL
	var url = svc.getURL();
	svc.setURL(url + config['username']);
	
	// set caching TTL (and convert from minutes to seconds)
	var cachingTTL = config['seoCachingTTL'] * 60;
	if (cachingTTL) {
		svc.setCachingTTL(cachingTTL);
	}
	
	// make the web service call
	var result = svc.call();
	
	// check result	
	if (result && result.isOk() && result.object && !result.object.errorMessage) {
		response = result.object;		
	} else {
		if (result.errorMessage) {
			Logger.error(result.errorMessage);
		} else if (result.object && result.object.errorMessage) {
			Logger.error(result.object.errorMessage);
		}
		response = { error: true };
	}
	
	return response;
}


/**
 * Check if locale is in list of allowed locales.
 * @param loc String			Locale identifier, e.g. 'default' or 'en_US'
 * @param allowedLocales Array	List of locale identifiers
 */
function isAllowedLocale(loc, allowedLocales) {
	var result;
	
	if (typeof allowedLocales !== 'undefined' && allowedLocales !== null && allowedLocales.length > 0) {
		result = allowedLocales.indexOf(loc) > -1;
	}
	else {
		// allowedLocales is not defined or empty list
		result = true;
	}
	
	return result;
}


/**
 * Returns the  magazine root path, to be used in magazine DIV attribute.
 * @param path		Request path and query string.
 * @param basePath	Magazine base path, set in configuration custom object.
 * 
 * Example request URL: 
 * http://styla01-tech-prtnr-eu03-dw.demandware.net/s/SiteGenesis/electronics/magazine/story/dress_984035?domain=demandwaretest1
 * 
 * Here 
 * @path     is "/s/SiteGenesis/electronics/magazine/story/dress_984035?domain=demandwaretest1"
 * @basePath is "electronics/magazine"
 * 
 * The result should be @path from the start until and including the @basePath:
 * @returns "/s/SiteGenesis/electronics/magazine"
 */
function getMagazineRootPath(path, basePath) {
	var idx,
		result = null;
	if (!empty(path) && !empty(basePath)) {
		// remove trailing slash
		if (basePath[basePath.length - 1] === '/') {
			basePath = basePath.substr(0, basePath.length - 1);
		}
		// search basePath
		idx = path.indexOf(basePath);
		if (idx > -1) {
			result = path.substr(0, idx + basePath.length);
			// include trailing slash
			if (result[result.length - 1] !== '/') {
				result += '/';
			}
		}
	}
	return result;
}


/**
 * Read magazine configuration from custom object.
 * 
 * @param obj 				Custom object which stores a magazine configuration.
 * @param path 				Path of the request for which the magazine will be displayed.
 * @param getContentVer		If true, then the request to get the content version is performed.
 * 							If false, then the result object's @jsLibUrl and @cssUrl maybe invalid and shouldn't be used.
 * 
 * @returns object
 */
function getMagazineConfigurationFromObj(obj, path, getContentVer) {
	var site = Site.getCurrent(),
		cdnBaseUrl = site.getCustomPreferenceValue('stylaCdnBaseUrl'),
		cssBaseUrl = site.getCustomPreferenceValue('stylaCssBaseUrl'),
		version = '',
		versionResponse,
		config = {
			valid        : true,
			path         : path,
			rootPath     : null,
			username     : obj.custom.username   || '',
			pipeline     : obj.custom.pipeline   || '',
			categoryID   : obj.custom.categoryID || '',
			basePath     : obj.custom.basePath   || '',
			seoDisabled  : site.getCustomPreferenceValue('stylaSeoDisabled'),
			seoCachingTTL: site.getCustomPreferenceValue('stylaSeoCachingTTL'),
			jsLibUrl     : cdnBaseUrl.replace('{USER}', obj.custom.username || ''),
			cssUrl       : cssBaseUrl.replace('{USER}', obj.custom.username || '')
		};

	if (getContentVer) {
		versionResponse = getContentVersion(config);
		if (!versionResponse.error && !empty(versionResponse.version)) {
			version = versionResponse.version;
		}
	}

	config.jsLibUrl = config.jsLibUrl.replace('{VERSION}', version);
	config.cssUrl   = config.cssUrl.replace('{VERSION}', version);

	if (!config.seoDisabled) {
		config.seoResponse = getSeoContent(config);
	}
	
	config.rootPath = getMagazineRootPath(config.path, config.basePath);
	
	return config;
}


/**
 * Check if a given URL @path matches a magazine URL and return the magazine configuration in this case.
 * 
 * @param path 				The URL path.
 * @param queryString 		The query parameters of the original request.
 * @param getContentVer 
 * 
 * @returns The magazine config values from the site preferences.
 */
function getMagazineConfiguration(path, getContentVer) {
	var iter, obj,
		basePath, idx,
		localeMatches,
		locale = request.locale,
		config = { valid : false };

	if (!empty(path)) {

		//iter = CustomObjectMgr.getAllCustomObjects(CONFIG_CO_TYPE);
		iter = CustomObjectMgr.queryCustomObjects(CONFIG_CO_TYPE, 'custom.enabled = true', CONFIG_CO_SORT_ORRDER, null);
		while (iter.hasNext()) {
			obj = iter.next();
			// check if this config's basePath is contained in @path 
			basePath = obj.custom.basePath;
			idx = path.indexOf(basePath);
			if (idx != -1) {
				// basePath is part of @path
				// -> check if configuration's locale matches the current request
				localeMatches = isAllowedLocale(locale, obj.custom.locales && obj.custom.locales.slice() || null);
				if (localeMatches) {
					// read config from custom object
					config = getMagazineConfigurationFromObj(obj, path, getContentVer);
					break;
				}
			}
		}
		iter.close();

	} // path not empty
	
	return config;
}


/**
 * Inject Styla JavaScript library and SEO content into page header or body.  
 * 
 * @param templateName Name of template to render.
 */
function renderContent(templateName) {
	var magazineConfig,
		seoResponse = null,
		// read parameters that were passed via remote-include
		magazinePath  = request.httpParameterMap.magazinepath.submitted  && request.httpParameterMap.magazinepath.stringValue || null,
		queryString   = request.httpParameterMap.querystring.submitted   && request.httpParameterMap.querystring.stringValue  || null,
		getContentVer = request.httpParameterMap.getcontentver.submitted && request.httpParameterMap.getcontentver.stringValue === 'true';
		
	if (!empty(magazinePath) && magazinePath.indexOf('?') < 0 && !empty(queryString)) {
		magazinePath += '?' + queryString;
	}
	
	magazineConfig = getMagazineConfiguration(magazinePath, getContentVer);
	if (magazineConfig['valid']) {
		// found a magazine configuration that matches the original request's path 
		app.getView({
			MagazineConfiguration: magazineConfig,
			Response: magazineConfig.seoResponse || null
		}).render(templateName);
	}
	else {
		app.getView().render('styla/empty');
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
	let version = require('~/package.json').cartridgeVersion;
	let json = JSON.stringify({
			'version': version
		});

	// cache for one day
	let expiresDate = new Date();
	expiresDate.setDate(expiresDate.getDate() + 1);
	
    response.setContentType('application/json');
    response.setExpires(expiresDate);
    response.writer.print(json);
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
		getContentVer = false, // skip request for content version, we only need SEO request to determine HTTP status code
		magazineConfig = getMagazineConfiguration(path, getContentVer),
		parts;
	
	if (magazineConfig.valid) {
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
				
				
				//TODO
				// -> move to template
				
				// set HTTP status, if returned from SEO API
				if (magazineConfig.seoResponse && !empty(magazineConfig.seoResponse.status)) {
					response.setStatus(magazineConfig.seoResponse.status);
				}
				
				
				
			}
			else {
				Logger.error('method not found or not a function: ' + magazineConfig.pipeline);
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
			Logger.error('invalid controller method specified: "{0}"', pip);
		}
	}
	
	return result;
}


/**
 * Set HTTP response status to the value returned by the Styla SEO API.
 * 
 * If a magazine configuration is already stored in the current request then that is used. 
 * Else the magazine configuration for the current request URL is fetched first.  
 */
function setHttpStatus() {
	var req = request,
		headers = req.httpHeaders,
		cfg = 'MagazineConfiguration' in req.custom && req.custom.MagazineConfiguration || null,
		getContentVer = false, // skip request for content version, we only need SEO request to determine HTTP status code
		path, status;
	
	if (cfg === null) {
		// get original request path (before it was converted from alias to endpoint)
		path = headers.get('x-is-path_info');
		if (!empty(headers.get('x-is-query_string'))) {
			path += '?' + headers.get('x-is-query_string');
		}
		
		cfg = getMagazineConfiguration(path, getContentVer);
		req.custom.MagazineConfiguration = cfg;
	}
	
	status = cfg && cfg.seoResponse && cfg.seoResponse.status || null;
	if (status !== null) {
		response.setStatus(status);
	}
}



/*
 * Module exports
 */

/*
 * Web exposed methods
 */
/** Renders Styla header fragment.
 * @see module:controllers/StylaMagazine~headerContent */
exports.HeaderContent = guard.ensure([], headerContent);
/** Renders Styla body fragment.
 * @see module:controllers/StylaMagazine~bodyContent */
exports.BodyContent = guard.ensure([], bodyContent);
/** Renders Styla cartridge version.
 * @see module:controllers/StylaMagazine~cartridgeVersion */
exports.CartridgeVersion = guard.ensure([], cartridgeVersion);

/*
 * Local methods
 */
/** Redirect logic.
 * @see module:controllers/StylaMagazine~alias */
exports.Alias = alias;
/** Set HTTP status from SEO API response.
 * @see module:controllers/StylaMagazine~setHttpStatus */
exports.SetHttpStatus = setHttpStatus;

