'use strict';

// Local Modules
var server = require('server');
server.extend(module.superModule);

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');

/**
 * Checks if a credit card is valid or not
 * @param {Object} card - plain object with card details
 * @param {Object} form - form object
 * @returns {boolean} a boolean representing card validation
 */
function verifyCard(card, form) {
    var collections = require('*/cartridge/scripts/util/collections');
    var Resource = require('dw/web/Resource');
    var PaymentMgr = require('dw/order/PaymentMgr');
    var PaymentStatusCodes = require('dw/order/PaymentStatusCodes');

    var paymentCard = PaymentMgr.getPaymentCard(card.cardType);
    var error = false;
    var cardNumber = card.cardNumber;
    var creditCardStatus;
    var formCardNumber = form.cardNumber;

    if (paymentCard) {
        creditCardStatus = paymentCard.verify(
            card.expirationMonth,
            card.expirationYear,
            cardNumber
        );
    } else {
        formCardNumber.valid = false;
        formCardNumber.error =
            Resource.msg('error.message.creditnumber.invalid', 'forms', null);
        error = true;
    }

    if (creditCardStatus && creditCardStatus.error) {
        collections.forEach(creditCardStatus.items, function (item) {
            switch (item.code) {
                case PaymentStatusCodes.CREDITCARD_INVALID_CARD_NUMBER:
                    formCardNumber.valid = false;
                    formCardNumber.error =
                        Resource.msg('error.message.creditnumber.invalid', 'forms', null);
                    error = true;
                    break;

                case PaymentStatusCodes.CREDITCARD_INVALID_EXPIRATION_DATE:
                    var expirationMonth = form.expirationMonth;
                    var expirationYear = form.expirationYear;
                    expirationMonth.valid = false;
                    expirationMonth.error =
                        Resource.msg('error.message.creditexpiration.expired', 'forms', null);
                    expirationYear.valid = false;
                    error = true;
                    break;
                default:
                    error = true;
            }
        });
    }
    return error;
}

/**
 * Creates an object from form values
 * @param {Object} paymentForm - form object
 * @returns {Object} a plain object of payment instrument
 */
function getDetailsObject(paymentForm) {
    return {
        name: paymentForm.cardOwner.value,
        cardNumber: paymentForm.cardNumber.value,
        cardType: paymentForm.cardType.value,
        expirationMonth: paymentForm.expirationMonth.value,
        expirationYear: paymentForm.expirationYear.value,
        paymentForm: paymentForm
    };
}

server.prepend(
    'SavePayment',
    csrfProtection.validateAjaxRequest,
    function (req, res, next) { // eslint-disable-line
        var formErrors = require('*/cartridge/scripts/formErrors');
        var dwOrderPaymentInstrument = require('dw/order/PaymentInstrument');
        var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');

        var paymentForm = server.forms.getForm('creditCard');
        var result = getDetailsObject(paymentForm);

        if (paymentForm.valid && !verifyCard(result, paymentForm)) {
            res.setViewData(result);

            var URLUtils = require('dw/web/URLUtils');
            var CustomerMgr = require('dw/customer/CustomerMgr');
            var Transaction = require('dw/system/Transaction');

            var formInfo = res.getViewData();
            var customer = CustomerMgr.getCustomerByCustomerNumber(
                req.currentCustomer.profile.customerNo
            );
            var wallet = customer.getProfile().getWallet();

            Transaction.wrap(function () {
                var paymentInstrument = wallet.createPaymentInstrument(dwOrderPaymentInstrument.METHOD_CREDIT_CARD);
                paymentInstrument.setCreditCardHolder(formInfo.name);
                paymentInstrument.setCreditCardNumber(formInfo.cardNumber);
                paymentInstrument.setCreditCardType(formInfo.cardType);
                paymentInstrument.setCreditCardExpirationMonth(formInfo.expirationMonth);
                paymentInstrument.setCreditCardExpirationYear(formInfo.expirationYear);
            });

            // Send account edited email
            accountHelpers.sendAccountEditedEmail(customer.profile);

            var argCustomerUpdate = {
                EventType: require('*/cartridge/scripts/lib/forter/forterConstants').CUSTOMER_PROFILE_UPDATE
            };
            var forterCall = require('*/cartridge/scripts/pipelets/forter/forterCustomerUpdate');

            forterCall.execute(argCustomerUpdate);

            res.json({
                success: true,
                redirectUrl: URLUtils.url('PaymentInstruments-List').toString()
            });
        } else {
            res.json({
                success: false,
                fields: formErrors.getFormErrors(paymentForm)
            });
        }

        this.emit('route:Complete', req, res);
        return;
    }
);

server.append('DeletePayment',
    userLoggedIn.validateLoggedInAjax,
    function (req, res, next) { // eslint-disable-line
        this.on('route:BeforeComplete', function () {
            var argCustomerUpdate = {
                EventType: require('*/cartridge/scripts/lib/forter/forterConstants').CUSTOMER_PROFILE_UPDATE
            };
            var forterCall = require('*/cartridge/scripts/pipelets/forter/forterCustomerUpdate');

            forterCall.execute(argCustomerUpdate);
        });

        next();
    }
);

module.exports = server.exports();
