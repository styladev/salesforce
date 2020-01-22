var service = function () {
	return {
		createService: function () {
			return new service();
		},
		getURL : function () { },
		setURL : function (path) {
			return path;
		},
		addParam : function (paramName, paramValue) {
			return {
				paramName: paramValue
			}
		},
		setCachingTTL : function (period) {
			return period;
		},
		call : function () {
			return result = {
				isOk: function () {
					return true;
				},
				object: {
					errorMessage: false,
					html: '<div>Everything is OK</div>'
				}
			}
		}
	}
};

var LocalServiceRegistry = new service();

module.exports = LocalServiceRegistry;