'use strict';

// Local Modules
var server = require('server');
server.extend(module.superModule);

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

server.prepend(
    'Login',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
            var viewData = res.getViewData();
            if (viewData.authenticatedCustomer) {
                var forterConstants = require('*/cartridge/scripts/lib/forter/forterConstants');
                var argCustomerUpdate = {
                    EventType: forterConstants.CUSTOMER_LOGIN
                };
                var forterCall = require('*/cartridge/scripts/pipelets/forter/forterCustomerUpdate');

                var forterResult = forterCall.execute(argCustomerUpdate);

                if (forterResult.forterDecision === forterConstants.STATUS_VERIFICATION_REQ) {
                    var forterAuthAttempCall = require('*/cartridge/scripts/pipelets/forter/forterAuthenticationAttemptUpdate');
                    var argAuthenticationAttemptUpdate = {
                        EventType: forterConstants.CUSTOMER_AUTH_ATTEMPT
                    };

                    // example of object populated with MFA results.
                    argAuthenticationAttemptUpdate.additionalAuthenticationMethod = {
                        verificationOutcome: 'SUCCESS',
                        correlationId: 'HGJ7512345H3DE',
                        emailVerification: {
                            email: customer.profile.email,
                            emailRole: 'ACCOUNT',
                            sent: true,
                            verified: true
                        }
                    };

                    forterAuthAttempCall.execute(argAuthenticationAttemptUpdate);
                }
            }
        });

        return next();
    }
);

server.append(
    'SubmitRegistration',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
            var viewData = res.getViewData();

            if (viewData.authenticatedCustomer) {
                var argCustomerUpdate = {
                    EventType: require('*/cartridge/scripts/lib/forter/forterConstants').CUSTOMER_CREATE
                };
                var forterCall = require('*/cartridge/scripts/pipelets/forter/forterCustomerUpdate');

                forterCall.execute(argCustomerUpdate);
            }
        });

        return next();
    }
);

server.append(
    'SaveProfile',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line
            var CustomerMgr = require('dw/customer/CustomerMgr');
            var customer = CustomerMgr.getCustomerByCustomerNumber(
                req.currentCustomer.profile.customerNo
            );
            var profile = customer.getProfile();

            if (profile) {
                var argCustomerUpdate = {
                    EventType: require('*/cartridge/scripts/lib/forter/forterConstants').CUSTOMER_PROFILE_UPDATE
                };
                var forterCall = require('*/cartridge/scripts/pipelets/forter/forterCustomerUpdate');

                forterCall.execute(argCustomerUpdate);
            }
        });

        return next();
    }
);

module.exports = server.exports();
