'use strict';

function execute(args) {
    var ForterLogger = require('*/cartridge/scripts/lib/forter/forterLogger');
    var ForterAuthenticationAttempt = require('*/cartridge/scripts/lib/forter/dto/forterAuthenticationAttempt');
    var ForterAuthenticationAttemptService = require('*/cartridge/scripts/lib/forter/services/forterAuthenticationAttemptService');
    var sitePrefs = require('dw/system/Site').getCurrent().getPreferences().getCustom();
    var log = new ForterLogger('ForterCustomerUpdate.js');
    var forterAuthenticationattemptService = new ForterAuthenticationAttemptService();
    var eventType = args.EventType;
    try {
        var callArgs = {
            siteId: sitePrefs.forterSiteID,
            secretKey: sitePrefs.forterSecretKey,
            customerId: customer.ID,
            eventType: eventType
        };

        var forterAuthenticationAttempt = new ForterAuthenticationAttempt(args, customer, request);

        log.debug('Forter Authentication Attempt Update Request ::: \n' + JSON.stringify(forterAuthenticationAttempt, undefined, 2));

        var forterResponse = forterAuthenticationattemptService.send(callArgs, forterAuthenticationAttempt);

        if (forterResponse.ok === true) {
            log.debug('Forter Authentication Attempt Update Response ::: \n' + forterResponse.object.text);
        } else {
            log.error(forterResponse.msg);
        }
    } catch (e) {
        log.error(e);

        return false;
    }

    return true;
}

module.exports = {
    execute: execute
};
