var assert = require('chai').assert;
var request = require('request-promise');
var config = require('../it.config');
var chai = require('chai');
var chaiSubset = require('chai-subset');
var jsonHelpers = require('../helpers/jsonUtils');
chai.use(chaiSubset);

/**
 * Test case:
 * should be able to submit an order
 */

describe('Add product and place order', function () {
    this.timeout(15000);

    describe('Submit payment with Shipping and Billing Information', function () {
        var cookieJar = request.jar();
        var userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.104 Safari/537.36';

        before(function () {
            var qty1 = 1;
            var variantPid1 = '701642888468M';
            var cookieString;

            var myRequest = {
                url: '',
                method: 'POST',
                rejectUnauthorized: false,
                resolveWithFullResponse: true,
                jar: cookieJar,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'User-Agent': userAgent
                }
            };

            var addProd = '/Cart-AddProduct';

            // ----- Step 1 adding product to Cart
            myRequest.url = config.baseUrl + addProd;
            myRequest.form = {
                pid: variantPid1,
                quantity: qty1
            };

            return request(myRequest)
                .then(function (addToCartResponse) {
                    assert.equal(addToCartResponse.statusCode, 200, 'Expected add to Cart request statusCode to be 200.');
                    cookieString = cookieJar.getCookieString(myRequest.url);
                    myRequest.url = config.baseUrl + '/CSRF-Generate';
                    var cookie = request.cookie(cookieString);
                    cookieJar.setCookie(cookie, myRequest.url);
                    // step2 : get cookies, Generate CSRF, then set cookies
                    return request(myRequest);
                })
                .then(function (csrfResponse) {
                    var csrfJsonResponse = JSON.parse(csrfResponse.body);
                    // step3 : submit billing request with token aquired in step 2
                    myRequest.url = config.baseUrl + '/CheckoutServices-SubmitCustomer?'
                        + csrfJsonResponse.csrf.tokenName + '='
                        + csrfJsonResponse.csrf.token;
                    myRequest.form = {
                        dwfrm_coCustomer_email: 'approve@forter.com',
                    };
                    return request(myRequest);
                })
                .then(function (submitCustomer) {
                    assert.equal(submitCustomer.statusCode, 200, 'Expected add to Cart request statusCode to be 200.');
                    cookieString = cookieJar.getCookieString(myRequest.url);
                    myRequest.url = config.baseUrl + '/CSRF-Generate';
                    var cookie = request.cookie(cookieString);
                    cookieJar.setCookie(cookie, myRequest.url);
                    // step2 : get cookies, Generate CSRF, then set cookies
                    return request(myRequest);
                })
                .then(function (csrfResponse) {
                    var csrfJsonResponse = JSON.parse(csrfResponse.body);
                    myRequest.url = config.baseUrl + '/CheckoutShippingServices-SubmitShipping?'
                        + csrfJsonResponse.csrf.tokenName + '='
                        + csrfJsonResponse.csrf.token;
                    myRequest.form = {
                        dwfrm_shipping_shippingAddress_addressFields_firstName: 'John',
                        dwfrm_shipping_shippingAddress_addressFields_lastName: 'Cena',
                        dwfrm_shipping_shippingAddress_addressFields_address1: '20101 Hamilton',
                        dwfrm_shipping_shippingAddress_addressFields_address2: '',
                        dwfrm_shipping_shippingAddress_addressFields_country: 'US',
                        dwfrm_shipping_shippingAddress_addressFields_states_stateCode: 'CA',
                        dwfrm_shipping_shippingAddress_addressFields_city: 'Torrance',
                        dwfrm_shipping_shippingAddress_addressFields_postalCode: '10004',
                        dwfrm_shipping_shippingAddress_addressFields_phone: '9786543213'
                    };
                    return request(myRequest);
                })
                .then(function (submitShippingResponse) {
                    assert.equal(submitShippingResponse.statusCode, 200, 'Expected SubmitShipping request statusCode to be 200.');
                    cookieString = cookieJar.getCookieString(myRequest.url);
                    myRequest.url = config.baseUrl + '/CSRF-Generate';
                    var cookie = request.cookie(cookieString);
                    cookieJar.setCookie(cookie, myRequest.url);
                    return request(myRequest);
                })
                .then(function (csrfResponse) {
                    var csrfJsonResponse = JSON.parse(csrfResponse.body);
                    // step3 : submit billing request with token aquired in step 2
                    myRequest.url = config.baseUrl + '/CheckoutServices-SubmitPayment?'
                        + csrfJsonResponse.csrf.tokenName + '='
                        + csrfJsonResponse.csrf.token;
                    myRequest.form = {
                        dwfrm_billing_shippingAddressUseAsBillingAddress: 'true',
                        dwfrm_billing_addressFields_firstName: 'John',
                        dwfrm_billing_addressFields_lastName: 'Cena',
                        dwfrm_billing_addressFields_address1: '20101 Hamilton Ave',
                        dwfrm_billing_addressFields_address2: '',
                        dwfrm_billing_addressFields_country: 'US',
                        dwfrm_billing_addressFields_states_stateCode: 'CA',
                        dwfrm_billing_addressFields_city: 'Torrance',
                        dwfrm_billing_addressFields_postalCode: '10004',
                        dwfrm_billing_paymentMethod: 'CREDIT_CARD',
                        dwfrm_billing_creditCardFields_cardType: 'Visa',
                        dwfrm_billing_creditCardFields_cardNumber: '4111111111111111',
                        dwfrm_billing_creditCardFields_expirationMonth: '2',
                        dwfrm_billing_creditCardFields_expirationYear: '2028.0',
                        dwfrm_billing_creditCardFields_securityCode: '342',
                        dwfrm_billing_contactInfoFields_phone: '9786543213'
                    };
                    var ExpectedResBody = {
                        locale: 'en_US',
                        address: {
                            firstName: { value: 'John' },
                            lastName: { value: 'Cena' },
                            address1: { value: '20101 Hamilton Ave' },
                            address2: { value: null },
                            city: { value: 'Torrance' },
                            stateCode: { value: 'CA' },
                            postalCode: { value: '10004' },
                            countryCode: { value: 'US' }
                        },
                        paymentMethod: { value: 'CREDIT_CARD', htmlName: 'CREDIT_CARD' },
                        email: { value: 'approve@forter.com' },
                        phone: { value: '9786543213' },
                        error: true,
                        cartError: true,
                        fieldErrors: [],
                        serverErrors: [],
                        saveCard: false
                    };

                    return request(myRequest)
                        .then(function (response) {
                            var bodyAsJson = JSON.parse(response.body);
                            var strippedBody = jsonHelpers.deleteProperties(bodyAsJson, ['redirectUrl', 'action', 'queryString']);
                            assert.equal(response.statusCode, 200, 'Expected CheckoutServices-SubmitPayment statusCode to be 200.');
                            assert.containSubset(strippedBody.address, ExpectedResBody.address, 'Expecting actual response address to be equal match expected response address');
                            assert.isFalse(strippedBody.error);
                            assert.equal(strippedBody.paymentMethod.value, ExpectedResBody.paymentMethod.value);
                            assert.equal(strippedBody.order.orderEmail, ExpectedResBody.email.value);
                            assert.equal(strippedBody.phone.value, ExpectedResBody.phone.value);
                        });
                });
        });

        it('Should Place the Order', function () {
            var myRequest = {
                url: '',
                method: 'POST',
                rejectUnauthorized: false,
                resolveWithFullResponse: true,
                jar: cookieJar,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'User-Agent': userAgent
                }
            };
            myRequest.url = config.baseUrl + '/CheckoutServices-PlaceOrder';

            return request(myRequest)
            // Handle response from request
                .then(function (response) {
                    assert.equal(response.statusCode, 200, 'Expected statusCode to be 200.');
                    var bodyAsJson = JSON.parse(response.body);
                    var actualRespBodyStripped = jsonHelpers.deleteProperties(bodyAsJson, ['selected', 'default', 'countryCode', 'addressId', 'jobTitle', 'postBox', 'salutation', 'secondName', 'companyName', 'suffix', 'suite', 'title']);
                    assert.isFalse(actualRespBodyStripped.error);
                    assert.include(actualRespBodyStripped.continueUrl, 'Order-Confirm', 'The order is confirmed');
                    assert.notEqual(actualRespBodyStripped.orderID, '');
                    assert.notEqual(actualRespBodyStripped.orderToken, '');
                    assert.isNotNull(actualRespBodyStripped.orderID);
                    assert.isNotNull(actualRespBodyStripped.orderToken);
                });
        });
    });
});
