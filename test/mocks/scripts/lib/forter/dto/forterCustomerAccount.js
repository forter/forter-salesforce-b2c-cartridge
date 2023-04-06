'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var forterConstants = require('../../../../scripts/lib/forter/forterConstants');
var Site = require('../../../../dw/system/Site');

function proxyModel() {
    return proxyquire('../../../../../../cartridges/int_forter_sfra/cartridge/scripts/lib/forter/dto/forterCustomerAccount', {
        '~/cartridge/scripts/lib/forter/forterConstants': forterConstants,
        'dw/system/Site': Site
    });
}

module.exports = proxyModel();
