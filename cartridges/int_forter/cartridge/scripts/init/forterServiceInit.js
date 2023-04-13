var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var Encoding = require('dw/crypto/Encoding');
var Bytes = require('dw/util/Bytes');
var sitePrefs = require('dw/system/Site').getCurrent().getPreferences().getCustom();

/**
 * Calls Forter for approval during checkout.
 *
 * Forter REST Validate Service Registry
 * @returns {Object} client - returns response.
 */
function validateService() {
    var service = LocalServiceRegistry.createService('forter.rest.validate', {
        /**
         * Validate order details during checkout.
         * Arguments for authentication are separated because there are populated
         * in request header but not in the request body.
         *
         * @param {Object} svc - svc
         * @param {Object} args - arguments needed for authorization
         * @param {Object} params - parameters which will be sent as body
         * @returns {Object} jsonReq - returns request.
         */
        createRequest: function (svc, args, params) {
            svc.addHeader('Content-Type', 'application/json');
            svc.addHeader('api-version', sitePrefs.versionAPI);
            svc.addHeader('x-forter-siteid', args.siteId);
            svc.addHeader('x-forter-extver', '105.1.0.1');
            svc.addHeader('x-forter-client', 'demandware');

            var credString = args.secretKey + ':null';
            var base64Credentials = Encoding.toBase64(new Bytes(credString));
            var URL = svc.getURL();
            svc.addHeader('Authorization', 'Basic ' + base64Credentials);
            svc.setURL('https://' + args.siteId + '.' + URL + args.orderId);

            svc.setRequestMethod('POST');
            var jsonReq = JSON.stringify(params);

            return jsonReq;
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

/**
 * Calls Forter to update the forter status.
 *
 * Forter REST Validate Service Registry
 * @returns {Object} client - returns response.
 */
function updateService() {
    var service = LocalServiceRegistry.createService('forter.rest.update', {
        /**
         * Validate order details during checkout.
         * Arguments for authentication are separated because there are populated
         * in request header but not in the request body.
         *
         * @param {Object} svc - svc
         * @param {Object} args - arguments needed for authorization
         * @param {Object} params - parameters which will be sent as body
         * @returns {Object} jsonReq - returns request.
         */
        createRequest: function (svc, args, params) {
            svc.addHeader('Content-Type', 'application/json');
            svc.addHeader('api-version', sitePrefs.versionAPI);
            svc.addHeader('x-forter-siteid', args.siteId);
            svc.addHeader('x-forter-extver', '105.1.0.1');
            svc.addHeader('x-forter-client', 'demandware');

            var credString = args.secretKey + ':null';
            var base64Credentials = Encoding.toBase64(new Bytes(credString));
            var URL = svc.getURL();
            svc.addHeader('Authorization', 'Basic ' + base64Credentials);
            svc.setURL('https://' + args.siteId + '.' + URL + args.orderId);

            svc.setRequestMethod('PUT');
            var jsonReq = JSON.stringify(params);

            return jsonReq;
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

/**
 * Forter customers update operation.
 *
 * Forter REST Settings Service Registry
 * @param {string} triggerEvent - service event from forter
 * @returns {Object} client - returns response.
 */
function customersService(triggerEvent) {
    var service = LocalServiceRegistry.createService('forter.rest.customers', {
        /**
         * Sends customers updated data on login/logout
         * to Forter.
         *
         * @param {Object} svc - svc
         * @param {Object} args - arguments needed for authorization
         * @param {Object} params - parameters which will be sent as body
         * @returns {Object} jsonReq - returns request.
         */
        createRequest: function (svc, args, params) {
            svc.addHeader('Content-Type', 'application/json');
            svc.addHeader('api-version', sitePrefs.versionAPI);
            svc.addHeader('x-forter-siteid', args.siteId);
            svc.addHeader('x-forter-extver', '105.1.0.1');
            svc.addHeader('x-forter-client', 'demandware');

            var credString = args.secretKey + ':null';
            var base64Credentials = Encoding.toBase64(new Bytes(credString));
            svc.addHeader('Authorization', 'Basic ' + base64Credentials);
            svc.setURL(svc.getURL() + triggerEvent + '/' + args.customerId);

            svc.setRequestMethod('POST');
            var jsonReq = JSON.stringify(params);

            return jsonReq;
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

/**
 * Sends error information to Forter if something goes wrong.
 *
 * Forter REST Errors Service Registry
 * @returns {Object} client - returns response.
 */
function errorsService() {
    var service = LocalServiceRegistry.createService('forter.rest.errors', {
        /**
         * Sends error information to Forter.
         * Arguments for authentication are separated because there are populated
         * in request header but not in the request body.
         *
         * @param {Object} svc - svc
         * @param {Object} args - arguments needed for authorization
         * @param {Object} params - parameters which will be sent as body
         * @returns {Object} jsonReq - returns request.
         */
        createRequest: function (svc, args, params) {
            svc.addHeader('Content-Type', 'application/json');
            svc.addHeader('api-version', sitePrefs.versionAPI);
            svc.addHeader('x-forter-siteid', args.siteId);
            svc.addHeader('x-forter-extver', '105.1.0.1');
            svc.addHeader('x-forter-client', 'demandware');

            var credString = args.secretKey + ':null';
            var base64Credentials = Encoding.toBase64(new Bytes(credString));
            svc.addHeader('Authorization', 'Basic ' + base64Credentials);

            svc.setRequestMethod('POST');
            var jsonReq = JSON.stringify(params);

            return jsonReq;
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


/**
 * Forter customers authentication attempts operation.
 *
 * Forter REST Settings Service Registry
 * @returns {Object} client - returns response.
 */
function authenticationAttempt() {
    var service = LocalServiceRegistry.createService('forter.rest.auth.attempt', {
        /**
         * Sends error information to Forter.
         * Arguments for authentication are separated because there are populated
         * in request header but not in the request body.
         *
         * @param {Object} svc - svc
         * @param {Object} args - arguments needed for authorization
         * @param {Object} params - parameters which will be sent as body
         * @returns {Object} jsonReq - returns request.
         */
        createRequest: function (svc, args, params) {
            svc.addHeader('Content-Type', 'application/json');
            svc.addHeader('api-version', sitePrefs.versionAPI);
            svc.addHeader('x-forter-siteid', args.siteId);
            svc.addHeader('x-forter-extver', '105.1.0.1');
            svc.addHeader('x-forter-client', 'demandware');

            var credString = args.secretKey + ':null';
            var base64Credentials = Encoding.toBase64(new Bytes(credString));
            svc.addHeader('Authorization', 'Basic ' + base64Credentials);
            svc.setURL(svc.getURL() + args.customerId);
            svc.setRequestMethod('POST');
            var jsonReq = JSON.stringify(params);

            return jsonReq;
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
    validateService: validateService,
    updateService: updateService,
    customersService: customersService,
    errorsService: errorsService,
    authenticationAttempt: authenticationAttempt
};
