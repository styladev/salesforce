'use strict';

var base = module.superModule || module.parent.superModule; //added parent to module for testing purposes only. It does not interfere with the functionality of the rest of the app

function setupSearch(apiProductSearch, params) {
	var CatalogMgr = require('dw/catalog/CatalogMgr');
    var searchModelHelper = require('*/cartridge/scripts/search/search');

    var cgid = null;
    if (params.cgid) {
        cgid = params.cgid;
    } else if ('MagazineConfiguration' in request.custom && request.custom.MagazineConfiguration && request.custom.MagazineConfiguration.categoryID) {
        // found category ID stored by StylaMagazine.alias()
        cgid = request.custom.MagazineConfiguration.categoryID;
    }
    if (cgid) {
        var sortingRule = params.srule ? CatalogMgr.getSortingRule(params.srule) : null;
        var selectedCategory = CatalogMgr.getCategory(cgid);
        selectedCategory = selectedCategory && selectedCategory.online ? selectedCategory : null;

        searchModelHelper.setProductProperties(apiProductSearch, params, selectedCategory, sortingRule);

        if (params.preferences) {
            searchModelHelper.addRefinementValues(apiProductSearch, params.preferences);
        }
    }

    return apiProductSearch;
}

function search(req, res) {
    var CatalogMgr = require('dw/catalog/CatalogMgr');
    var ProductSearchModel = require('dw/catalog/ProductSearchModel');
    var URLUtils = require('dw/web/URLUtils');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');
    var ProductSearch = require('*/cartridge/models/search/productSearch');
    var reportingUrlsHelper = require('*/cartridge/scripts/reportingUrls');
    var schemaHelper = require('*/cartridge/scripts/helpers/structuredDataHelper');

    var apiProductSearch = new ProductSearchModel();
    var categoryTemplate = '';
    var maxSlots = 4;
    var productSearch;
    var reportingURLs;

    var searchRedirect = req.querystring.q ? apiProductSearch.getSearchRedirect(req.querystring.q) : null;

    if (searchRedirect) {
        return { searchRedirect: searchRedirect.getLocation() };
    }

    apiProductSearch = setupSearch(apiProductSearch, req.querystring);
    apiProductSearch.search();

    if (!apiProductSearch.personalizedSort) {
        base.applyCache(res);
    }
    categoryTemplate = base.getCategoryTemplate(apiProductSearch);
    productSearch = new ProductSearch(
        apiProductSearch,
        req.querystring,
        req.querystring.srule,
        CatalogMgr.getSortingOptions(),
        CatalogMgr.getSiteCatalog().getRoot()
    );

    pageMetaHelper.setPageMetaTags(req.pageMetaData, productSearch);

    var canonicalUrl = URLUtils.url('Search-Show', 'cgid', req.querystring.cgid);
    var refineurl = URLUtils.url('Search-Refinebar');
    var whitelistedParams = ['q', 'cgid', 'pmin', 'pmax', 'srule'];
    var isRefinedSearch = false;

    Object.keys(req.querystring).forEach(function (element) {
        if (whitelistedParams.indexOf(element) > -1) {
            refineurl.append(element, req.querystring[element]);
        }

        if (['pmin', 'pmax'].indexOf(element) > -1) {
            isRefinedSearch = true;
        }

        if (element === 'preferences') {
            var i = 1;
            isRefinedSearch = true;
            Object.keys(req.querystring[element]).forEach(function (preference) {
                refineurl.append('prefn' + i, preference);
                refineurl.append('prefv' + i, req.querystring[element][preference]);
                i++;
            });
        }
    });

    if (productSearch.searchKeywords !== null && !isRefinedSearch) {
        reportingURLs = reportingUrlsHelper.getProductSearchReportingURLs(productSearch);
    }

    var result = {
        productSearch: productSearch,
        maxSlots: maxSlots,
        reportingURLs: reportingURLs,
        refineurl: refineurl,
        canonicalUrl: canonicalUrl
    };

    if (productSearch.isCategorySearch && !productSearch.isRefinedCategorySearch && categoryTemplate && apiProductSearch.category.parent.ID === 'root') {
        pageMetaHelper.setPageMetaData(req.pageMetaData, productSearch.category);
        result.category = apiProductSearch.category;
        result.categoryTemplate = categoryTemplate;
    }
    if ('MagazineConfiguration' in request.custom && request.custom.MagazineConfiguration && request.custom.MagazineConfiguration.categoryID) {
        result.category = apiProductSearch.category;
        result.categoryTemplate = categoryTemplate;
    }
    if (!categoryTemplate || categoryTemplate === 'rendering/category/categoryproducthits') {
        result.schemaData = schemaHelper.getListingPageSchema(productSearch.productIds);
    }

    // console.log(result);
    return result;
}

exports.setupSearch = setupSearch;
exports.getCategoryTemplate = base.getCategoryTemplate;
exports.setupContentSearch = base.setupContentSearch;
exports.search = search;
exports.applyCache = base.applyCache;