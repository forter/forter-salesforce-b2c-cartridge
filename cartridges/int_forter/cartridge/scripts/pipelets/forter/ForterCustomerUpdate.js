var ForterLogger = require('*/cartridge/scripts/lib/forter/ForterLogger');
var ForterCustomerAccount = require('*/cartridge/scripts/lib/forter/dto/ForterCustomerAccount');
var ForterCustomersService = require('*/cartridge/scripts/lib/forter/services/ForterCustomersService');

function execute(args) {
    var sitePrefs = require('dw/system/Site').getCurrent().getPreferences().getCustom();
    var log = new ForterLogger('ForterCustomerUpdate.js');
    var forterCustomersService = new ForterCustomersService();
    var eventType = args.EventType;
    var result = require('~/cartridge/scripts/lib/forter/forterConstants').STATUS_FAILED;
    try {
        var callArgs = {
            siteId: sitePrefs.forterSiteID,
            secretKey: sitePrefs.forterSecretKey,
            customerId: customer.ID,
            eventType: eventType
        };

        var forterCustomerAccount = new ForterCustomerAccount(eventType, request, customer);
        log.debug('Forter Customer Account Update Request ::: ' + JSON.stringify(forterCustomerAccount, undefined, 2));
        var forterResponse = forterCustomersService.send(callArgs, forterCustomerAccount);

        if (forterResponse.ok === true) {
            log.debug('Forter Customer Account Update Response ::: \n' + forterResponse.object.text);
            var forterResponseFormatted = JSON.parse(forterResponse.object.text);
            result = {
                forterDecision: forterResponseFormatted.forterDecision,
                recommendation: forterResponseFormatted.recommendation
            };
        } else {
            log.error(forterResponse.msg);
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
