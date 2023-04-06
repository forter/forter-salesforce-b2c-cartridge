'use strict';

function validateOrder(args) {
    var Transaction = require('dw/system/Transaction');
    var OrderMgr = require('dw/order/OrderMgr');
    var ForterOrder = require('*/cartridge/scripts/lib/forter/dto/forterOrder');
    var ForterValidateService = require('*/cartridge/scripts/lib/forter/services/forterValidateService');
    var ForterErrorsService = require('*/cartridge/scripts/lib/forter/services/forterErrorsService');
    var ForterLogger = require('*/cartridge/scripts/lib/forter/forterLogger');
    var ForterResponse = require('*/cartridge/scripts/lib/forter/forterResponse');
    var ForterError = require('*/cartridge/scripts/lib/forter/dto/forterError');
    var sitePrefs = require('dw/system/Site').getCurrent().getPreferences().getCustom();
    var log = new ForterLogger('ForterValidate.validateOrder.js');
    var fResponse = new ForterResponse();
    var forterValidateService = new ForterValidateService();
    var forterErrorsService = new ForterErrorsService();
    var orderNumber = args.orderNumber;
    var orderRequest = null;
    var result = true;
    var orderValidateAttempt = args.orderValidateAttemptInput ? args.orderValidateAttemptInput : 1;
    var callArgs = {
        siteId: sitePrefs.forterSiteID,
        secretKey: sitePrefs.forterSecretKey,
        orderId: orderNumber
    };
    var order;
    var forterError;
    var resp = {};
    var forterErrorResponse; // eslint-disable-line

    if (sitePrefs.forterEnabled === false) {
        fResponse.processorAction = 'disabled';
        resp.JsonResponseOutput = fResponse;
        resp.result = true;
        return resp;
    }

    try {
        order = OrderMgr.getOrder(orderNumber);
        orderRequest = new ForterOrder(order, request, args.authorizationStep);

        log.debug('Forter Order Validate Attempt ::: ' + orderValidateAttempt);

        var forterResponse = forterValidateService.validate(callArgs, orderRequest);

        if (forterResponse.ok === true) {
            log.debug('Forter Order Validate Response ::: ' + forterResponse.object.text);

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

            forterError = new ForterError(orderNumber, forterResponse.msg, forterResponse.errorMessage);
            forterErrorResponse = forterErrorsService.call(callArgs, forterError);

            // if 1st retry : have an order with the Retry number: field set as 1 (Order -> Attributes tab)
            // if 1st retry failed : have an order with the Retry number: field set as 2 (Order -> Attributes tab)
            Transaction.wrap(function () {
                order.custom.forterRetryNumber = orderValidateAttempt.toString();
            });

            if (orderValidateAttempt === 1) {
                log.error('Forter Order ' + orderNumber + '. Validate Retry: ' + orderValidateAttempt + '. Response status: ' + forterResponse.status + '. Forter response error message: ' + forterResponse.errorMessage);

                resp.orderValidateAttemptInput = 2;
                resp.result = false;

                return resp;
            }

            if (orderValidateAttempt > 1) {
                log.error('Forter Order ' + orderNumber + '. Validate Retry: ' + orderValidateAttempt + '. Response status: ' + forterResponse.status + '. Forter response error message: ' + forterResponse.errorMessage);
            }
        }
    } catch (e) {
        log.error(e);

        fResponse.actionEnum = 'ERROR';
        fResponse.orderLink = '';
        fResponse.processorAction = 'internalError';

        forterError = new ForterError(orderNumber, e);
        forterErrorResponse = forterErrorsService.call(callArgs, forterError);

        // if 1st retry : have an order with the Retry number: field set as 1 (Order -> Attributes tab)
        // if 1st retry failed : have an order with the Retry number: field set as 2 (Order -> Attributes tab)
        Transaction.wrap(function () {
            order.custom.forterRetryNumber = orderValidateAttempt.toString();
        });

        if (orderValidateAttempt === 1) {
            log.error('Forter Order ' + orderNumber + '. Validate Retry: ' + orderValidateAttempt + '. Catched error: ' + e);

            resp.orderValidateAttemptInput = 2;
            resp.result = false;

            return resp;
        }

        if (orderValidateAttempt > 1) {
            log.error('Forter Order ' + orderNumber + '. Validate Retry: ' + orderValidateAttempt + '. Catched error: ' + e);
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
        order.custom.forterUserAgent = orderRequest ? orderRequest.connectionInformation.userAgent : null;
        order.custom.forterTokenCookie = orderRequest ? orderRequest.connectionInformation.forterTokenCookie : null;
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

function postAuthOrderStatusUpdate(argOrderUpdate, updatedStatus) {
    var ForterUpdate = require('*/cartridge/scripts/lib/forter/dto/forterUpdate');
    var ForterStatusUpdateService = require('*/cartridge/scripts/lib/forter/services/forterStatusUpdateService');
    var ForterLogger = require('*/cartridge/scripts/lib/forter/forterLogger');
    var sitePrefs = require('dw/system/Site').getCurrent().getPreferences().getCustom();
    var log = new ForterLogger('ForterValidate.postAuthOrderStatusUpdate.js');
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

module.exports = {
    validateOrder: validateOrder,
    postAuthOrderStatusUpdate: postAuthOrderStatusUpdate
};
