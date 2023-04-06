'use strict';
/**
* Initiates Forter authentication attempt request.
*/
function ForterAuthenticationAttemptService() {}

ForterAuthenticationAttemptService.prototype.send = function (args, params) {
    var forterService = require('*/cartridge/scripts/init/forterServiceInit');
    var service = forterService.authenticationAttempt();

    var response = service.call(args, params);
    return response;
};

module.exports = ForterAuthenticationAttemptService;
