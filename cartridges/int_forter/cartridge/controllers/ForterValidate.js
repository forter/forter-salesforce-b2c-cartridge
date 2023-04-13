'use strict';

var guard = require('~/cartridge/scripts/guard');

function validateOrder(args) {
    var Transaction = require('dw/system/Transaction');
    var ForterOrder = require('*/cartridge/scripts/lib/forter/dto/ForterOrder');
    var ForterValidateService = require('*/cartridge/scripts/lib/forter/services/ForterValidateService');
    var ForterErrorsService = require('*/cartridge/scripts/lib/forter/services/ForterErrorsService');
    var ForterLogger = require('*/cartridge/scripts/lib/forter/ForterLogger');
    var ForterResponse = require('*/cartridge/scripts/lib/forter/ForterResponse');
    var ForterError = require('*/cartridge/scripts/lib/forter/dto/ForterError');
    var sitePrefs = require('dw/system/Site').getCurrent().getPreferences().getCustom();
    var log = new ForterLogger('ForterValidate.validateOrder.js');
    var fResponse = new ForterResponse();
    var forterValidateService = new ForterValidateService();
    var forterErrorsService = new ForterErrorsService();
    var order = args.Order;
    var orderRequest = null;
    var result = true;
    var orderValidateAttempt = args.orderValidateAttemptInput ? args.orderValidateAttemptInput : 1;
    var callArgs = {
        siteId: sitePrefs.forterSiteID,
        secretKey: sitePrefs.forterSecretKey,
        orderId: order.originalOrderNo
    };
    var forterError;
    var forterErrorResponse; // eslint-disable-line
    var resp = {};

    if (sitePrefs.forterEnabled === false) {
        fResponse.processorAction = 'disabled';
        resp.JsonResponseOutput = fResponse;
        resp.result = true;
        return resp;
    }

    try {
        orderRequest = new ForterOrder(args, request, args.authorizationStep);

        log.debug('Forter Order Validate Attempt ::: ' + orderValidateAttempt);

        var forterResponse = forterValidateService.validate(callArgs, orderRequest);

        if (forterResponse.ok === true) {
            log.debug('Forter Order Validate Response ::: \n' + forterResponse.object.text);

            result = true;
            fResponse = JSON.parse(forterResponse.object.text);

            if (fResponse.action === 'approve') {
                fResponse.actionEnum = 'APPROVED';
            } else if (fResponse.action === 'decline') {
                fResponse.actionEnum = 'DECLINED';
            } else if (fResponse.action === 'not reviewed') {
                fResponse.actionEnum = 'NOT_REVIEWED';
            } else {
                fResponse.actionEnum = 'FAILED';
            }

            Transaction.wrap(function () {
                order.custom.forterOrderStatus = order.status.value;
            });

            var getLink = new RegExp('(?=http)(.*?)(\\s|$)');
            var match = getLink.exec(fResponse.message);

            if (match != null) {
                fResponse.orderLink = match[1];
            } else {
                fResponse.orderLink = '';
            }

            // if successfully sent first time : have an order with the Retry number: field set as 0 (Order -> Attributes tab)
            Transaction.wrap(function () {
                order.custom.forterRetryNumber = '0';
            });
        } else {
            log.error(forterResponse.msg);

            fResponse.actionEnum = 'ERROR';
            fResponse.orderLink = '';
            fResponse.processorAction = 'internalError';

            forterError = new ForterError(order.getOrderNo(), forterResponse.msg, forterResponse.errorMessage);
            forterErrorResponse = forterErrorsService.call(callArgs, forterError);

            // if 1st retry : have an order with the Retry number: field set as 1 (Order -> Attributes tab)
            // if 1st retry failed : have an order with the Retry number: field set as 2 (Order -> Attributes tab)
            Transaction.wrap(function () {
                order.custom.forterRetryNumber = orderValidateAttempt.toString();
            });

            if (orderValidateAttempt === 1) {
                log.error('Forter Order ' + order.originalOrderNo + '. Validate Retry: ' + orderValidateAttempt + '. Response status: ' + forterResponse.status + '. Forter response error message: ' + forterResponse.errorMessage);

                resp.orderValidateAttemptInput = 2;
                resp.result = false;
                return resp;
            }

            if (orderValidateAttempt > 1) {
                log.error('Forter Order ' + order.originalOrderNo + '. Validate Retry: ' + orderValidateAttempt + '. Response status: ' + forterResponse.status + '. Forter response error message: ' + forterResponse.errorMessage);
            }
        }
    } catch (e) {
        log.error(e);

        fResponse.actionEnum = 'ERROR';
        fResponse.orderLink = '';
        fResponse.processorAction = 'internalError';

        forterError = new ForterError(order.getOrderNo(), e);
        forterErrorResponse = forterErrorsService.call(callArgs, forterError);

        // if 1st retry : have an order with the Retry number: field set as 1 (Order -> Attributes tab)
        // if 1st retry failed : have an order with the Retry number: field set as 2 (Order -> Attributes tab)
        Transaction.wrap(function () {
            order.custom.forterRetryNumber = orderValidateAttempt.toString();
        });

        if (orderValidateAttempt === 1) {
            log.error('Forter Order ' + order.originalOrderNo + '. Validate Retry: ' + orderValidateAttempt + '. Catched error: ' + e);

            resp.orderValidateAttemptInput = 2;
            resp.result = false;
            return resp;
        }

        if (orderValidateAttempt > 1) {
            log.error('Forter Order ' + order.originalOrderNo + '. Validate Retry: ' + orderValidateAttempt + '. Catched error: ' + e);
        }
    }

    if (fResponse.actionEnum === 'DECLINED') {
        if (sitePrefs.forterCancelOrderOnDecline === true) {
            fResponse.processorAction = 'void';
            if (sitePrefs.forterShowDeclinedPage === true && sitePrefs.forterCustomDeclineMessage) {
                resp.PlaceOrderError = {
                    code: sitePrefs.forterCustomDeclineMessage
                };
            }
        } else {
            fResponse.processorAction = 'skipCapture';
        }
    } else if (fResponse.actionEnum === 'NOT_REVIEWED') {
        fResponse.processorAction = 'notReviewed';
    } else if (fResponse.actionEnum === 'APPROVED') {
        fResponse.processorAction = sitePrefs.forterAutoInvoiceOnApprove ? 'capture' : 'skipCapture';
    }

    Transaction.wrap(function () {
        order.custom.forterDecision = fResponse.actionEnum;
        order.custom.forterOrderLink = fResponse.orderLink;
        order.custom.forterUserAgent = !empty(orderRequest) ? orderRequest.connectionInformation.userAgent : null;
        order.custom.forterTokenCookie = !empty(orderRequest) ? orderRequest.connectionInformation.forterTokenCookie : null;
        order.custom.forterRecommendations = fResponse.recommendations;
    });

    resp.JsonResponseOutput = fResponse;

    if (result === true) {
        resp.result = true;
        return resp;
    }

    resp.result = false;
    return resp;
}

function stringifyResponse(obj) {
    var parsedObj = {};

    for (var key in obj.keySet().toArray()) { // eslint-disable-line
        if (obj.get(key)) {
            parsedObj[key] = obj.get(key);
        }
    }

    return JSON.stringify(parsedObj);
}

function storeResponse(args) {
    var Transaction = require('dw/system/Transaction');
    var ForterLogger = require('*/cartridge/scripts/lib/forter/ForterLogger');
    var log = new ForterLogger('ForterValidate.storeResponse.js');
    var pi = args.PaymentInstrument;
    var responseDataContainer = args.ResponseDataContainer;
    var responseType = args.ResponseType;

    try {
        var stringifiedResponse = stringifyResponse(responseDataContainer.data);

        if (responseType === 'paypal_transaction_details_response') {
            Transaction.wrap(function () {
                pi.custom.paypal_transaction_details_response = stringifiedResponse;
            });

            log.debug('Forter Store Response Details ::: \n' + stringifiedResponse);
        } else if (responseType === 'paypal_capture_response') {
            Transaction.wrap(function () {
                pi.custom.paypal_capture_response = stringifiedResponse;
            });

            log.debug('Forter Store Response Capture ::: \n' + stringifiedResponse);
        } else if (responseType === 'paypal_void_response') {
            Transaction.wrap(function () {
                pi.custom.paypal_void_response = stringifiedResponse;
            });

            log.debug('Forter Store Response Void ::: \n' + stringifiedResponse);
        } else if (responseType === 'paypal_authorization_response') {
            Transaction.wrap(function () {
                pi.custom.paypal_authorization_response = stringifiedResponse;
            });

            log.debug('Forter Store Response Authorization ::: \n' + stringifiedResponse);
        } else if (responseType === 'paypal_expresscheckout_response') {
            Transaction.wrap(function () {
                pi.custom.paypal_expresscheckout_response = stringifiedResponse;
            });

            log.debug('Forter Store Response Express Checkout ::: \n' + stringifiedResponse);
        }
    } catch (e) {
        log.error(e);
        return false;
    }

    return true;
}

function postAuthOrderStatusUpdate(argOrderUpdate, updatedStatus) {
    var ForterUpdate = require('*/cartridge/scripts/lib/forter/dto/ForterUpdate');
    var ForterStatusUpdateService = require('*/cartridge/scripts/lib/forter/services/ForterStatusUpdateService');
    var ForterLogger = require('*/cartridge/scripts/lib/forter/ForterLogger');
    var sitePrefs = require('dw/system/Site').getCurrent().getPreferences().getCustom();
    var log = new ForterLogger('ForterValidate.PostAuthOrderStatusUpdate.js');
    var forterStatusUpdateService = new ForterStatusUpdateService();

    var callArgs = {
        siteId: sitePrefs.forterSiteID,
        secretKey: sitePrefs.forterSecretKey,
        orderId: argOrderUpdate.orderNumber
    };

    var resp = {
        result: false,
        updateAttempt: argOrderUpdate.updateAttempt
    };

    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(argOrderUpdate.orderNumber);

    var forterUpdate = new ForterUpdate(order, updatedStatus);
    try {
        log.debug('Forter Order Status Update ::: ' + JSON.stringify(forterUpdate));

        var forterResponse = forterStatusUpdateService.update(callArgs, forterUpdate);
        if (!forterResponse.ok) {
            resp.updateAttempt += 1;
            resp.PlaceOrderError = {
                code: sitePrefs.forterCustomDeclineMessage
            };
        }
        resp.result = forterResponse.ok;

        log.debug('Forter Order Status Update ::: ' + forterResponse.object.text);
    } catch (e) {
        log.error(e);
        resp.updateAttempt += 1;
        resp.PlaceOrderError = {
            code: sitePrefs.forterCustomDeclineMessage
        };
    }

    return resp;
}

function updateForterInfo() {
    if (!empty(request.httpParameterMap.ftrToken) && !empty(request.httpParameterMap.ftrToken.value)) {
        session.privacy.ftrToken = request.httpParameterMap.ftrToken.value;
    }
    let r = require('bm_forter/cartridge/scripts/util/Response.js');
    r.renderJSON({
        success: true
    });
    return;
}

exports.ValidateOrder = guard.ensure(['https'], validateOrder);
exports.StoreResponse = guard.ensure(['https'], storeResponse);
exports.PostAuthOrderStatusUpdate = guard.ensure(['https'], postAuthOrderStatusUpdate);
exports.UpdateForterInfo = guard.ensure(["post", "https"], updateForterInfo);
