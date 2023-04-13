'use strict';

/* API Includes */
var Pipeline = require('dw/system/Pipeline');
var OrderMgr = require('dw/order/OrderMgr');
var URLUtils = require('dw/web/URLUtils');

function Handle(args) {
	var pdict = Pipeline.execute('PAYPAL_CREDIT-Handle', {
		Basket: args.Basket,
		ContinueURL: URLUtils.https('Paypal-ContinueExpressCheckout')
	});
	if(pdict.isSuccess) {
		return {success: true};
	} else {
		return {error: true};
	}
}

function Authorize(args) {
	var pdict = Pipeline.execute('PAYPAL_CREDIT-Authorize', {
		Order: OrderMgr.getOrder(args.OrderNo),
		PaymentInstrument: args.PaymentInstrument
	});
	if(pdict.isAuthorized) {
		return {authorized: true};
	} else {
		return {error: true};
	}
}

/*
 * Module exports
 */

/*
 * Local methods
 */
exports.Handle = Handle;
exports.Authorize = Authorize;
