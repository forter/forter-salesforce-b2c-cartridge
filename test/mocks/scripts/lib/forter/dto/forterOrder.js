'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var ForterLogger = require('../../../../scripts/lib/forter/forterLogger');
var OrderMgr = require('../../../../dw/order/forter/OrderMgr');

function proxyModel() {
    return proxyquire('../../../../../../cartridges/int_forter_sfra/cartridge/scripts/lib/forter/dto/forterOrder', {
        '*/cartridge/scripts/lib/forter/forterLogger': ForterLogger,
        'dw/order/OrderMgr': OrderMgr
    });
}

module.exports = proxyModel();
