'use strict';
/**
* Initiates Forter settings request.
*/
function ForterSettingsService() {}

ForterSettingsService.prototype.settings = function (args, params) {
    var forterService = require('*/cartridge/scripts/init/forterBMServiceInit');
    var service = forterService.settingsService();

    var response = service.call(args, params);
    return response;
};

module.exports = ForterSettingsService;
