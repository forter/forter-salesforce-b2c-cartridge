var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

/**
 * Initialize REST service registry for a Forter API
 * AuthorizeNet REST Verify Service Registry 
 */
function authorizenetService() {
	var service = LocalServiceRegistry.createService('authorizenet.rest.payment', {
        createRequest: function (svc, params) {
            svc.addHeader('Content-Type', 'text/xml');
            svc.setRequestMethod('POST');

            return params;
        },
        parseResponse: function (svc, client) {
            return client;
        },
        filterLogMessage: function (msg) {
            return msg;
        }
    });

    return service;
}

module.exports = {
    authorizenetService: authorizenetService
};
