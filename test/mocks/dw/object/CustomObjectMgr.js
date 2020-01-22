var fs = require('fs');
var CustomObjectMgr = function(){};

CustomObjectMgr.removea = function(){};
CustomObjectMgr.describe = function(){};
CustomObjectMgr.createCustomObject = function(){};
CustomObjectMgr.getCustomObject = function(type, id){
	//console.log('CO query for '+type+' with ID '+id);

	var CoClass = require('./CustomObject');
	var customObject = new CoClass();

	// var tmp = fs.readFileSync('working/'+type+'_CustomObject.xml',{encoding:'utf8'}).split('object-id="'+id+'">\n');
	// if(tmp.length > 1){
	// 	tmp.split('</custom-object>')[0].split('\n').forEach(function(line){
	// 		console.log(line);
	// 	});
	// }// else not found

	if (type == "WebserviceCredentials") {
		customObject.custom = new Object();
		customObject.custom.url = "http://dummy.com";
		customObject.custom.credentialsType = "DUMMY_VALUES";
		customObject.custom.password = "1234567";
	}
	if (type == "WebserviceConfiguration") {
		customObject.custom = new Object();
		customObject.custom.targetEnvironment = "Test-Test";
		customObject.custom.timeout = 1000;
		customObject.custom.serviceEnableLocking = false;
		customObject.custom.logSoap = true;
		customObject.custom.logStatus = true;
	}
	return customObject;

};
CustomObjectMgr.getAllCustomObjects = function(){};
CustomObjectMgr.queryCustomObjects = function () {
	var Iterator = require('../util/Iterator');
	var array = [
		{
			custom: {
				basePath: 'content',
				categoryID: 'magazine',
				enabled: true,
				homepage: false,
				Key_and_Sort_Order: '005 cat /fashion/magazine en',
				locales: ['de_DE', 'default'],
				pipeline: 'app_storefront_base-Search-Show',
				username: 'flymo-uk'
			},
			type: 'StylaMagazineConfiguration',
			UUID: 'd9521b535abe343b1ed4d3d962'
		},
		{
			custom: {
				basePath: 'magazine',
				categoryID: 'magazine',
				enabled: true,
				homepage: false,
				Key_and_Sort_Order: '001 cat /fashion/magazine en',
				locales: ['de_DE', 'default', 'en_US'],
				pipeline: 'app_storefront_base-Search-Show',
				username: 'demandwaretest1'
			},
			type: 'StylaMagazineConfiguration',
			UUID: 'a2d122c102f3710ef42c846208'
		},
		{
			custom: {
				basePath: 'magazine3',
				enabled: true,
				homepage: false,
				Key_and_Sort_Order: '001 gome /fashion/magazine en',
				locales: ['en_GB', 'en_US'],
				pipeline: 'app_storefront_base-Home-Show',
				username: 'demandwaretest1'
			},
			type: 'StylaMagazineConfiguration',
			UUID: '86262e5b488643c720f7c4e562'
		},
		{
			custom: {
				basePath: 'portofolio',
				enabled: true,
				homepage: false,
				Key_and_Sort_Order: 'Odlo Portofolio',
				locales: ['en_INT'],
				pipeline: 'app_storefront_base-Home-Show',
				username: 'odlo-lookbook-en'
			},
			type: 'StylaMagazineConfiguration',
			UUID: 'cff6dd74fb9d5854b70827c039'
		},
		{
			custom: {
				basePath: '/',
				enabled: true,
				homepage: true,
				Key_and_Sort_Order: 'test',
				locales: ['en_US', 'en_GB', 'de_DE', 'fr', 'default'],
				pipeline: 'app_storefront_base-Home-Show',
				username: 'odlo-lookbook-en'
			},
			type: 'StylaMagazineConfiguration',
			UUID: 'c57cac620b663532d5d3680067'
		}
	]

	var customObjects = new Iterator(array);
	return customObjects;
};
CustomObjectMgr.prototype.customObject=null;
CustomObjectMgr.prototype.allCustomObjects=null;

module.exports = CustomObjectMgr;