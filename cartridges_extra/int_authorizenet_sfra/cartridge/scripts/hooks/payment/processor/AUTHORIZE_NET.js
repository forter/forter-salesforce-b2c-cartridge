'use strict';

var collections        = require('*/cartridge/scripts/util/collections'),
    PaymentInstrument  = require('dw/order/PaymentInstrument'),
    PaymentMgr         = require('dw/order/PaymentMgr'),
    PaymentStatusCodes = require('dw/order/PaymentStatusCodes'),
    Resource           = require('dw/web/Resource'),
    Transaction        = require('dw/system/Transaction');

/**
 * Verifies a credit card against a valid card number and expiration date and possibly invalidates invalid form fields.
 * If the verification was successful a credit card payment instrument is created.
 */
function Handle(basket, paymentInformation) {
    var currentBasket    = basket,
        cardErrors       = {},
        cardNumber       = paymentInformation.cardNumber.value,
        cardSecurityCode = paymentInformation.securityCode.value,
        expirationMonth  = paymentInformation.expirationMonth.value,
        expirationYear   = paymentInformation.expirationYear.value,
        serverErrors     = [],
        creditCardStatus;
    
    var cardType    = paymentInformation.cardType.value,
        paymentCard = PaymentMgr.getPaymentCard(cardType);
    
    if (paymentCard) {
        creditCardStatus = paymentCard.verify(
            expirationMonth,
            expirationYear,
            cardNumber,
            cardSecurityCode
        );
    } else {
        cardErrors[paymentInformation.cardNumber.htmlName] =
            Resource.msg('error.invalid.card.number', 'creditCard', null);

        return { fieldErrors: [cardErrors], serverErrors: serverErrors, error: true };
    }

    if (creditCardStatus.error) {
        collections.forEach(creditCardStatus.items, function (item) {
            switch (item.code) {
                case PaymentStatusCodes.CREDITCARD_INVALID_CARD_NUMBER:
                    cardErrors[paymentInformation.cardNumber.htmlName] =
                        Resource.msg('error.invalid.card.number', 'creditCard', null);
                    break;

                case PaymentStatusCodes.CREDITCARD_INVALID_EXPIRATION_DATE:
                    cardErrors[paymentInformation.expirationMonth.htmlName] =
                        Resource.msg('error.expired.credit.card', 'creditCard', null);
                    cardErrors[paymentInformation.expirationYear.htmlName] =
                        Resource.msg('error.expired.credit.card', 'creditCard', null);
                    break;

                case PaymentStatusCodes.CREDITCARD_INVALID_SECURITY_CODE:
                    cardErrors[paymentInformation.securityCode.htmlName] =
                        Resource.msg('error.invalid.security.code', 'creditCard', null);
                    break;
                default:
                    serverErrors.push(
                        Resource.msg('error.card.information.error', 'creditCard', null)
                    );
            }
        });

        return { fieldErrors: [cardErrors], serverErrors: serverErrors, error: true };
    }
    
    Transaction.wrap(function () {
        var paymentInstruments = currentBasket.getPaymentInstruments(
            PaymentInstrument.METHOD_CREDIT_CARD
        );

        collections.forEach(paymentInstruments, function (item) {
            currentBasket.removePaymentInstrument(item);
        });

        var paymentInstrument = currentBasket.createPaymentInstrument(
            PaymentInstrument.METHOD_CREDIT_CARD, currentBasket.totalGrossPrice
        );

        paymentInstrument.setCreditCardHolder(currentBasket.billingAddress.fullName);
        paymentInstrument.setCreditCardNumber(cardNumber);
        paymentInstrument.setCreditCardType(cardType);
        paymentInstrument.setCreditCardExpirationMonth(expirationMonth);
        paymentInstrument.setCreditCardExpirationYear(expirationYear);
    });

    return { fieldErrors: cardErrors, serverErrors: serverErrors, error: false };
}

/**
 * Authorizes a payment using a credit card. The payment is authorized by using the BASIC_CREDIT processor
 * only and setting the order no as the transaction ID. Customizations may use other processors and custom
 * logic to authorize credit card payment.
 */
function Authorize(orderNumber, paymentInstrument, paymentProcessor) {
    var serverErrors = [],
        fieldErrors  = {},
        error        = false;

    try {
        Transaction.wrap(function () {
            paymentInstrument.paymentTransaction.setTransactionID(orderNumber);
            paymentInstrument.paymentTransaction.setPaymentProcessor(paymentProcessor);
        });

        var argCCAuth   = {
                orderNumber       : orderNumber,
                PaymentInstrument : paymentInstrument
            },
            authResponse = doAuth(argCCAuth);

        if (authResponse.result === false) {
            var argOrderValidate = {
                    orderNumber               : orderNumber,
                    orderValidateAttemptInput : 1,
                    authorizationStep: "POST_AUTHORIZATION"
                },
                forterCall       = require('*/cartridge/scripts/pipelets/forter/forterValidate'),
                forterDecision   = forterCall.validateOrder(argOrderValidate);

            // in case if no response from Forter, try to call one more time
            if (forterDecision.result === false && forterDecision.orderValidateAttemptInput == 2) {
                var argOrderValidate = {
                        orderNumber               : orderNumber,
                        orderValidateAttemptInput : 2,
                        authorizationStep: "POST_AUTHORIZATION"
                    },
                    forterCall       = require('*/cartridge/scripts/pipelets/forter/forterValidate'),
                    forterDecision   = forterCall.validateOrder(argOrderValidate);
            }

            // these lines must be uncommented in case if you want to activate the pre-authorization flow + post-auth order status update - uncomment this and comment the above if you've also uncommented the commented lines in CheckoutServices.js
            //
            // var argOrderUpdate = {
            //     orderNumber: orderNumber,
            //     updateAttempt: 1
            // },
            // forterCall = require('*/cartridge/scripts/pipelets/forter/forterValidate'),
            // forterDecision = forterCall.postAuthOrderStatusUpdate(argOrderUpdate, "CANCELED_BY_MERCHANT");
            
            // if (forterDecision.result === false && forterDecision.updateAttempt == 2) {
            //     argOrderUpdate.updateAttempt = 2;
            //     forterDecision = forterCall.postAuthOrderStatusUpdate(argOrderUpdate, "CANCELED_BY_MERCHANT");
            // }

            error = true;
                serverErrors.push(
                Resource.msg('error.technical', 'checkout', null)
            );
        }

        if (authResponse.result === true) {
            var argOrderValidate = {
                    orderNumber               : orderNumber,
                    orderValidateAttemptInput : 1,
                    authorizationStep         : "POST_AUTHORIZATION"
                },
                forterCall       = require('*/cartridge/scripts/pipelets/forter/forterValidate'),
                forterDecision   = forterCall.validateOrder(argOrderValidate);

            // in case if no response from Forter, try to call one more time
            if (forterDecision.result === false && forterDecision.orderValidateAttemptInput == 2) {
                var argOrderValidate = {
                        orderNumber               : orderNumber,
                        orderValidateAttemptInput : 2,
                        authorizationStep         : "POST_AUTHORIZATION"
                    };
                    forterCall       = require('*/cartridge/scripts/pipelets/forter/forterValidate'),
                    forterDecision   = forterCall.validateOrder(argOrderValidate);
            }

            if (forterDecision.JsonResponseOutput.processorAction === 'skipCapture' || forterDecision.JsonResponseOutput.processorAction === 'notReviewed') {
                error = false;
            } else if (forterDecision.JsonResponseOutput.processorAction === 'disabled' || forterDecision.JsonResponseOutput.processorAction === 'internalError' || forterDecision.JsonResponseOutput.processorAction === 'capture') {
                var argCCCapture    = {
                        AuthorizeNetResponse : authResponse.AuthorizeNetResponse,
                        orderNumber          : orderNumber,
                        PaymentInstrument    : paymentInstrument
                    },
                    captureResponse = doCapture(argCCCapture);

                if (captureResponse.result === true) {
                    error = false;
                }

                if (captureResponse.result === false) {
                    var argVoid      = {
                            AuthorizeNetResponse : authResponse.AuthorizeNetResponse,
                            orderNumber          : orderNumber,
                            PaymentInstrument    : paymentInstrument
                        },
                        voidResponse = doVoid(argVoid);

                    error = true;
                    serverErrors.push(
                          Resource.msg('error.technical', 'checkout', null)
                    );
                }
            } else {
                var argVoid      = {
                        AuthorizeNetResponse : authResponse.AuthorizeNetResponse,
                        orderNumber          : orderNumber,
                        PaymentInstrument    : paymentInstrument
                    },
                    voidResponse = doVoid(argVoid);

                error = true;
                serverErrors.push(
                    Resource.msg('error.technical', 'checkout', null)
                );
            }

            // these lines must be uncommented in case if you want to activate the pre-authorization flow + post-auth order status update - uncomment this and comment the above if you've also uncommented the commented lines in CheckoutServices.js
            // var argOrderUpdate = {
            //     orderNumber: orderNumber,
            //     updateAttempt: 1
            // },
            // forterCall = require('*/cartridge/scripts/pipelets/forter/forterValidate'),
            // forterDecision = forterCall.postAuthOrderStatusUpdate(argOrderUpdate, "PROCESSING");
            //
            // if (forterDecision.result === false && forterDecision.updateAttempt == 2) {
            //     forterDecision.updateAttempt = 2;
            //     forterCall.postAuthOrderStatusUpdate(argOrderUpdate, "PROCESSING");
            // }
            
        }
    } catch (e) {
        error = true;
        serverErrors.push(
            Resource.msg('error.technical', 'checkout', null)
        );
    }

    return { fieldErrors: fieldErrors, serverErrors: serverErrors, error: error };
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
