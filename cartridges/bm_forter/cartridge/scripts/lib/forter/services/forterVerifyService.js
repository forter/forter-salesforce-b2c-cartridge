'use strict';
/**
* Initiates Forter config verification request.
*/
function ForterVerifyService() {}

ForterVerifyService.prototype.verifyConfig = function (params) {
    var forterService = require('*/cartridge/scripts/init/forterBMServiceInit');
    var service = forterService.verifyService();

    var response = service.call(params);
    return response;
};

module.exports = ForterVerifyService;
