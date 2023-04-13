'use strict';

var assert = require('chai').assert;
var forterConstants = require('../../../../../../mocks/scripts/lib/forter/forterConstants');
var ForterCustomerAccount = require('../../../../../../mocks/scripts/lib/forter/dto/forterCustomerAccount');

describe('ForterCustomerAccount', function () {
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

    it('should convert Customer to an object', function () {
        var result = new ForterCustomerAccount('update', currentRequest, currentCustomer);
        assert.equal(result.accountId, 123465798);
        assert.equal(result.accountData.status, 'ACTIVE');
    });
});
