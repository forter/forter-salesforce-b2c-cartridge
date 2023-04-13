'use strict';

function getCurrent() {
    return {
        getPreferences: function () {
            return {
                getCustom: function () {
                    return {
                        forterSiteID: 'forter_site_ID',
                        forterSecretKey: 'forter_secret_key',
                        forterEnabled: true,
                        forterCancelOrderOnDecline: true,
                        forterAutoInvoiceOnApprove: true,
                        forterShowDeclinedPage: true,
                        forterCustomDeclineMessage: 'custom error message',
                        forterForceForterDecision: {
                            value: 'DISABLED'
                        }
                    };
                }
            };
        }
    };
}

module.exports = {
    getCurrent: getCurrent
};
