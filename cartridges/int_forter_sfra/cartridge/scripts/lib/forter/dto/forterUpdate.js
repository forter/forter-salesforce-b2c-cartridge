'use strict';
/**
 * ForterUpdate class is the DTO object for request.
 *
 * To include this script use:
 * var ForterUpdate = require('~/cartridge/scripts/lib/forter/dto/forterUpdate');
 */
var Transaction = require('dw/system/Transaction');
var ForterLogger = require('*/cartridge/scripts/lib/forter/forterLogger');
var log = new ForterLogger('ForterUpdate.js');

function ForterPayment(payment, order) { // new function
    var authResponse = JSON.parse(payment.custom.authorize_net_authorization_json);
    function ForterPhone(phone) {
        this.phone = phone;
    }

    function ForterCreditCard(auth, cc) {
        var processorResponseCode = '';
        var processorResponseText = '';
        var creditCardExpMonth;

        // format the expiration month. from 1 to 01, etc.
        if (cc.creditCardExpirationMonth.toString().length === 1) {
            creditCardExpMonth = '0' + cc.creditCardExpirationMonth.toString();
        } else {
            creditCardExpMonth = cc.creditCardExpirationMonth.toString();
        }

        this.nameOnCard = cc.creditCardHolder;
        this.cardBrand = cc.creditCardType;

        if (cc.creditCardNumber.substring(0, 6).indexOf('*') > -1) {
            this.bin = session.forms.billing.creditCardFields.cardNumber.value.substring(0, 6); // session.forms.billing.paymentMethods.creditCard.number.value.substring(0, 6);
        } else {
            this.bin = cc.creditCardNumber.substring(0, 6);
        }

        this.lastFourDigits = cc.creditCardNumberLastDigits;
        this.expirationMonth = creditCardExpMonth;
        this.expirationYear = cc.creditCardExpirationYear.toString();

        this.verificationResults = {};
        this.verificationResults.avsFullResult = auth ? auth.avsResultCode.toString() : '';     // must be adjusted according to the payment gateway used
        this.verificationResults.cvvResult = auth ? auth.cvvResultCode.toString() : '';         // must be adjusted according to the payment gateway used
        this.verificationResults.authorizationCode = auth ? auth.authCode.toString() : '';      // must be adjusted according to the payment gateway used

        this.paymentGatewayData = {};
        this.paymentGatewayData.gatewayName = 'AUTHORIZE.NET';                  // must be adjusted according to the payment gateway used
        this.paymentGatewayData.gatewayTransactionId = auth ? auth.transId.toString() : ''; // must be adjusted according to the payment gateway used

        if (auth && auth.errors.errorCode.length > 0) {                           // must be adjusted according to the payment gateway used
            processorResponseCode = auth.errors.errorCode.toString();     // must be adjusted according to the payment gateway used
            processorResponseText = auth.errors.errorText.toString();     // must be adjusted according to the payment gateway used
        } else if (auth && auth.messages.code.length > 0) {                       // must be adjusted according to the payment gateway used
            processorResponseCode = auth.messages.code.toString();        // must be adjusted according to the payment gateway used
            processorResponseText = auth.messages.description.toString(); // must be adjusted according to the payment gateway used
        }

        this.verificationResults.processorResponseCode = processorResponseCode;
        this.verificationResults.processorResponseText = processorResponseText;
    }

    var billingAddress = order.billingAddress;

    this.billingDetails = {};
    this.billingDetails.personalDetails = {};
    this.billingDetails.personalDetails.firstName = billingAddress.firstName;
    this.billingDetails.personalDetails.lastName = billingAddress.lastName;

    if (billingAddress.phone) {
        this.billingDetails.phone = [];
        this.billingDetails.phone.push(new ForterPhone(billingAddress.phone));
    }

    this.amount = {
        amountLocalCurrency: order.totalGrossPrice.value.toFixed(2),
        currency: order.totalGrossPrice.currencyCode
    };

    if (payment) {
        if (payment.paymentMethod === 'CREDIT_CARD') {
            this.creditCard = new ForterCreditCard(authResponse, payment);
        }
    } else {
        log.error('No payment method information for order: ' + order.originalOrderNo);
    }
}

/**
 *
 * @param {dw.order.Order} order - current order
 * @param {string} manualOrderStatus - can be CANCELLED_BY_MERCHANT or PROCESSING
 */
function ForterUpdate(order, manualOrderStatus) {
    this.orderId = order.orderNo;
    this.eventTime = new Date().getTime();
    this.updatedMerchantStatus = order.status.displayValue;
    this.updatedTotalAmount = {
        amountLocalCurrency: order.totalGrossPrice.value.toFixed(2),
        currency: order.totalGrossPrice.currencyCode
    };

    if (empty(manualOrderStatus)) {
        Transaction.wrap(function () {
            order.custom.forterRemoteStatusRequest = order.status.value; // eslint-disable-line
        });

        this.updatedStatus = order.custom.forterRemoteStatusRequest.displayValue;
    } else {
        this.updatedStatus = manualOrderStatus;
        this.payment = []; // Required

        try {
            var paymentInstruments = order.getPaymentInstruments();
            var paymentInstrument;
            for (var i = 0; i < paymentInstruments.length; i++) {
                paymentInstrument = paymentInstruments[i];
                if (!empty(paymentInstrument.custom.authorize_net_authorization_json)) {
                    this.payment.push(new ForterPayment(paymentInstrument, order));
                }
            }
        } catch (e) {
            log.error(e);
        }
    }
}

module.exports = ForterUpdate;
