'use strict'; // Copyright (C) 2016 Mobizcorp Europe Ltd.

(function(){

    const ServiceRegistry = require('dw/svc/ServiceRegistry');
    const System = require("dw/system/System");
	
    /**
     * Service used for fetching SEO content for a specific URL. 
     */
	ServiceRegistry.configure('StylaSeoContentHttpService', {
		createRequest: function(svc:HTTPService, params) {
			svc.setRequestMethod('GET');
			svc.setCachingTTL(3600);
		},
		
		/**
		 * Check response status, parse response text to object.
		 */
		parseResponse : function(svc:HTTPService, response) {
			var result = {};
			
			if (!empty(response)) {
				if (response.statusCode === 200 || response.statusCode === 202) {
					try {
						result = JSON.parse(response.text);
					} catch (e) {
						result.errorMessage = 'Exception occured: ' + e.message;
					}
				} else {
					result.errorMessage = 'Expected status code 200 or 202, got ' + response.statusCode + ' with message "' + response.statusMessage + '".';
				}
			} else {
				result.errorMessage = 'Empty response';
			}
	
			return result;
		},
		
		mockCall : function(svc:HTTPService, params) {
			return {
				html : {
					head : '',
					body : ''
				}
			};
		}
	});
	
	
    /**
     * Service used for fetching the latest content version identifier. 
     */
	ServiceRegistry.configure('StylaVersionService', {
		createRequest: function(svc:HTTPService, params) {
			svc.setRequestMethod('GET');
			svc.setCachingTTL(3600);
		},
		
		/**
		 * Check response status and save response text as version identifier.
		 */
		parseResponse : function(svc:HTTPService, response) {
			var result = {};
			
			if (!empty(response)) {
				if (response.statusCode === 200 || response.statusCode === 202) {
					try {
						result.version = response.text;
					} catch (e) {
						result.errorMessage = 'Exception occured: ' + e.message;
					}
				} else {
					result.errorMessage = 'Expected status code 200 or 202, got ' + response.statusCode + ' with message "' + response.statusMessage + '".';
				}
			} else {
				result.errorMessage = 'Empty response';
			}
	
			return result;
		},
		
		mockCall : function(svc:HTTPService, params) {
			return {
				error : false,
				version : 'x'
			};
		}
	});

}).call(this);
