'use strict';

var sinon = require('sinon');
var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var CustomObjectMgr = require('../../../mocks/dw/object/CustomObjectMgr');
var Logger = require('../../../mocks/dw/system/Logger');
var Site = require('../../../mocks/dw/system/Site');
var stylaServiceIntPath = '../../../../cartridges/int_styla_refArch/cartridge/scripts/init/stylaServiceInit';
var LocalServiceRegistry = require('../../../mocks/dw/svc/LocalServiceRegistry');

describe('stylaMain', function () {
    var stylaMain = proxyquire('../../../../cartridges/int_styla_refArch/cartridge/scripts/stylaMain', {
        'dw/object/CustomObjectMgr': CustomObjectMgr,
        'dw/system/Logger': Logger,
        'dw/system/Site': Site,
        'app_storefront_base/cartridge/controllers/Search': {
            Show: function() {
                return { success: 'success' };
            }
        },
        './init/stylaServiceInit': proxyquire(stylaServiceIntPath, {
            'dw/svc/LocalServiceRegistry': LocalServiceRegistry
        })
    });

    global.response = {
        setStatus: function (status) {
            return status;
        }
    }

    global.empty = function (args) {
        if (args && args.length && args !== '' && args !== null && args !== 'undefined') {
            return false;
        }
        return true;
    }

    var spy1,
        spy2;

    beforeEach(function () {
        spy1 = sinon.spy(Logger, 'info');
        spy2 = sinon.spy(response, 'setStatus');
    });

    afterEach(function() {
        spy1.restore();
        spy2.restore();
    });

    it('should get render content', function () {
        global.request = {
            locale: 'en_US',
            httpParameterMap: {
                magazinepath: {
                    submitted: true,
                    stringValue: '/'
                }
            }
        }
        var result = stylaMain.GetRenderContent();
        assert.isObject(result);
        assert.isTrue(result.MagazineConfiguration.valid);
        assert.isFalse(result.SeoResponse.errorMessage);
        assert.isString(result.SeoResponse.html);
        assert.equal(result.SeoResponse.html, '<div>Everything is OK</div>')
    });

    it('should get render content as null', function () {
        global.request = {
            locale: 'default',
            httpParameterMap: {
                magazinepath: {
                    submitted: false,
                    stringValue: ''
                }
            }
        }
        var result = stylaMain.GetRenderContent();
        assert.isNull(result);
    });

    it('should get a true response if an alias exists', function () {
        global.request = {
            locale: 'en_US',
            custom: {}
        };
        var result = stylaMain.Alias('/magazine/category-1');
        assert.isTrue(result);
        assert.isObject(global.request.custom.MagazineConfiguration);
        assert.isTrue(global.request.custom.MagazineConfiguration.valid);
    });

    it('should return false response if an alias does not exist', function () {
        var result = stylaMain.Alias('/somethingwrong/anotherthingwrong');
        assert.isFalse(result);
    });

    it('should return alias configuration', function () {
        var result = stylaMain.GetConfigForAlias('/magazine/category-1');
        assert.isObject(result);
        assert.isTrue(result.valid);
        assert.equal(result.path, '/magazine/category-1');
    });

    it('should return null for alias configuration', function () {
        var result = stylaMain.GetConfigForAlias();
        assert.isNull(result);
    });

    it('should log story not found, status 404', function () {
        global.request = {
            httpHeaders: {},
            custom: {
                MagazineConfiguration: {
                    valid: true,
                    path: '/',
                    rootPath: '/',
                    username: 'odlo-lookbook-en',
                    pipeline: 'app_storefront_base-Home-Show',
                    categoryID: '',
                    basePath: '/',
                    homepage: true,
                    seoDisabled: false,
                    seoCachingTTL: 60,
                    jsLibUrl: '//client-scripts.styla.com/scripts/clients/odlo-lookbook-en.js',
                    cssUrl: '//client-scripts.styla.com/styles/clients/odlo-lookbook-en.css',
                    seoResponse: {
                        errorMessage: false,
                        html: '<div>Everything is OK</div>',
                        status: 404
                    }
                },
                SeoResponse: {
                    errorMessage: false,
                    html: '<div>Everything is OK</div>'
                }
            }
        }
        stylaMain.SetHttpStatus();
        assert.isTrue(spy1.calledWith('Styla Story not found, Status: 404'));
    });

    it('should set the status to the response object', function () {
        global.request = {
            httpHeaders: {},
            custom: {
                MagazineConfiguration: {
                    valid: true,
                    path: '/',
                    rootPath: '/',
                    username: 'odlo-lookbook-en',
                    pipeline: 'app_storefront_base-Home-Show',
                    categoryID: '',
                    basePath: '/',
                    homepage: true,
                    seoDisabled: false,
                    seoCachingTTL: 60,
                    jsLibUrl: '//client-scripts.styla.com/scripts/clients/odlo-lookbook-en.js',
                    cssUrl: '//client-scripts.styla.com/styles/clients/odlo-lookbook-en.css',
                    seoResponse: {
                        errorMessage: false,
                        html: '<div>Everything is OK</div>',
                        status: 200
                    }
                },
                SeoResponse: {
                    errorMessage: false,
                    html: '<div>Everything is OK</div>'
                }
            }
        }
        stylaMain.SetHttpStatus();
        assert.isTrue(spy2.calledWith(200));
    });
});
