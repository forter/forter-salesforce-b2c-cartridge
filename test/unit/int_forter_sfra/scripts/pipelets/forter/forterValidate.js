'use strict';

var assert = require('chai').assert;
var ForterValidate = require('../../../../../mocks/scripts/forter/forterValidate');

describe('ForterValidate', function () {
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
    var args = {
        orderNumber: '00140401',
        orderValidateAttemptInput: 1,
        request: currentRequest
    };

    // This test has dependencies to work, the forterSiteID and forterSecretKey on test/mocks/dw/system/Site.js must be filled
    it('should convert order to an object, send data', function () {
        var result = ForterValidate.validateOrder(args);
        assert.equal(result.JsonResponseOutput.status, 'success');
        assert.equal(result.JsonResponseOutput.transaction, '00140401');
        assert.equal(result.JsonResponseOutput.action, 'approve');
        assert.equal(result.JsonResponseOutput.processorAction, 'capture');
    });
});
