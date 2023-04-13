'use strict';
var Transaction = require('dw/system/Transaction');

function execute(args) {

    var basket          = args.Basket,
        paymentType     = args.PaymentType,
        removeExisting  = args.RemoveExisting,
        resp            = {};

    // verify that we have a basket and a valid credit card form
    if (basket == null || paymentType == null || removeExisting == null) {
        resp.result = false;
        return resp;
    }

    //     remove existing credit cards from the basket
    if (removeExisting) {
        removeExistingPaymentInstruments(basket, paymentType);
    }

    var amount = calculateNonGiftCertificateAmount(basket), // calculate the amount to be charged for the credit card
        paymentInstr;

    Transaction.wrap(function () {
        paymentInstr = basket.createPaymentInstrument(paymentType, amount);// create a payment instrument for this credit card
    });

    resp.PaymentInstrument = paymentInstr;
    resp.result            = true;

    return resp;
}

/**
 * Determines if the basket already contains a credit card payment
 * instrument and removes it from the basket.
 */
function removeExistingPaymentInstruments(basket, type) {
    // get all credit card payment instruments
    var ccPaymentInstrs = basket.getPaymentInstruments(type),
        iter            = ccPaymentInstrs.iterator(),
        existingPI      = null;

    // remove them
    while (iter.hasNext()) {
        existingPI = iter.next();
        basket.removePaymentInstrument(existingPI);
    }
}

/**
 * Calculates the amount to be payed by a non-gift certificate payment instrument based
 * on the given basket. The method subtracts the amount of all redeemed gift certificates
 * from the order total and returns this value.
 */
function calculateNonGiftCertificateAmount(basket) {
    // the total redemption amount of all gift certificate payment instruments in the basket
    var giftCertTotal = new dw.value.Money(0.0, basket.currencyCode);

    // get the list of all gift certificate payment instruments
    var gcPaymentInstrs = basket.getGiftCertificatePaymentInstruments(),
        iter            = gcPaymentInstrs.iterator(),
        orderPI         = null;

    // sum the total redemption amount
    while (iter.hasNext()) {
        orderPI = iter.next();
        giftCertTotal = giftCertTotal.add(orderPI.getPaymentTransaction().getAmount());
    }

    var orderTotal  = basket.totalGrossPrice, // get the order total
        amountOpen  = orderTotal.subtract(giftCertTotal); // calculate the amount to charge for the payment instrument,this is the remaining open order total which has to be paid

    // return the open amount
    return amountOpen;
}

module.exports = {
    execute: execute
};