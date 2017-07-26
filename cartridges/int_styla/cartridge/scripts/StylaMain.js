'use strict';

/**
 * Controller exposes methods for injecting Styla JavaScript and SEO content.
 *
 * @module controllers/StylaMagazine
 */

var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Logger = require('dw/system/Logger').getLogger('styla', 'StylaMain');
var ServiceRegistry = require('dw/svc/ServiceRegistry');
var Site = require('dw/system/Site');

var CONFIG_CO_TYPE        = 'StylaMagazineConfiguration'; // custom object type for storing magazine configurations
var CONFIG_CO_KEY_ATTR    = 'Key_and_Sort_Order';         // name of the custom object's key attribute
var CONFIG_CO_SORT_ORRDER = 'custom.' + CONFIG_CO_KEY_ATTR + ' asc'; // sort order of custom objects

var STYLA_ENABLED = Site.current.getCustomPreferenceValue('stylaEnabled') == true;


/**
 * Retrieve the Styla SEO content for the current magazine URL.
 * 
 * @param config The current Magazine Config object.
 * @returns The service call response.
 */
function getSeoContent(config) {
	var response = { error: true },
		locale = request.locale;

	// strip base path from current path to obtain the magazine sub path only
	var magazinePath = config['path'];
	var idx = magazinePath.indexOf(config['basePath']);
	if (idx > -1) {
		magazinePath = magazinePath.substring(idx + config['basePath'].length);
	}
	else {
		Logger.error('getSeoContent: config.basePath not found in config.path; config = ' + JSON.stringify(config));
	} 
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
	if (result && result.isOk() && result.object && !result.object.errorMessage && typeof result.object.html != 'undefined') {
		response = result.object;
	} else {
		if (result.errorMessage) {
			Logger.error(result.errorMessage);
		} else if (result.object && result.object.errorMessage) {
			Logger.error(result.object.errorMessage);
		}
		else {
			Logger.error('Invalid response from SEO service: ' + JSON.stringify(result.object));
		}
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
 * Find a matching magazine configuration.
 * 
 * @param {string} path Original URL before redirect.
 * @returns {Object} Magazine configuration if a matching magazine configuration was found, else returns null.
 */
function getConfigForAlias(path) {
	var result = null,
		getContentVer = false, // skip request for content version, we only need SEO request to determine HTTP status code
		magazineConfig;
	
	if (STYLA_ENABLED) {
		magazineConfig = getMagazineConfiguration(path, getContentVer);
		if (magazineConfig.valid) {
			result = magazineConfig;
		}
	}
	
	return result;
}



/**
 * Get the Styla content to be injected into the page's header and body.   
 */
function getRenderContent() {
	var result = null,
		magazineConfig,
		seoResponse = null,
		
		magazinePath,
		queryString,
		getContentVer;
	
	if (STYLA_ENABLED) {
		// read parameters that were passed via remote-include
		magazinePath  = request.httpParameterMap.magazinepath.submitted  && request.httpParameterMap.magazinepath.stringValue || null;
		queryString   = request.httpParameterMap.querystring.submitted   && request.httpParameterMap.querystring.stringValue  || null;
		getContentVer = request.httpParameterMap.getcontentver.submitted && request.httpParameterMap.getcontentver.stringValue === 'true';
		
		if (!empty(magazinePath) && magazinePath.indexOf('?') < 0 && !empty(queryString)) {
			magazinePath += '?' + queryString;
		}
		
		magazineConfig = getMagazineConfiguration(magazinePath, getContentVer);
		if (magazineConfig['valid']) {
			// found a magazine configuration that matches the original request's path 
			result = {
				MagazineConfiguration: magazineConfig,
				SeoResponse: magazineConfig.seoResponse || null
			};
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
	
	if (STYLA_ENABLED) {
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
}



/*
 * Module exports
 */

/** Retrieve the content version to be appended to a magazine URL.
 * @see module:controllers/StylaMain~getContentVersion */
exports.GetContentVersion = getContentVersion;

/** Find magazine configuration matching the given path.
 * @see module:controllers/StylaMain~getConfigForAlias */
exports.GetConfigForAlias = getConfigForAlias;

/** Return Styla fragment for rendering.
 * @see module:controllers/StylaMain~headerContent */
exports.GetRenderContent = getRenderContent;

/** Set HTTP status from SEO API response.
 * @see module:controllers/StylaMain~setHttpStatus */
exports.SetHttpStatus = setHttpStatus;
