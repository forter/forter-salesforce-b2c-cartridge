'use strict';

var assert = require('chai').assert;
var ForterCustomerUpdate = require('../../../../../mocks/scripts/forter/forterCustomerUpdate');

describe('ForterCustomerUpdate', function () {

    var currentRequest = {
        httpRemoteAddress: '91.209.24.253',
        httpUserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36',
        httpCookies: {
            cookieCount: 1,
            '0': {
                name: 'forterToken',
                value: 'e8ce638a58b6493ca426b762cc885ace_1568998550949__UDF43_9ck'
            }
        }
    };
    var currentCustomer = {
        ID: 123465798,
        profile: {
            getCreationDate: function () {
                return {
                    getTime: function () {
                        return 1415273168000;
                    }
                };
            },
            firstName: 'John',
            lastName: 'Snow',
            email: 'jsnow@starks.com',
            addressBook: {
                addresses: [
                    {
                        address1: '15 South Point Drive',
                        address2: null,
                        city: 'Boston',
                        countryCode: {
                            displayValue: 'United States',
                            value: 'US'
                        },
                        firstName: 'John',
                        lastName: 'Snow',
                        ID: 'Home',
                        postalCode: '02125',
                        stateCode: 'MA'
                    },
                    {
                        address1: '15 South Point Drive',
                        address2: null,
                        city: 'Boston',
                        countryCode: {
                            displayValue: 'United States',
                            value: 'US'
                        },
                        firstName: 'John',
                        lastName: 'Snow',
                        ID: 'Home',
                        postalCode: '02125',
                        stateCode: 'MA'
                    }
                ]
            },
            wallet: {
                paymentInstruments: [
                    {
                        creditCardExpirationMonth: '3',
                        creditCardExpirationYear: '2019',
                        creditCardNumber: '4111111111111111',
                        maskedCreditCardNumber: '***********1111',
                        creditCardType: 'Visa',
                        paymentMethod: 'CREDIT_CARD'
                    },
                    {
                        creditCardExpirationMonth: '4',
                        creditCardExpirationYear: '2019',
                        creditCardNumber: '4012888888881881',
                        maskedCreditCardNumber: '***********1881',
                        creditCardType: 'Amex',
                        paymentMethod: 'CREDIT_CARD'
                    }
                ]
            }
        }
    };

    global.request = currentRequest;
    global.customer = currentCustomer;

    var args = {
        EventType: 'update',
        customer: currentCustomer,
        request: currentRequest
    };

    // This test has dependencies to work, the forterSiteID and forterSecretKey on test/mocks/dw/system/Site.js must be filled
    it('should convert customer to an object, send data', function () {
        var result = ForterCustomerUpdate.execute(args);
        assert.equal(result.status, 'success');
    });
});
