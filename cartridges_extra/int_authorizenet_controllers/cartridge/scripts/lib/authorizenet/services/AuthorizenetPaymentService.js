/**
* Initiates AuthorizeNet config verification request.
*/
function AuthorizenetPaymentService() {}

AuthorizenetPaymentService.prototype.process = function(params) {
    var authorizenetService = require('int_authorizenet_controllers/cartridge/scripts/init/authorizenetServiceInit');
    var service = authorizenetService.authorizenetService();

    var response = service.call(params);
    return response;
}

module.exports = AuthorizenetPaymentService;
