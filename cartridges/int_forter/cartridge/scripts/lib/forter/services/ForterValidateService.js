/**
* Initiates Forter validation request.
*/
function ForterValidateService() {}

ForterValidateService.prototype.validate = function (args, params) {
    var forterService = require('*/cartridge/scripts/init/forterServiceInit');
    var service = forterService.validateService();

    var response = service.call(args, params);
    return response;
};

module.exports = ForterValidateService;
