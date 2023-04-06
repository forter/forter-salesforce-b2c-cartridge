'use strict';

// Local Modules
var server = require('server');
server.extend(module.superModule);

var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

server.append('SaveAddress',
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        this.on('route:BeforeComplete', function () {
            var viewData = res.getViewData();
            if (viewData.addressForm.valid) {
                var argCustomerUpdate = {
                    EventType: require('*/cartridge/scripts/lib/forter/forterConstants').CUSTOMER_PROFILE_UPDATE
                };
                var forterCall = require('*/cartridge/scripts/pipelets/forter/forterCustomerUpdate');

                forterCall.execute(argCustomerUpdate);
            }
        });

        next();
    });

server.append('DeleteAddress',
    userLoggedIn.validateLoggedInAjax,
    function (req, res, next) {
        this.on('route:BeforeComplete', function () {
            var argCustomerUpdate = {
                EventType: require('*/cartridge/scripts/lib/forter/forterConstants').CUSTOMER_PROFILE_UPDATE
            };
            var forterCall = require('*/cartridge/scripts/pipelets/forter/forterCustomerUpdate');

            forterCall.execute(argCustomerUpdate);
        });

        next();
    }
);

module.exports = server.exports();
