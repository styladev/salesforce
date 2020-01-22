var assert = require('chai').assert;
var searchHelperPath = '../../../../../cartridges/int_styla_refArch/cartridge/scripts/helpers/searchHelpers';
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var sinon = require('sinon');

module.superModule = {
    getCategoryTemplate: function () {
        return 'rendering/category/categoryproducthits';
    },
    setupContentSearch: function () { },
    applyCache: function () { }
}

module.exports = module;

describe('search helpers', function () {
    describe('setup search', function () {
        var mockApiProductSearch = {};
        var mockParams1 = { srule: 'bestsellers', cgid: 'mens' };
        var mockParams2 = { srule: 'bestsellers', cgid: 'mens', preferences: { prefn1: 'pref1Value' } };
        var mockSelectedCategory = { ID: 'mens', online: true };

        var setProductPropertiesSpy = sinon.spy();
        var addRefinementValuesSpy = sinon.spy();

        var searchHelpersMock = proxyquire(searchHelperPath, {
            'dw/catalog/CatalogMgr': {
                getSortingRule: function (srule) {
                    return srule;
                },
                getCategory: function () {
                    return mockSelectedCategory;
                }
            },
            '*/cartridge/scripts/search/search': {
                setProductProperties: setProductPropertiesSpy,
                addRefinementValues: addRefinementValuesSpy
            }
        });

        it('should call setProductProperties', function () {
            searchHelpersMock.setupSearch(mockApiProductSearch, mockParams1);
            assert.isTrue(setProductPropertiesSpy.calledWith(mockApiProductSearch, mockParams1, mockSelectedCategory, mockParams2.srule));
            assert.isTrue(addRefinementValuesSpy.notCalled);
        });

        it('should call both setProductProperties & addRefinementValues', function () {
            searchHelpersMock.setupSearch(mockApiProductSearch, mockParams2);
            assert.isTrue(setProductPropertiesSpy.calledWith(mockApiProductSearch, mockParams1, mockSelectedCategory, mockParams2.srule));
            assert.isTrue(addRefinementValuesSpy.calledWith(mockApiProductSearch, mockParams2.preferences));
        });
    });

    describe('search', function () {
        beforeEach(function () {
            request = { custom: {} };
        });
        var productSearchStub = sinon.stub();
        var searchSpy = sinon.spy();
        var categoryMock = {
            parent: {
                ID: 'root'
            },
            template: 'rendering/category/categoryproducthits'
        };
        var productSearchModelMock = {
            search: searchSpy,
            getSearchRedirect: function () {
                return {
                    getLocation: function () {
                        return 'some value';
                    }
                };
            },
            category: categoryMock
        };
        var searchHelpersMock3 = proxyquire(searchHelperPath, {
            'dw/catalog/CatalogMgr': {
                getSortingOptions: function () {
                    return;
                },
                getSiteCatalog: function () {
                    return { getRoot: function () { return; } };
                },
                getSortingRule: function (rule) {
                    return rule;
                },
                getCategory: function () {
                    return { ID: 'mens', online: true };
                }
            },
            'dw/catalog/ProductSearchModel': function () {
                return productSearchModelMock;
            },
            'dw/web/URLUtils': {
                url: function () {
                    return {
                        append: function () {
                            return 'some appened URL';
                        }
                    };
                }
            },
            '*/cartridge/scripts/helpers/pageMetaHelper': {
                setPageMetaTags: function () {
                    return;
                },
                setPageMetaData: function () {
                    return;
                }
            },
            '*/cartridge/scripts/helpers/structuredDataHelper': {
                getListingPageSchema: function () {
                    return 'some schema';
                }
            },
            '*/cartridge/models/search/productSearch': productSearchStub,
            '*/cartridge/scripts/reportingUrls': {
                getProductSearchReportingURLs: function () {
                    return ['something', 'something else'];
                }
            },
            '*/cartridge/scripts/search/search': {
                setProductProperties: function () {
                    return;
                },
                addRefinementValues: function () {
                    return;
                }
            }
        });

        var res = {
            cachePeriod: '',
            cachePeriodUnit: '',
            personalized: false
        };
        var mockRequest1 = {
            querystring: {}
        };
        var mockRequest2 = { querystring: { q: 'someValue' } };
        var mockRequest3 = { querystring: { cgid: 'someCategory', preferences: 'preferences', pmin: 'pmin', pmax: 'pmax' } };

        afterEach(function () {
            productSearchStub.reset();
            searchSpy.reset();
        });

        it('should category search', function () {
            productSearchStub.returns({
                isCategorySearch: true,
                isRefinedCategorySearch: false
            });
            var result = searchHelpersMock3.search(mockRequest1, res);

            assert.isTrue(searchSpy.calledOnce);
            assert.equal(result.maxSlots, 4);
            assert.deepEqual(result.category, {
                parent: {
                    ID: 'root'
                },
                template: 'rendering/category/categoryproducthits'
            });
            assert.equal(result.categoryTemplate, 'rendering/category/categoryproducthits');
            assert.equal(result.reportingURLs.length, 2);
            assert.isDefined(result.canonicalUrl);
            assert.isDefined(result.schemaData);
        });

        it('should search', function () {
            productSearchStub.returns({
                isCategorySearch: false,
                isRefinedCategorySearch: false
            });

            categoryMock = null;

            var result = searchHelpersMock3.search(mockRequest1, res);

            assert.isTrue(searchSpy.calledOnce);
            assert.equal(result.maxSlots, 4);
            assert.equal(result.category, null);
            assert.equal(result.categoryTemplate, null);
            assert.equal(result.reportingURLs.length, 2);
        });

        it('should get a search redirect url', function () {
            var result = searchHelpersMock3.search(mockRequest2);

            assert.equal(result.searchRedirect, 'some value');
            assert.isTrue(searchSpy.notCalled);
            assert.equal(result.maxSlots, null);
        });

        it('should search with query string params', function () {
            searchHelpersMock3.search(mockRequest3, res);

            assert.isTrue(searchSpy.calledOnce);
        });
    });

    describe('searchWithStyla', function () {
        beforeEach(function () {
            request = { custom: {
                MagazineConfiguration: {
                    categoryID: 'magazine'
                }
            } };
        });
        var productSearchStub = sinon.stub();
        var searchSpy = sinon.spy();
        var categoryMock = {
            parent: {
                ID: 'root'
            },
            template: 'rendering/category/categoryproducthits'
        };
        var productSearchModelMock = {
            search: searchSpy,
            getSearchRedirect: function () {
                return {
                    getLocation: function () {
                        return 'some value';
                    }
                };
            },
            category: categoryMock
        };
        var searchHelpersMock3 = proxyquire(searchHelperPath, {
            'dw/catalog/CatalogMgr': {
                getSortingOptions: function () {
                    return;
                },
                getSiteCatalog: function () {
                    return { getRoot: function () { return; } };
                },
                getSortingRule: function (rule) {
                    return rule;
                },
                getCategory: function () {
                    return { ID: 'mens', online: true };
                }
            },
            'dw/catalog/ProductSearchModel': function () {
                return productSearchModelMock;
            },
            'dw/web/URLUtils': {
                url: function () {
                    return {
                        append: function () {
                            return 'some appened URL';
                        }
                    };
                }
            },
            '*/cartridge/scripts/helpers/pageMetaHelper': {
                setPageMetaTags: function () {
                    return;
                },
                setPageMetaData: function () {
                    return;
                }
            },
            '*/cartridge/scripts/helpers/structuredDataHelper': {
                getListingPageSchema: function () {
                    return 'some schema';
                }
            },
            '*/cartridge/models/search/productSearch': productSearchStub,
            '*/cartridge/scripts/reportingUrls': {
                getProductSearchReportingURLs: function () {
                    return ['something', 'something else'];
                }
            },
            '*/cartridge/scripts/search/search': {
                setProductProperties: function () {
                    return;
                },
                addRefinementValues: function () {
                    return;
                }
            }
        });

        var res = {
            cachePeriod: '',
            cachePeriodUnit: '',
            personalized: false
        };
        var mockRequest1 = {
            querystring: {}
        };
        var mockRequest2 = { querystring: { q: 'someValue' } };
        var mockRequest3 = { querystring: { cgid: 'someCategory', preferences: 'preferences', pmin: 'pmin', pmax: 'pmax' } };

        afterEach(function () {
            productSearchStub.reset();
            searchSpy.reset();
        });

        it('should category search', function () {
            productSearchStub.returns({
                isCategorySearch: true,
                isRefinedCategorySearch: false
            });
            var result = searchHelpersMock3.search(mockRequest1, res);

            assert.isTrue(searchSpy.calledOnce);
            assert.equal(result.maxSlots, 4);
            assert.deepEqual(result.category, {
                parent: {
                    ID: 'root'
                },
                template: 'rendering/category/categoryproducthits'
            });
            assert.equal(result.categoryTemplate, 'rendering/category/categoryproducthits');
            assert.equal(result.reportingURLs.length, 2);
            assert.isDefined(result.canonicalUrl);
            assert.isDefined(result.schemaData);
        });

        it('should search', function () {
            productSearchStub.returns({
                isCategorySearch: false,
                isRefinedCategorySearch: false
            });

            categoryMock = null;

            var result = searchHelpersMock3.search(mockRequest1, res);

            assert.isTrue(searchSpy.calledOnce);
            assert.equal(result.maxSlots, 4);
            assert.deepEqual(result.category, {
                parent: {
                    ID: 'root'
                },
                template: 'rendering/category/categoryproducthits'
            });
            assert.equal(result.categoryTemplate, 'rendering/category/categoryproducthits');
            assert.equal(result.reportingURLs.length, 2);
        });

        it('should get a search redirect url', function () {
            var result = searchHelpersMock3.search(mockRequest2);

            assert.equal(result.searchRedirect, 'some value');
            assert.isTrue(searchSpy.notCalled);
            assert.equal(result.maxSlots, null);
        });

        it('should search with query string params', function () {
            searchHelpersMock3.search(mockRequest3, res);

            assert.isTrue(searchSpy.calledOnce);
        });
    });
})