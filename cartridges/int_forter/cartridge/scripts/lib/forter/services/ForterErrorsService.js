'use strict';
/**
* Initiates Forter errors request.
*/
function ForterErrorsService() {}

ForterErrorsService.prototype.call = function (args, params) {
    var forterService = require('*/cartridge/scripts/init/forterServiceInit');
    var service = forterService.errorsService();

    var response = service.call(args, params);
    return response;
};

module.exports = ForterErrorsService;
