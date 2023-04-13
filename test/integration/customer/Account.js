var assert = require('chai').assert;
var request = require('request-promise');
var config = require('../it.config');
var chai = require('chai');
var chaiSubset = require('chai-subset');
chai.use(chaiSubset);

/**
 * Test case:
 * should be able to register, logout, login, update profile
 */

describe('Main customer actions', function () {
    this.timeout(50000);

    var date = new Date();
    var timestamp = date.getTime();
    var userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.104 Safari/537.36';
    var approved = '0.0.0.1';
    var declined = '0.0.0.2';
    var notReviewed = '0.0.0.3';
    var verificationReq = '0.0.0.4';

    var constructRequest = function (testIP) {
        var cookieJar = request.jar();
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

        if (testIP) {
            myRequest['testIP'] = testIP; // eslint-disable-line dot-notation
        }

        // ----- Step submit the Login form
        myRequest.url = config.baseUrl + '/CSRF-Generate';

        return myRequest;
    };

    var registerAssert = function (myRequest) {
        return request(myRequest)
            .then(function () {
                return request(myRequest);
            })
            .then(function (csrfResponse) {
                var csrfJsonResponse = JSON.parse(csrfResponse.body);

                myRequest.url = config.baseUrl + '/Account-SubmitRegistration?' // eslint-disable-line no-param-reassign
                    + csrfJsonResponse.csrf.tokenName + '='
                    + csrfJsonResponse.csrf.token;
                myRequest.form = { // eslint-disable-line no-param-reassign
                    dwfrm_profile_customer_email: 'John' + timestamp + '@Cena.com',
                    dwfrm_profile_customer_emailconfirm: 'John' + timestamp + '@Cena.com',
                    dwfrm_profile_customer_firstname: 'John',
                    dwfrm_profile_customer_lastname: 'Cena',
                    dwfrm_profile_customer_phone: '9786543213',
                    dwfrm_profile_login_password: 'John' + timestamp + '@Cena.com',
                    dwfrm_profile_login_passwordconfirm: 'John' + timestamp + '@Cena.com'
                };

                return request(myRequest)
                    .then(function (response) {
                        var bodyAsJson = JSON.parse(response.body);
                        assert.equal(bodyAsJson.success, true);
                        assert.equal(bodyAsJson.email, 'John' + timestamp + '@Cena.com');
                    });
            });
    };

    var loginForm = function (csrfResponse, myRequest) {
        var csrfJsonResponse = JSON.parse(csrfResponse.body);
        myRequest.url = config.baseUrl + '/Account-Login?' // eslint-disable-line no-param-reassign
            + csrfJsonResponse.csrf.tokenName + '='
            + csrfJsonResponse.csrf.token;
        myRequest.form = { // eslint-disable-line no-param-reassign
            loginEmail: 'John' + timestamp + '@Cena.com',
            loginPassword: 'John' + timestamp + '@Cena.com',
            loginRememberMe: false
        };
    };

    var updateProfileForm = function (csrfResponse, myRequest) {
        var csrfJsonResponse = JSON.parse(csrfResponse.body);

        myRequest.url = config.baseUrl + '/Account-SaveProfile?' // eslint-disable-line no-param-reassign
            + csrfJsonResponse.csrf.tokenName + '='
            + csrfJsonResponse.csrf.token;
        myRequest.form = { // eslint-disable-line no-param-reassign
            dwfrm_profile_customer_email: 'John' + timestamp + '@Cena.com',
            dwfrm_profile_customer_emailconfirm: 'John' + timestamp + '@Cena.com',
            dwfrm_profile_customer_firstname: 'John1',
            dwfrm_profile_customer_lastname: 'Cena1',
            dwfrm_profile_customer_phone: '9786543213',
            dwfrm_profile_login_password: 'John' + timestamp + '@Cena.com',
            dwfrm_profile_login_passwordconfirm: 'John' + timestamp + '@Cena.com'
        };
    };

    var updatePaymentForm = function (csrfResponse, myRequest) {
        var csrfJsonResponse = JSON.parse(csrfResponse.body);

        myRequest.url = config.baseUrl + '/PaymentInstruments-SavePayment?' // eslint-disable-line no-param-reassign
            + csrfJsonResponse.csrf.tokenName + '='
            + csrfJsonResponse.csrf.token;
        myRequest.form = { // eslint-disable-line no-param-reassign
            dwfrm_creditCard_cardOwner: 'John card',
            dwfrm_creditCard_cardNumber: '4111111111111111',
            dwfrm_creditCard_cardType: 'Visa',
            dwfrm_creditCard_expirationMonth: 10,
            dwfrm_creditCard_expirationYear: 2030
        };
    };

    var loginAssert = function (myRequest) {
        return request(myRequest)
            .then(function () {
                return request(myRequest);
            })
            .then(function (csrfResponse) {
                loginForm(csrfResponse, myRequest);
                return request(myRequest)
                    .then(function (response) {
                        var bodyAsJson = JSON.parse(response.body);
                        assert.equal(bodyAsJson.success, true);
                    });
            });
    };

    var loginAndUpdateAssert = function (myRequest) {
        return request(myRequest)
            .then(function () {
                return request(myRequest);
            })
            .then(function (csrfResponse) {
                loginForm(csrfResponse, myRequest);
                return request(myRequest);
            })
            .then(function () {
                myRequest.url = config.baseUrl + '/CSRF-Generate'; // eslint-disable-line no-param-reassign
                return request(myRequest);
            })
            .then(function (csrfResponse) {
                updateProfileForm(csrfResponse, myRequest);

                return request(myRequest)
                    .then(function (response) {
                        var bodyAsJson = JSON.parse(response.body);
                        assert.equal(bodyAsJson.success, true);
                        assert.equal(bodyAsJson.firstName, 'John1');
                        assert.equal(bodyAsJson.lastName, 'Cena1');
                    });
            });
    };

    var loginSavePaymentAssert = function (myRequest) {
        return request(myRequest)
            .then(function () {
                return request(myRequest);
            })
            .then(function (csrfResponse) {
                loginForm(csrfResponse, myRequest);

                return request(myRequest);
            })
            .then(function () {
                myRequest.url = config.baseUrl + '/CSRF-Generate'; // eslint-disable-line no-param-reassign
                return request(myRequest);
            })
            .then(function (csrfResponse) {
                updatePaymentForm(csrfResponse, myRequest);

                return request(myRequest)
                    .then(function (response) {
                        var bodyAsJson = JSON.parse(response.body);
                        assert.equal(bodyAsJson.success, true);
                        assert.equal(bodyAsJson.cardNumber, '4111111111111111');
                        assert.equal(bodyAsJson.name, 'John card');
                    });
            });
    };

    var loginListPaymentAssert = function (myRequest) {
        return request(myRequest)
            .then(function () {
                return request(myRequest);
            })
            .then(function (csrfResponse) {
                loginForm(csrfResponse, myRequest);

                return request(myRequest);
            })
            .then(function () {
                myRequest.url = config.baseUrl + '/CSRF-Generate'; // eslint-disable-line no-param-reassign
                return request(myRequest);
            })
            .then(function () {
                myRequest.method = 'GET'; // eslint-disable-line no-param-reassign
                myRequest.url = config.baseUrl + '/PaymentInstruments-List'; // eslint-disable-line no-param-reassign

                return request(myRequest)
                    .then(function (response) {
                        assert.equal(response.statusCode, 200);
                    });
            });
    };

    var loginListAddressAssert = function (myRequest) {
        return request(myRequest)
            .then(function () {
                return request(myRequest);
            })
            .then(function (csrfResponse) {
                loginForm(csrfResponse, myRequest);

                return request(myRequest);
            })
            .then(function () {
                myRequest.url = config.baseUrl + '/CSRF-Generate'; // eslint-disable-line no-param-reassign
                return request(myRequest);
            })
            .then(function () {
                myRequest.method = 'GET'; // eslint-disable-line no-param-reassign
                myRequest.url = config.baseUrl + '/Address-List'; // eslint-disable-line no-param-reassign

                return request(myRequest)
                    .then(function (response) {
                        assert.equal(response.statusCode, 200);
                    });
            });
    };

    var loginLogoutAssert = function (myRequest) {
        return request(myRequest)
            .then(function () {
                return request(myRequest);
            })
            .then(function (csrfResponse) {
                loginForm(csrfResponse, myRequest);

                return request(myRequest);
            })
            .then(function () {
                myRequest.url = config.baseUrl + '/CSRF-Generate'; // eslint-disable-line no-param-reassign
                return request(myRequest);
            })
            .then(function () {
                myRequest.method = 'GET'; // eslint-disable-line no-param-reassign
                myRequest.url = config.baseUrl + '/Login-Logout'; // eslint-disable-line no-param-reassign

                return request(myRequest)
                    .then(function (response) {
                        assert.equal(response.statusCode, 200);
                    });
            });
    };

    it('Must register', function () {
        var myRequest = constructRequest();

        return registerAssert(myRequest);
    });

    it('Must login', function () {
        var myRequest = constructRequest();

        return loginAssert(myRequest);
    });

    it('Must login and update profile', function () {
        var myRequest = constructRequest();

        return loginAndUpdateAssert(myRequest);
    });

    it('Must login and add payment instrument', function () {
        var myRequest = constructRequest();

        return loginSavePaymentAssert(myRequest);
    });

    it('Must login and list saved payment instruments', function () {
        var myRequest = constructRequest();

        return loginListPaymentAssert(myRequest);
    });

    it('Must login and list saved addresses', function () {
        var myRequest = constructRequest();

        return loginListAddressAssert(myRequest);
    });

    it('Must login and logout', function () {
        var myRequest = constructRequest();

        return loginLogoutAssert(myRequest);
    });

    /**
     * These tests must be executed in test mode, to set test mode change the preference Force Forter Decision to any value instead of 'DISABLED'
     */
    it('Must login and receive Approved', function () {
        var myRequest = constructRequest(approved);

        return loginAssert(myRequest);
    });

    it('Must login and receive Declined', function () {
        var myRequest = constructRequest(declined);

        return loginAssert(myRequest);
    });

    it('Must login and receive Not reviewed', function () {
        var myRequest = constructRequest(notReviewed);

        return loginAssert(myRequest);
    });

    it('Must login and receive verification required', function () {
        var myRequest = constructRequest(verificationReq);

        return loginAssert(myRequest);
    });
});
