var assert = require('chai').assert;
var searchHelperPath = '../../../../../cartridges/app_storefront_base/cartridge/scripts/helpers/searchHelpers';
var searchHelpers = require(searchHelperPath);
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var sinon = require('sinon');

describe('search helpers', function () {
    describe('get category template', function () {
        it('should return a template', function () {
            var mockApiProductSearch = {
                category: {
                    template: 'rendering/category/catLanding'
                }
            };
            var categoryTemplate = searchHelpers.getCategoryTemplate(mockApiProductSearch);
            assert.equal(categoryTemplate, 'rendering/category/catLanding');
        });

        it('should return no template', function () {
            var mockApiProductSearch = { category: null };
            var categoryTemplate = searchHelpers.getCategoryTemplate(mockApiProductSearch);
            assert.equal(categoryTemplate, '');
        });
    });

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

    describe('setup content search', function () {
        var mockParams = { q: 'denim', startingPage: 0 };

        var setRecursiveFolderSearchSpy = sinon.spy();
        var setSearchPhraseSpy = sinon.spy();
        var searchSpy = sinon.spy();
        var contentSearchSpy = sinon.spy();
        var searchHelpersMock2 = proxyquire(searchHelperPath, {
            'dw/content/ContentSearchModel': function () {
                return {
                    setRecursiveFolderSearch: setRecursiveFolderSearchSpy,
                    setSearchPhrase: setSearchPhraseSpy,
                    search: searchSpy,
                    getContent: function () {
                        return ['jeans', 'shorts'];
                    },
                    getCount: function () { return 2; }
                };
            },
            '*/cartridge/models/search/contentSearch': contentSearchSpy
        });

        searchHelpersMock2.setupContentSearch(mockParams);

        it('should set setRecursiveFolderSearch to true', function () {
            assert.isTrue(setRecursiveFolderSearchSpy.calledWith(true));
        });
        it('should set setSearchPhrase', function () {
            assert.isTrue(setSearchPhraseSpy.calledWith(mockParams.q));
        });
        it('should call search', function () {
            assert.isTrue(searchSpy.called);
        });
        it('should call ContentSearch', function () {
            assert.isTrue(contentSearchSpy.calledWith(['jeans', 'shorts'], 2, 'denim', 0, null));
        });
    });

    describe('applyCache', function () {
        var res = {
            cachePeriod: '',
            cachePeriodUnit: '',
            personalized: false
        };

        it('should apply cache', function () {
            searchHelpers.applyCache(res);
            assert.equal(res.cachePeriod, 1);
            assert.equal(res.cachePeriodUnit, 'hours');
            assert.isTrue(res.personalized);
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
                    categoryID: 'test'
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
});
