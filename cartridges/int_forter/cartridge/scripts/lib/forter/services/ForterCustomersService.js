'use strict';
/**
* Initiates Forter customer request.
*/
function ForterCustomersService() {}

ForterCustomersService.prototype.send = function (args, params) {
    var forterService = require('*/cartridge/scripts/init/forterServiceInit');
    var service = forterService.customersService(args.eventType);

    var response = service.call(args, params);
    return response;
};

module.exports = ForterCustomersService;
