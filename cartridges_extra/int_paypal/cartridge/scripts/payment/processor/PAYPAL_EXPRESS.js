'use strict';

/* API Includes */
var Pipeline = require('dw/system/Pipeline');
var OrderMgr = require('dw/order/OrderMgr');
var URLUtils = require('dw/web/URLUtils');

function Handle(args) {
	var pdict = Pipeline.execute('PAYPAL_EXPRESS-Handle', {
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
	var pdict = Pipeline.execute('PAYPAL_EXPRESS-Authorize', {
		Order: OrderMgr.getOrder(args.OrderNo),
		PaymentInstrument: args.PaymentInstrument
	});
	if(pdict.isAuthorized) {
		if (!empty(pdict.ForterResponse.PlaceOrderError)) {
			return {error: true, forterErrorCode : pdict.ForterResponse.PlaceOrderError};
		} else if ((!empty(pdict.ForterResponse.JsonResponseOutput.actionEnum) && pdict.ForterResponse.JsonResponseOutput.actionEnum == 'DECLINED') && (!empty(pdict.ForterResponse.JsonResponseOutput.processorAction) && pdict.ForterResponse.JsonResponseOutput.processorAction != 'skipCapture')) {
			return {error: true};
		} else {
			return {authorized: true};
		}
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
