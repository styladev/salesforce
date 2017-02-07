'use strict';

var minicart = null,

	/**
	 * Expose add-to-cart functionality which can be used by Styla JS library. 
	 */
	addToCart = function(productID, qty) {
		$.ajax({
			type: 'POST',
			url: Urls.addProduct + '?format=ajax',
			data: {
				pid : productID,
				Quantity : qty
			}
		}).done(function(response) {
			minicart.show(response);
		});
	};

module.exports = function(minicartObject) {
	window.styla = window.styla || {events:[]};
	styla && styla.events && styla.events.push({'addToCart': addToCart}) || console && console.log('cannot register addToCart with styla.events');
	
	minicart = minicartObject;
};
