'use strict';
/**
* Initiates Forter order status update request.
*/
function ForterStatusUpdateService() {}

ForterStatusUpdateService.prototype.update = function (args, params) {
    var forterService = require('*/cartridge/scripts/init/forterServiceInit');
    var service = forterService.updateService();

    var response = service.call(args, params);
    return response;
};

module.exports = ForterStatusUpdateService;
