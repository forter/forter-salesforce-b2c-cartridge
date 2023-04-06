var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var Encoding = require('dw/crypto/Encoding');
var Bytes = require('dw/util/Bytes');

/**
 * Link operation in Business manager.
 *
 * Forter REST Verify Service Registry
 * @returns {Object} client - returns response.
 */
function verifyService() {
    var service = LocalServiceRegistry.createService('forter.rest.verify', {
        /**
         * Verify the authorization args.
         *
         * @param {Object} svc - svc
         * @param {Object} args - arguments needed for authorization
         * @returns {Object} jsonReq - returns request.
         */
        createRequest: function (svc, args) {
            svc.addHeader('Content-Type', 'application/json');
            svc.addHeader('api-version', '2.0');
            svc.addHeader('x-forter-siteid', args.siteId);
            svc.addHeader('x-forter-extver', '105.1.0.1');
            svc.addHeader('x-forter-client', 'demandware');

            var credString = args.secretKey + ':null';
            var base64Credentials = Encoding.toBase64(new Bytes(credString));
            svc.addHeader('Authorization', 'Basic ' + base64Credentials);

            svc.setRequestMethod('GET');
            return '';
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
 * Save operation in Business Manager.
 *
 * Forter REST Settings Service Registry
 * @returns {Object} client - returns response.
 */
function settingsService() {
    var service = LocalServiceRegistry.createService('forter.rest.settings', {
        /**
         * Send Forter configuration to Forter site.
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
            svc.addHeader('api-version', '2.0');
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
        parseResponse: function (svc, response) {
            return response.text;
        },
        filterLogMessage: function (msg) {
            return msg;
        }
    });

    return service;
}

module.exports = {
    verifyService: verifyService,
    settingsService: settingsService
};
