var AuthorizenetRequest        = require('int_authorizenet_sfra/cartridge/scripts/lib/authorizenet/dto/AuthorizenetRequest.ds'),
    AuthorizenetPaymentService = require('int_authorizenet_sfra/cartridge/scripts/lib/authorizenet/services/AuthorizenetPaymentService'),
    AuthorizenetLogger         = require('int_authorizenet_sfra/cartridge/scripts/lib/authorizenet/AuthorizenetLogger.ds'),
    AuthorizenetResponse       = require('int_authorizenet_sfra/cartridge/scripts/lib/authorizenet/AuthorizenetResponse.ds'),
    Transaction                = require('dw/system/Transaction');

function execute(args) {
    
    var athorizenetPaymentService = new AuthorizenetPaymentService(),
        aResponse                 = new AuthorizenetResponse(),
        log                       = new AuthorizenetLogger("AuthorizenetCCAuthRequest.ds"),
        result                    = true,
        authReqPage               = false,
        transactionType           = "priorAuthCaptureTransaction";
    
    try {
        var authResponse = new XML(args.PaymentInstrument.custom.authorize_net_authorization),
            transId      = authResponse.transId.toString(),
            authReq      = new AuthorizenetRequest(args, authReqPage, transactionType, transId).getXML();
    
         log.debug("AuthorizeNet CC capture Request ::: \n" + authReq.toString());
    
         var authorizenetResponse = athorizenetPaymentService.process(authReq);
    
         log.debug(authorizenetResponse);
    
         result = (authorizenetResponse.ok === true);
    
         if (result == true) {
             log.debug("Authorizenet CC capture Response ::: \n" + authorizenetResponse.object.text);
        
             // clean up the response
             var response = authorizenetResponse.object.text.replace(' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns="AnetApi/xml/v1/schema/AnetApiSchema.xsd"', '');
                 response = response.replace('<?xml version="1.0" encoding="utf-8"?>','').substr(1);
        
             var createTransactionResponse = new XML(response);
             aResponse.transactionResponse = createTransactionResponse.transactionResponse;
        
             // 3 is the code in ResponseCode which mark an error
             if (aResponse.transactionResponse.responseCode == 3) {
                 result           = false;
                 aResponse.status = 'error';
             } else {
                 aResponse.status = 'ok';
            
                 var pi                = args.PaymentInstrument,
                     paymentTrasaction = pi.paymentTransaction,
                     order             = dw.order.OrderMgr.getOrder(args.orderNumber);
                 
                 Transaction.wrap(function () {
                     pi.custom.authorize_net_capture = aResponse.transactionResponse.toString();
                     paymentTrasaction.setTransactionID(aResponse.transactionResponse.transId.toString());
                     order.setPaymentStatus(dw.order.Order.PAYMENT_STATUS_PAID);
                 });
             }
         } else {
             log.error(authorizenetResponse.msg);
        
             aResponse.status = 'error';
             aResponse.errors.push(authorizenetResponse.msg);
         }
    } catch (e) {
        log.error(e);
        result = false;
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
