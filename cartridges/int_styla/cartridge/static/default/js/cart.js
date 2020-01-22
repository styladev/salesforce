'use strict';

var minicart = null,

    /**
     * Expose add-to-cart functionality which can be used by Styla JS library.
     */
    addToCart = function(productID, qty) {
        return new Promise(function(resolve, reject) {
            $.ajax({
                type: 'POST',
                url: Urls.addProduct + '?format=ajax',
                data: {
                    pid: productID,
                    Quantity: qty
                }
            }).done(function(response) {
                minicart.show(response);
                resolve(response);
            }).fail(function(jqXHR, textStatus, errorThrown) {
                reject(errorThrown || 'error');
            });
        });
    };

module.exports = function(minicartObject) {
    window.styla = window.styla || {
        callbacks: []
    };
    styla && styla.callbacks && styla.callbacks.push({
        'addToCart': addToCart
    });

    minicart = minicartObject;
};
