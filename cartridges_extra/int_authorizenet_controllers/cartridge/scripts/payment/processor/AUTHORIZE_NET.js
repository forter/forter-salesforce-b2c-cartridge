'use strict';

/* API Includes */
var Cart        = require('~/cartridge/scripts/models/CartModel'),
    PaymentMgr  = require('dw/order/PaymentMgr'),
    Transaction = require('dw/system/Transaction'),
    app         = require('~/cartridge/scripts/app'); /* Script Modules */

/**
 * Verifies a credit card against a valid card number and expiration date and possibly invalidates invalid form fields.
 * If the verification was successful a credit card payment instrument is created.
 */
function Handle(args) {
    if (!empty(session.forms.billing.paymentMethods.selectedPaymentMethodID.value)) {
        var paymentMethod = session.forms.billing.paymentMethods.selectedPaymentMethodID.value,
            params = {
                Basket         : args.Basket,
                PaymentType    : paymentMethod,
                RemoveExisting : true
            },
            createPaymentInstrument = require('~/cartridge/scripts/pipelets/checkout/CreatePaymentInstrument'),
            paymentInstrument = createPaymentInstrument.execute(params);

        if (paymentInstrument.result == false) {
            return {error: true};
        } else {
            var creditCardForm   = app.getForm('billing.paymentMethods.creditCard'),
                cardNumber       = creditCardForm.get('number').value(),
                cardSecurityCode = creditCardForm.get('cvn').value(),
                cardType         = creditCardForm.get('type').value(),
                expirationMonth  = creditCardForm.get('expiration.month').value(),
                expirationYear   = creditCardForm.get('expiration.year').value();

            Transaction.wrap(function () {
                paymentInstrument.PaymentInstrument.creditCardHolder          = creditCardForm.get('owner').value();
                paymentInstrument.PaymentInstrument.creditCardNumber          = cardNumber;
                paymentInstrument.PaymentInstrument.creditCardType            = cardType;
                paymentInstrument.PaymentInstrument.creditCardExpirationMonth = expirationMonth;
                paymentInstrument.PaymentInstrument.creditCardExpirationYear  = expirationYear;
            });
        }

        return {success: true};
    } else {
        return {error: true};
    }
}

/**
 * Authorizes a payment using a credit card. The payment is authorized by using the BASIC_CREDIT processor
 * only and setting the order no as the transaction ID. Customizations may use other processors and custom
 * logic to authorize credit card payment.
 */
function Authorize(args) {
    if (empty(session.forms.billing.paymentMethods.selectedPaymentMethodID.value)) {
        return {error: true};
    }

    var orderNo           = args.OrderNo,
        paymentInstrument = args.PaymentInstrument,
        paymentProcessor  = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor();

    Transaction.wrap(function () {
        paymentInstrument.paymentTransaction.transactionID    = orderNo;
        paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
    });

    var argCCAuth = {
            Order             : args.Order,
            PaymentInstrument : paymentInstrument
        },
        authResponse = doAuth(argCCAuth);

    if (authResponse.result == false) {
        var argOrderValidate = {
                Order: args.Order,
                orderValidateAttemptInput: 1,
                authorizationStep: "POST_AUTHORIZATION"
            },
            forterController = require('int_forter/cartridge/controllers/ForterValidate'),
            forterDecision   = forterController.ValidateOrder(argOrderValidate);
        // in case if no response from Forter, try to call one more time
        if (forterDecision.result === false && forterDecision.orderValidateAttemptInput == 2) {
        	var argOrderValidate = {
                    Order: args.Order,
                    orderValidateAttemptInput: 2,
                    authorizationStep: "POST_AUTHORIZATION"
                },
                forterController = require('int_forter/cartridge/controllers/ForterValidate'),
                forterDecision   = forterController.ValidateOrder(argOrderValidate);
        }

        // these lines must be uncommented in case if you want to activate the pre-authorization flow + post-auth order status update - uncomment this and comment the above if you've also uncommented the commented lines in CheckoutServices.js
        // var argOrderUpdate = {
        //     orderNumber: args.Order.currentOrderNo,
        //     updateAttempt: 1
        // },
        // forterCall = require('*/cartridge/controllers/ForterValidate'),
        // forterDecision = forterCall.PostAuthOrderStatusUpdate(argOrderUpdate, "CANCELED_BY_MERCHANT");

        // if (forterDecision.result === false && forterDecision.updateAttempt == 2) {
        //     argOrderUpdate.updateAttempt = 2;
        //     forterDecision = forterCall.PostAuthOrderStatusUpdate(argOrderUpdate, "CANCELED_BY_MERCHANT");
        // }

        if (!empty(forterDecision.PlaceOrderError)) {
            return {error : true, forterErrorCode : forterDecision.PlaceOrderError};
        } else {
            return {error : true};
        }
    }

    if (authResponse.result == true) {
        var argOrderValidate = {
                Order: args.Order,
                orderValidateAttemptInput: 1,
                authorizationStep: "POST_AUTHORIZATION"
            },
            forterController = require('int_forter/cartridge/controllers/ForterValidate'),
            forterDecision   = forterController.ValidateOrder(argOrderValidate);
        // in case if no response from Forter, try to call one more time
        if (forterDecision.result === false && forterDecision.orderValidateAttemptInput == 2) {
        	var argOrderValidate = {
                    Order: args.Order,
                    orderValidateAttemptInput: 2,
                    authorizationStep: "POST_AUTHORIZATION"
                },
                forterController = require('int_forter/cartridge/controllers/ForterValidate'),
                forterDecision   = forterController.ValidateOrder(argOrderValidate);
        }

        if (forterDecision.JsonResponseOutput.processorAction === 'skipCapture' || forterDecision.JsonResponseOutput.processorAction === 'notReviewed') {
            return {authorized: true};
        } else if (forterDecision.JsonResponseOutput.processorAction === 'disabled' || forterDecision.JsonResponseOutput.processorAction === 'internalError' || forterDecision.JsonResponseOutput.processorAction === 'capture') {
            var argCCCapture = {
                    AuthorizeNetResponse : authResponse.AuthorizeNetResponse,
                    Order                : args.Order,
                    PaymentInstrument    : paymentInstrument
                },
                captureResponse = doCapture(argCCCapture);

            if (captureResponse.result == true) {
                return {authorized: true};
            }

            if (captureResponse.result == false) {
                var argVoid = {
                        AuthorizeNetResponse : authResponse.AuthorizeNetResponse,
                        Order                : args.Order,
                        PaymentInstrument    : paymentInstrument
                    },
                    voidResponse = doVoid(argVoid);

                if (!empty(forterDecision.PlaceOrderError)) {
                    return {error : true, forterErrorCode : forterDecision.PlaceOrderError};
                } else {
                    return {error : true};
                }
            }
        } else {
            var argVoid      = {
                    AuthorizeNetResponse : authResponse.AuthorizeNetResponse,
                    Order                : args.Order,
                    PaymentInstrument    : paymentInstrument
                },
                voidResponse = doVoid(argVoid);

            if (!empty(forterDecision.PlaceOrderError)) {
                return {error : true, forterErrorCode : forterDecision.PlaceOrderError};
            } else {
                return {error : true};
            }
        }

        // these lines must be uncommented in case if you want to activate the pre-authorization flow + post-auth order status update - uncomment this and comment the above if you've also uncommented the commented lines in CheckoutServices.js
        // var argOrderUpdate = {
        //     orderNumber: args.Order.currentOrderNo,
        //     updateAttempt: 1
        // },
        // forterCall = require('*/cartridge/controllers/ForterValidate'),
        // forterDecision = forterCall.PostAuthOrderStatusUpdate(argOrderUpdate, "PROCESSING");
        
        // if (forterDecision.result === false && forterDecision.updateAttempt == 2) {
        //     argOrderUpdate.updateAttempt = 2;
        //     forterCall.PostAuthOrderStatusUpdate(argOrderUpdate, "PROCESSING");
        // }
    }

}

function doAuth(argCCAuth) {

    var authorizenetCCAuthRequest = require('~/cartridge/scripts/pipelets/AuthorizenetCCAuthRequest'),
        authResponse              = authorizenetCCAuthRequest.execute(argCCAuth);

    return authResponse;
}

function doCapture(argCCCapture) {

    var authorizenetCCCaptureRequest = require('~/cartridge/scripts/pipelets/AuthorizenetCCCaptureRequest'),
        captureResponse              = authorizenetCCCaptureRequest.execute(argCCCapture);

    return captureResponse;
}

function doVoid(argVoid) {

    var authorizenetVoidRequest = require('~/cartridge/scripts/pipelets/AuthorizenetVoidRequest'),
        voidResponse            = authorizenetVoidRequest.execute(argVoid);

    return voidResponse;
}

/*
 * Module exports
 */
exports.Handle = Handle;
exports.Authorize = Authorize;
