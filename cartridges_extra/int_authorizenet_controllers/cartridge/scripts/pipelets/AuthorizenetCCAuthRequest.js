var AuthorizenetRequest = require("int_authorizenet_controllers/cartridge/scripts/lib/authorizenet/dto/AuthorizenetRequest.ds");
var AuthorizenetPaymentService = require("int_authorizenet_controllers/cartridge/scripts/lib/authorizenet/services/AuthorizenetPaymentService");
var AuthorizenetLogger = require("int_authorizenet_controllers/cartridge/scripts/lib/authorizenet/AuthorizenetLogger.ds");
var AuthorizenetResponse = require("int_authorizenet_controllers/cartridge/scripts/lib/authorizenet/AuthorizenetResponse.ds");
var Transaction = require('dw/system/Transaction');

function execute(args) {
    
	var athorizenetPaymentService   = new AuthorizenetPaymentService(),
	    aResponse                   = new AuthorizenetResponse(),
	    log                         = new AuthorizenetLogger("AuthorizenetCCAuthRequest.js"),
	    result                      = true,
	    authReqPage                 = true,
	    transactionType             = "authOnlyTransaction";
	
	try {
		var authReq = new AuthorizenetRequest(args, authReqPage, transactionType).getXML();
		
		log.debug("AuthorizeNet CC authorize Request ::: \n" + authReq.toString());
		
		var authorizenetResponse = athorizenetPaymentService.process(authReq);
		 
		log.debug(authorizenetResponse);
		
		var pi = args.PaymentInstrument;
        result = (authorizenetResponse.ok === true);
        
        if (result == true) {
            log.debug("Authorizenet CC authorize Response ::: \n" + authorizenetResponse.object.text);
            
            // clean up the response
            var response = authorizenetResponse.object.text.replace(' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns="AnetApi/xml/v1/schema/AnetApiSchema.xsd"', '');
            response  = response.replace('<?xml version="1.0" encoding="utf-8"?>','').substr(1);
            
            var createTransactionResponse = new XML(response);
            aResponse.transactionResponse = createTransactionResponse.transactionResponse;
            
            // 1 is the code in ResponseCode which marks success
            if (aResponse.transactionResponse.responseCode == 1) {
                aResponse.status = 'ok';
                
                var paymentTransaction = pi.paymentTransaction;
                Transaction.wrap(function () {
                	paymentTransaction.setTransactionID(aResponse.transactionResponse.transId.toString());
                });
            } else {
                aResponse.status = 'error';
                result           = false;
            }

            var objAResponse = {};
            objAResponse.avsStreetResult = '';
            objAResponse.avsZipResult = '';
            objAResponse.avsResultCode = aResponse.transactionResponse.avsResultCode.toString();
            objAResponse.cvvResultCode = aResponse.transactionResponse.cvvResultCode.toString();
            objAResponse.authCode = aResponse.transactionResponse.authCode.toString();
            objAResponse.transId = aResponse.transactionResponse.transId.toString()
            objAResponse.errors = {};
            objAResponse.errors.errorCode = aResponse.transactionResponse.descendants('errors').length() > 0 ? aResponse.transactionResponse.descendants('errors').descendants('errorCode').toString() : '';
            objAResponse.errors.errorText = aResponse.transactionResponse.descendants('errors').length() > 0 ? aResponse.transactionResponse.descendants('errors').descendants('errorText').toString() : '';

            objAResponse.messages = {};
            objAResponse.messages.code = aResponse.transactionResponse.descendants('messages').length() > 0 ? aResponse.transactionResponse.descendants('messages').descendants('code').toString() : '';
            objAResponse.messages.description = aResponse.transactionResponse.descendants('messages').length() > 0 ? aResponse.transactionResponse.descendants('messages').descendants('description').toString() : '';

            Transaction.wrap(function () {
            	pi.custom.authorize_net_authorization_json = JSON.stringify(objAResponse);
            	pi.custom.authorize_net_authorization = aResponse.transactionResponse.toString();
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
	resp.AuthorizeNetResponse = aResponse;
	//args.AuthorizeNetResponse = aResponse;
	
	if (result == true) {
		resp.result = true;
		return resp;
        //return PIPELET_NEXT;
    }
	resp.result = false;
	return resp;
	//return PIPELET_ERROR;
}

module.exports = {
    execute: execute
};
