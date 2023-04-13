var AuthorizenetRequest        = require('int_authorizenet_sfra/cartridge/scripts/lib/authorizenet/dto/AuthorizenetRequest.ds'),
    AuthorizenetPaymentService = require('int_authorizenet_sfra/cartridge/scripts/lib/authorizenet/services/AuthorizenetPaymentService'),
    AuthorizenetResponse       = require('int_authorizenet_sfra/cartridge/scripts/lib/authorizenet/AuthorizenetResponse.ds'),
    AuthorizenetLogger         = require('int_authorizenet_sfra/cartridge/scripts/lib/authorizenet/AuthorizenetLogger.ds'),
    Transaction                = require('dw/system/Transaction');

function execute(args) {
    
    var athorizenetPaymentService = new AuthorizenetPaymentService(),
        aResponse                 = new AuthorizenetResponse(),
        log                       = new AuthorizenetLogger("AuthorizenetVoidRequest.ds"),
        result                    = true,
        authReqPage               = false,
        transactionType           = "voidTransaction";
    
    try {
        var authResponse = new XML(args.PaymentInstrument.custom.authorize_net_authorization),
            transId      = authResponse.transId.toString();
            authReq      = new AuthorizenetRequest(args, authReqPage, transactionType, transId).getXML();
        
        log.debug("Void Request ::: \n" + authReq.toString());
        
        var authorizenetResponse = athorizenetPaymentService.process(authReq);
        
        log.debug("Void Response ::: \n" + authorizenetResponse);
        
        result = (authorizenetResponse.ok === true);
        
        if (result == true) {
            log.debug("Void Request ::: \n" + authorizenetResponse.object.text);
            
            // clean up the response
            var response = authorizenetResponse.object.text.replace(' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns="AnetApi/xml/v1/schema/AnetApiSchema.xsd"', '');
            response     = response.replace('<?xml version="1.0" encoding="utf-8"?>','').substr(1);
            
            var createTransactionResponse = new XML(response);
            aResponse.transactionResponse = createTransactionResponse.transactionResponse;
            
            if (aResponse.transactionResponse.responseCode == 3) {
                result           = false;
                aResponse.status = 'error';
            } else {
                aResponse.status = 'ok';
            }
            
            var pi = args.PaymentInstrument;
            Transaction.wrap(function () {
                pi.custom.authorize_net_void = aResponse.transactionResponse.toString();
            });
        } else {
            log.error(authorizenetResponse.msg);
            
            aResponse.status = 'error';
            aResponse.errors.push(authorizenetResponse.msg);
        }
    } catch (e) {
        log.error(e);
        result           = false;
        aResponse.status = 'error';
    }
    
    var resp = {};
    if (result == true) {
        resp.result = true;
        return resp;
    }
    
    resp.result = false;
    return resp;
}

module.exports = {
    execute: execute
};
