'use strict';

/**
 * ForterOrder class is the DTO object for request.
 *
 * To include this script use:
 * var ForterOrder = require("int_forter/cartridge/scripts/lib/forter/dto/ForterOrder.ds");
 * @param {Object} args - function arguments
 */

function ForterCustomer(order) {
    if (order.customer.profile != null) {
        var OrderMgr = require('dw/order/OrderMgr');
        this.firstName = order.customer.profile.firstName;
        this.lastName = order.customer.profile.lastName;
        this.email = order.customer.profile.email;
        this.accountId = order.customer.ID;
        this.created = Number((order.customer.profile.getCreationDate().getTime() / 1000).toFixed());

        var query = "customerNo = {0} AND paymentStatus = {1}"; // eslint-disable-line
        var allOrders = OrderMgr.searchOrders(query, 'creationDate desc', order.customer.profile.customerNo, 2);
        this.pastOrdersCount = Number(allOrders.count);
    } else {
        this.firstName = order.billingAddress.firstName;
        this.lastName = order.billingAddress.lastName;
        this.email = order.customerEmail;
    }
}

function ForterPhone(phone) {
    this.phone = phone;
}

function ForterPayPal(authResponse) {
    var transactionDetails = JSON.parse(authResponse);

    this.payerId = transactionDetails.payerid; // "FD000A45P";
    this.payerEmail = transactionDetails.email;
    this.payerStatus = transactionDetails.payerstatus.toUpperCase(); // "VERIFIED";
    this.payerAddressStatus = transactionDetails.addressstatus.toUpperCase();// "CONFIRMED";
    this.paymentMethod = '';
    this.paymentStatus = transactionDetails.paymentstatus.toUpperCase(); // "PENDING"
    this.payerAccountCountry = transactionDetails.countrycode.toUpperCase(); // "US";
    this.protectionEligibility = transactionDetails.protectioneligibility.toUpperCase(); // "ELIGIBLE";
    this.correlationId = transactionDetails.correlationid; // "fdshkj2390sdf";
    this.paymentId = '';
    this.authorizationId = transactionDetails.transactionid; // "2WC75407LV7300439";
    this.fullPaypalResponsePayload = {};
    this.fullPaypalResponsePayload = transactionDetails;
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
        this.bin = session.forms.billing.paymentMethods.creditCard.number.value.substring(0, 6);
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

    if (auth && auth.errors.errorCode.length > 0) {                                 // must be adjusted according to the payment gateway used
        processorResponseCode = auth.errors.errorCode.toString();           // must be adjusted according to the payment gateway used
        processorResponseText = auth.errors.errorText.toString();           // must be adjusted according to the payment gateway used
    } else if (auth && auth.messages.code.length > 0) {                             // must be adjusted according to the payment gateway used
        processorResponseCode = auth.messages.code.toString();              // must be adjusted according to the payment gateway used
        processorResponseText = auth.messages.description.toString();       // must be adjusted according to the payment gateway used
    }

    this.verificationResults.processorResponseCode = processorResponseCode;
    this.verificationResults.processorResponseText = processorResponseText;
}

function ForterPayment(order, authResponse, payment, log) {
    var billingAddress = order.billingAddress;

    this.billingDetails = {};
    this.billingDetails.personalDetails = {};
    this.billingDetails.personalDetails.firstName = billingAddress.firstName;
    this.billingDetails.personalDetails.lastName = billingAddress.lastName;
    this.billingDetails.personalDetails.email = order.customerEmail;

    this.billingDetails.address = {};
    this.billingDetails.address.address1 = billingAddress.address1;
    this.billingDetails.address.address2 = !empty(billingAddress.address2) ? billingAddress.address2 : '';
    this.billingDetails.address.zip = billingAddress.postalCode;
    this.billingDetails.address.city = billingAddress.city;
    this.billingDetails.address.region = billingAddress.stateCode;
    this.billingDetails.address.country = billingAddress.countryCode.value;

    if (!empty(billingAddress.phone)) {
        this.billingDetails.phone = [];
        this.billingDetails.phone.push(new ForterPhone(billingAddress.phone));
    }

    this.amount = {
        amountLocalCurrency: order.totalGrossPrice.value.toFixed(2),
        currency: order.totalGrossPrice.currencyCode
    };

    if (!empty(payment)) {
        if (payment.paymentMethod === 'PayPal' || payment.paymentMethod === 'BML') {
            this.paypal = new ForterPayPal(authResponse);
        } else if (payment.paymentMethod === 'CREDIT_CARD') {
            this.creditCard = new ForterCreditCard(authResponse, payment);
        }
    } else {
        log.error('No payment method information for order: ' + order.originalOrderNo);
    }
}

function ForterBeneficiaryDetailsFromGiftCard(item) {
    this.personalDetails = {};
    this.comments = {};

    this.personalDetails.fullName = item.recipientName;
    this.personalDetails.email = item.recipientEmail;
    this.comments.messageToBeneficiary = item.message ? item.message : '';
}

function ForterBasicSellerData() {
    this.sellerDetails = {};
    this.sellerDetails.sellerAccountCreationDate = Number((new Date().getTime() / 1000).toFixed());
    this.sellerDetails.sellerPastSalesCount = 0;
    this.sellerDetails.sellerPastSalesSum = { amountUSD: '0.00' };
    this.sellerDetails.availableFundsForWithdrawal = { amountUSD: '0.00' };
}

function ForterCartItem(item, itemType) {
    this.basicItemData = {};
    this.seller = new ForterBasicSellerData();
    if (itemType === 'product') {
        this.basicItemData.productId = item.productID;     // Optional
        this.basicItemData.name = item.productName;   // Required
        this.basicItemData.quantity = item.quantityValue; // Required

        var product = item.getProduct();
        if (product.getCategories().isEmpty() && !empty(product.getVariationModel())) {
            product = product.getVariationModel().getMaster();
        }
        this.basicItemData.category = empty(product) ? '' : product.getCategories()[0].getDisplayName();
        this.basicItemData.type = 'TANGIBLE';                                            // Add if type is available. Change according to the actual item type

        // if any adjustements
        this.basicItemData.price = {};
    }

    if (itemType === 'gift') {
        this.basicItemData.name = item.lineItemText;                                   // Required
        this.basicItemData.quantity = 1;                                                   // Required (set 1 by default for a gift cert?)

        this.basicItemData.type = 'NON_TANGIBLE';                                          // Add if type is available. Change according to the actual item type
        this.deliveryDetails = {};
        this.deliveryDetails.deliveryType = 'DIGITAL';
        this.deliveryDetails.deliveryMethod = 'email';

        this.basicItemData.price = {};

        this.beneficiaries = [];
        this.beneficiaries.push(new ForterBeneficiaryDetailsFromGiftCard(item));
    }
}

function ForterConnectionInformation(request) {
    this.customerIP = request.httpRemoteAddress;                    // Required
    this.userAgent = request.httpUserAgent;
    this.forterTokenCookie = '';

    if (!empty(request.session.privacy.ftrToken)) {
        this.forterTokenCookie = request.session.privacy.ftrToken;
    }
}

function ForterOrder(args, request, authorizationStep) {
    var ForterLogger = require('*/cartridge/scripts/lib/forter/ForterLogger');
    var log = new ForterLogger('ForterOrder.ds');
    var order = args.Order;
    var paymentInstruments = order.getPaymentInstruments();
    var payment = null;
    var authResponse = null;
    var shipment = null;
    var i;

    for (i = 0; i < paymentInstruments.length; i++) {
        var paymentInstrument = paymentInstruments[i];

        if (paymentInstrument.paymentMethod === 'CREDIT_CARD') {  // adjust to the existing payment instruments
            payment = paymentInstrument;
            authResponse = JSON.parse(paymentInstrument.custom.authorize_net_authorization_json);
        } else if (paymentInstrument.paymentMethod === 'PayPal' || paymentInstrument.paymentMethod === 'BML') {  // adjust to the existing payment instruments
            payment = paymentInstrument;
            authResponse = paymentInstrument.custom.paypal_transaction_details_response;
        }
    }

    // General parameters
    this.orderId = order.originalOrderNo;                        // Required
    this.orderType = 'WEB';                                        // Required
    this.timeSentToForter = (new Date()).getTime();                    // Required
    this.checkoutTime = Number((order.creationDate.getTime() / 1000).toFixed());    // Required //must be seconds, not milliseconds
    this.connectionInformation = new ForterConnectionInformation(request);    // Required
    this.authorizationStep = authorizationStep;
    // Calculate totals
    this.totalAmount = { // Required
        amountLocalCurrency: order.totalGrossPrice.value.toFixed(2),
        currency: order.totalGrossPrice.currencyCode
    };

    // Discounts
    var discountPrice = 0;
    var couponName = '';

    if (!order.getCouponLineItems().isEmpty()) {
        var coupons = order.getCouponLineItems();
        var couponNames = [];

        for (i = 0; i < coupons.length; i++) {
            var coup = coupons[i];
            couponNames.push(coup.getCouponCode());

            if (!coup.getPriceAdjustments().isEmpty()) {
                var coupAdjustments = coup.getPriceAdjustments();

                for (var j = 0; j < coupAdjustments.length; j++) {
                    var coupAdj = coupAdjustments[j];
                    discountPrice += coupAdj.priceValue;
                }
            }
        }

        couponName = couponNames.join(',');
        discountPrice *= -1;

        if (discountPrice > 0) {
            this.totalDiscount = {};                                                // Optional
            this.totalDiscount.couponCodeUsed = couponName.substring(0, 20);         // Required
            this.totalDiscount.couponDiscountAmount = {};                            // Required
            this.totalDiscount.couponDiscountAmount.amountLocalCurrency = discountPrice.toFixed(2);
            this.totalDiscount.couponDiscountAmount.currency = order.currencyCode;
            this.totalDiscount.discountType = 'COUPON';                                // Required
        }
    }

    // Customer's details
    this.accountOwner = new ForterCustomer(order);

    // Cart items (regular product)
    this.cartItems = [];                                                    // Required
    for (i = 0; i < order.productLineItems.length; i++) {
        var pli = order.productLineItems[i];
        this.cartItems.push(new ForterCartItem(pli, 'product'));
    }

    // Cart items (gift certificate)
    for (i = 0; i < order.giftCertificateLineItems.length; i++) {
        var gcli = order.giftCertificateLineItems[i];
        this.cartItems.push(new ForterCartItem(gcli, 'gift'));
    }

    // Payments
    this.payment = [];                                                        // Required
    this.payment.push(new ForterPayment(order, authResponse, payment, log));

    // Delivery and Recipient (shipping information)
    if (order.shipments.length > 0) {
        shipment = order.shipments[0];

        this.primaryDeliveryDetails = {};
        this.primaryDeliveryDetails.deliveryMethod = (!empty(shipment.getShippingMethod()) && !empty(shipment.getShippingMethod().getDisplayName())) ? shipment.getShippingMethod().getDisplayName() : ''; // 'BY AIR';

        var deliveryType = 'PHYSICAL'; // default value
        if (order.productLineItems.size() > 0 && order.giftCertificateLineItems.size() === 0) {
            deliveryType = 'PHYSICAL'; // if real products only
        } else if (order.productLineItems.size() === 0 && order.giftCertificateLineItems.size() > 0) {
            deliveryType = 'DIGITAL';  // if gift certificates only
            this.primaryDeliveryDetails.deliveryMethod = 'email';
        } else if (order.productLineItems.size() > 0 && order.giftCertificateLineItems.size() > 0) {
            deliveryType = 'HYBRID';  // if gift certificates and real products
        }
        this.primaryDeliveryDetails.deliveryType = deliveryType;

        if (shipment.productLineItems.size() > 0) {
            this.primaryRecipient = {};                                                // Optional
            this.primaryRecipient.personalDetails = {};

            this.primaryRecipient.personalDetails.firstName = shipment.shippingAddress.firstName; // from the shipping address
            this.primaryRecipient.personalDetails.lastName = shipment.shippingAddress.lastName;  // from the shipping address

            this.primaryRecipient.address = {};
            this.primaryRecipient.address.address1 = shipment.shippingAddress.address1;
            this.primaryRecipient.address.address2 = !empty(shipment.shippingAddress.address2) ? shipment.shippingAddress.address2 : '';
            this.primaryRecipient.address.zip = shipment.shippingAddress.postalCode;
            this.primaryRecipient.address.city = shipment.shippingAddress.city;
            this.primaryRecipient.address.region = shipment.shippingAddress.stateCode;
            this.primaryRecipient.address.country = shipment.shippingAddress.countryCode.displayValue.toUpperCase();

            this.primaryRecipient.phone = [];
            if (!empty(shipment.shippingAddress.phone)) {
                this.primaryRecipient.phone.push(new ForterPhone(shipment.shippingAddress.phone));
            }
        } else if (shipment.giftCertificateLineItems.size() > 0) {
            this.primaryRecipient = {};                                                // Optional
            this.primaryRecipient.personalDetails = {};

            this.primaryRecipient.personalDetails.fullName = shipment.giftCertificateLineItems[0].recipientName; // from the gift form
            this.primaryRecipient.personalDetails.email = shipment.giftCertificateLineItems[0].recipientEmail;   // from the gift form
        }

        if (shipment.gift === true) {
            this.primaryRecipient.comments = {};
            this.primaryRecipient.comments.messageToBeneficiary = shipment.giftMessage ? shipment.giftMessage : '';
        }
    }
}

module.exports = ForterOrder;
