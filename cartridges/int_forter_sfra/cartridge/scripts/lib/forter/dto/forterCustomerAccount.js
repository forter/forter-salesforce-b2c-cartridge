'use strict';

var forterConstants = require('~/cartridge/scripts/lib/forter/forterConstants');

var sitePrefs = require('dw/system/Site').getCurrent().getPreferences().getCustom();
var forterForceForterDecision = sitePrefs['forterForceForterDecision'].value; // eslint-disable-line dot-notation
/**
 * ForterCustomerAccount class is the DTO object of the general parameters for Customer Account Update call.
 *
 * To include this script use:
 * var ForterCustomerAccount = require("~/cartridge/scripts/lib/forter/dto/forterCustomerAccount");
 * @param {string} eventType - event type
 * @param {Object} request - current request
 * @param {Object} customer - current customer
 */
function ForterCustomerAccount(eventType, request, customer) {
    function ForterConnectionInformation() {
        this.customerIP = request.httpRemoteAddress;
        if (forterForceForterDecision !== 'DISABLED') {  // if in test mode it may be an integration test run, if so we get the ip address passed by the integration tests.
            this.customerIP = request.httpParameterMap.isParameterSubmitted('testIP') ? request.httpParameterMap.testIP.value : forterForceForterDecision;
        }
        this.userAgent = request.httpUserAgent;          // Required
        this.forterTokenCookie = '';                     // Conditional

        if (!empty(request.session.privacy.ftrToken)) {
            this.forterTokenCookie = request.session.privacy.ftrToken;
        }
    }

    function ForterPersonalDetails() {
        this.firstName = customer.profile.firstName;
        this.lastName = customer.profile.lastName;
        this.fullName = customer.profile.firstName + ' ' + customer.profile.lastName;
        this.accountId = customer.ID;
        this.username = customer.profile.firstName;
        this.email = customer.profile.email;
    }

    function ForterEmail() {
        this.email = customer.profile.email;
        this.emailRole = 'ACCOUNT';
        this.updateTimes = {};
        this.emailVerification = {
            sent: true,
            verified: false
        };
        if (customer.profile.getCreationDate()) {
            this.updateTimes.creationTime = Number((customer.profile.getCreationDate().getTime() / 1000).toFixed());
        }
    }

    function ForterPhone() {
        this.phone = customer.profile.phoneHome;
    }

    function ForterPaymentMethods(cpi) {
        this.billingDetails = {};
        this.billingDetails.personalDetails = {};

        // add this if credicard exists
        this.creditCard = {};

        // format the expiration month. from 1 to 01, etc.
        var creditCardExpMonth;
        if (cpi.creditCardExpirationMonth.toString().length === 1) {
            creditCardExpMonth = '0' + cpi.creditCardExpirationMonth.toString();
        } else {
            creditCardExpMonth = cpi.creditCardExpirationMonth.toString();
        }

        this.creditCard.nameOnCard = cpi.creditCardHolder;
        this.creditCard.cardBrand = cpi.creditCardType;
        this.creditCard.bin = cpi.creditCardNumber.substring(0, 6);
        this.creditCard.lastFourDigits = cpi.creditCardNumberLastDigits;
        this.creditCard.expirationMonth = creditCardExpMonth;
        this.creditCard.expirationYear = cpi.creditCardExpirationYear.toString();
        this.creditCard.cardType = 'UNKNOWN';
        this.creditCard.verificationResults = {};
        this.creditCard.verificationResults.avsFullResult = '';

        // no transaction made in account api, so 0 here
        this.amount = {};
        this.amount.amountUSD = '0';
        this.amount.amountLocalCurrency = '0';
        this.amount.currency = 'USD';
    }

    function ForterAddress(address) {
        this.address1 = address.address1;            // Required

        if (address.address2) {
            this.address2 = address.address2;            // Conditional
        }

        this.zip = address.postalCode;
        this.city = address.city;
        this.region = address.stateCode;
        this.country = address.countryCode.value.toUpperCase();
    }

    /*eslint-disable*/
    function ForterPasswordData(hashedPassword, latestPasswordResetEmailDate) {
        this.hashedPassword = hashedPassword;
        this.latestPasswordResetEmailDate = latestPasswordResetEmailDate;
    }

    function ForterCustomerEngagement() {
        // SFRA core doesn't have wish-list in box. Uncomment and use if any plugin or custom implementation of wish-lists is available.
        /*
        var prodLists = new dw.util.ArrayList(dw.customer.ProductListMgr.getProductLists(customer, dw.customer.ProductList.TYPE_WISH_LIST));

        if (prodLists.size() > 0) {
            var prodItems    = prodLists.get(0).getProductItems();

            if (prodItems.size() == 0) {
                this.wishlist = {};
                this.wishlist.itemInListCount = 0;
            } else {
                this.wishlist = {};
                this.wishlist.itemInListCount = prodItems.size();
            }
        }
        */
        this.extendedBioOrDescription = false;
        this.profileLogo = false;
    }

    function ForterAccountData() {
        this.personalDetails = new ForterPersonalDetails(); // Required
        this.assetsInAccount = {};                          // Required
        this.type = 'PRIVATE';                              // Required - PRIVATE is the default value - must be adjusted according to merchant needs
        this.merchantAccountStatus = 'open';                // Conditional - open is the default value - must be adjusted according to merchant needs
        this.status = 'ACTIVE';
        this.customerEngagement = new ForterCustomerEngagement();
    }

    function getEmails() {
        var emails = [];
        emails.push(new ForterEmail());

        return emails;
    }

    function getPhones() {
        var phones = [];

        if (customer.profile.phoneHome) {
            phones.push(new ForterPhone());
        }

        return phones;
    }

    function getPaymentMethods() {
        var methods = [];

        // loop by the saved credit card here
        for (var i = 0; i < customer.profile.wallet.paymentInstruments.length; i++) {
            var cc = customer.profile.wallet.paymentInstruments[i];
            var creditCardInfo = new ForterPaymentMethods(cc);
            methods.push(creditCardInfo);
        }

        return methods;
    }


    function getAddresses() {
        var addrs = [];

        if (customer.profile) {
            var addresses = customer.profile.addressBook.addresses;

            for (var i = 0; i < addresses.length; i++) {
                var addr = addresses[i];
                var address = new ForterAddress(addr);
                addrs.push(address);
            }
        }

        return addrs;
    }

    /* eslint-disable no-param-reassign */
    function additionalFields(eventType, forterCustomerAccount) {
        switch (eventType) {
            case forterConstants.CUSTOMER_LOGIN:
                forterCustomerAccount.loginMethodType = 'PASSWORD';
                forterCustomerAccount.loginStatus = 'SUCCESS';
                break;
            case forterConstants.CUSTOMER_PROFILE_UPDATE:
                forterCustomerAccount.accountData.addressesInAccount = getAddresses();
                forterCustomerAccount.accountData.paymentMethodsInAccount = getPaymentMethods();
                forterCustomerAccount.accountData.phonesInAccount = getPhones();
                forterCustomerAccount.accountData.emailsInAccount = getEmails();
                break;
            default:
                break;
        }
    }

    this.accountId = customer.ID;                             // Required
    this.channelType = 'WEB';                                     // Required - must be adjusted according to merchant needs
    this.eventTime = (new Date()).getTime();                  // Required
    this.connectionInformation = new ForterConnectionInformation();       // Required
    this.accountData = new ForterAccountData();

    additionalFields(eventType, this);
}

module.exports = ForterCustomerAccount;
