'use strict';

function execute(args) {
    var ForterLogger = require('*/cartridge/scripts/lib/forter/forterLogger');
    var ForterCustomerAccount = require('*/cartridge/scripts/lib/forter/dto/forterCustomerAccount');
    var ForterCustomersService = require('*/cartridge/scripts/lib/forter/services/forterCustomersService');
    var sitePrefs = require('dw/system/Site').getCurrent().getPreferences().getCustom();
    var log = new ForterLogger('ForterCustomerUpdate.js');
    var forterCustomersService = new ForterCustomersService();
    var eventType = args.EventType;
    var forterConstants = require('~/cartridge/scripts/lib/forter/forterConstants');
    var result = forterConstants.STATUS_FAILED;

    try {
        var callArgs = {
            siteId: sitePrefs.forterSiteID,
            secretKey: sitePrefs.forterSecretKey,
            customerId: customer.ID,
            eventType: eventType
        };

        var forterCustomerAccount = new ForterCustomerAccount(eventType, request, customer);

        log.debug('Forter Customer Account Update Request ::: \n' + JSON.stringify(forterCustomerAccount, undefined, 2));

        var forterResponse = forterCustomersService.send(callArgs, forterCustomerAccount);
        var forterResponseFormatted = null;

        if (eventType === forterConstants.CUSTOMER_PROFILE_UPDATE || eventType === forterConstants.CUSTOMER_CREATE) {
            forterResponseFormatted = JSON.parse(forterResponse);

            if (forterResponseFormatted.status === 'success') {
                result = forterResponseFormatted;
            }
        } else if (forterResponse.ok === true) {
            forterResponseFormatted = JSON.parse(forterResponse.object.text);
            result = {
                forterDecision: forterResponseFormatted.forterDecision,
                recommendation: forterResponseFormatted.recommendation
            };
        } else {
            log.error(forterResponse);
        }
    } catch (e) {
        log.error(e);

        return result;
    }

    return result;
}

module.exports = {
    execute: execute
};
