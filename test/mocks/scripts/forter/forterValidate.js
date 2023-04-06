'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var Transaction = require('../../../mocks/dw/system/Transaction');
var OrderMgr = require('../../../mocks/dw/order/forter/OrderMgr');
var ForterOrder = require('../../../mocks/scripts/lib/forter/dto/forterOrder');
var ForterValidateService = require('../lib/forter/services/forterValidateService');
var ForterErrorsService = require('../lib/forter/services/forterErrorsService');
var ForterLogger = require('../lib/forter/forterLogger');
var ForterResponse = require('../lib/forter/forterResponse');
var ForterError = require('../../../mocks/scripts/lib/forter/dto/forterError');
var sitePrefs = require('../../../mocks/dw/system/Site');

function proxyModel() {
    return proxyquire('../../../../cartridges/int_forter_sfra/cartridge/scripts/pipelets/forter/forterValidate', {
        'dw/system/Transaction': Transaction,
        'dw/order/OrderMgr': OrderMgr,
        '*/cartridge/scripts/lib/forter/dto/forterOrder': ForterOrder,
        '*/cartridge/scripts/lib/forter/services/forterValidateService': ForterValidateService,
        '*/cartridge/scripts/lib/forter/services/forterErrorsService': ForterErrorsService,
        '*/cartridge/scripts/lib/forter/forterLogger': ForterLogger,
        '*/cartridge/scripts/lib/forter/forterResponse': ForterResponse,
        '*/cartridge/scripts/lib/forter/dto/forterError': ForterError,
        'dw/system/Site': sitePrefs
    });
}

module.exports = proxyModel();
