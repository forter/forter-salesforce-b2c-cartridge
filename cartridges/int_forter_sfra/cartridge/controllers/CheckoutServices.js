'use strict';

var server = require('server');
server.extend(module.superModule);

server.prepend('PlaceOrder', server.middleware.https, function (req, res, next) { // eslint-disable-line
    var sitePrefs = require('dw/system/Site').getCurrent().getPreferences().getCustom();
    var BasketMgr = require('dw/order/BasketMgr');
    var OrderMgr = require('dw/order/OrderMgr');
    var Resource = require('dw/web/Resource');
    var Transaction = require('dw/system/Transaction');
    var URLUtils = require('dw/web/URLUtils');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');

    var currentBasket = BasketMgr.getCurrentBasket();
    var validatedProducts = validationHelpers.validateProducts(currentBasket);

    if (!currentBasket || validatedProducts.error) {
        res.json({
            error: true,
            cartError: true,
            fieldErrors: [],
            serverErrors: [],
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        this.emit('route:Complete', req, res);
        return;
    }

    if (req.session.privacyCache.get('fraudDetectionStatus')) {
        res.json({
            error: true,
            cartError: true,
            redirectUrl: URLUtils.url('Error-ErrorCode', 'err', '01').toString(),
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });

        this.emit('route:Complete', req, res);
        return;
    }

    var validationOrderStatus = hooksHelper('app.validate.order', 'validateOrder', currentBasket, require('*/cartridge/scripts/hooks/validateOrder').validateOrder);
    if (validationOrderStatus.error) {
        res.json({
            error: true,
            errorMessage: validationOrderStatus.message
        });

        this.emit('route:Complete', req, res);
        return;
    }

    // Check to make sure there is a shipping address
    if (currentBasket.defaultShipment.shippingAddress === null) {
        res.json({
            error: true,
            errorStage: {
                stage: 'shipping',
                step: 'address'
            },
            errorMessage: Resource.msg('error.no.shipping.address', 'checkout', null)
        });

        this.emit('route:Complete', req, res);
        return;
    }

    // Check to make sure billing address exists
    if (!currentBasket.billingAddress) {
        res.json({
            error: true,
            errorStage: {
                stage: 'payment',
                step: 'billingAddress'
            },
            errorMessage: Resource.msg('error.no.billing.address', 'checkout', null)
        });

        this.emit('route:Complete', req, res);
        return;
    }

    // Calculate the basket
    Transaction.wrap(function () {
        basketCalculationHelpers.calculateTotals(currentBasket);
    });

    // Re-validates existing payment instruments
    var validPayment = COHelpers.validatePayment(req, currentBasket);
    if (validPayment.error) {
        res.json({
            error: true,
            errorStage: {
                stage: 'payment',
                step: 'paymentInstrument'
            },
            errorMessage: Resource.msg('error.payment.not.valid', 'checkout', null)
        });

        this.emit('route:Complete', req, res);
        return;
    }

    // Re-calculate the payments.
    var calculatedPaymentTransactionTotal = COHelpers.calculatePaymentTransaction(currentBasket);
    if (calculatedPaymentTransactionTotal.error) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });

        this.emit('route:Complete', req, res);
        return;
    }

    // Creates a new order.
    var order = COHelpers.createOrder(currentBasket);
    if (!order) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });

        this.emit('route:Complete', req, res);
        return;
    }

    // these lines must be uncommented in case if you want to activate the pre-authorization flow or being included in a top-level cartridge
    // var orderNumber = order.getCurrentOrderNo();
    // var argOrderValidate = {
    //     orderNumber               : orderNumber,
    //     orderValidateAttemptInput : 1,
    //     authorizationStep         : "PRE_AUTHORIZATION"
    // };
    // var forterCall       = require('*/cartridge/scripts/pipelets/forter/forterValidate');
    // var forterDecision   = forterCall.validateOrder(argOrderValidate);

    // in case if no response from Forter, try to call one more time
    // if (forterDecision.result === false && forterDecision.orderValidateAttemptInput == 2) {
    //     argOrderValidate = {
    //         orderNumber               : orderNumber,
    //         orderValidateAttemptInput : 2,
    //         authorizationStep         : "PRE_AUTHORIZATION"
    //     };
    //     forterCall       = require('*/cartridge/scripts/pipelets/forter/forterValidate');
    //     forterDecision   = forterCall.validateOrder(argOrderValidate);
    // }

    // IMPORTANT: The forterDecision variable holds the reasonCode from the authorization call,
    //      which can be used to customize any type of response or flow.

    // if (forterDecision.JsonResponseOutput.processorAction == 'void') {
    //    Transaction.wrap(function () { OrderMgr.failOrder(order, true); });

    //     if (!empty(forterDecision.PlaceOrderError)) {
    //         res.json({
    //             error 		: true,
    //             errorMessage: forterDecision.PlaceOrderError.code
    //         });
    //     } else {
    //         res.json({
    //             error       : true,
    //             errorMessage: Resource.msg('error.technical', 'checkout', null)
    //         });
    //     }

    //    this.emit('route:Complete', req, res);
    //    return;
    // }

    // Handles payment authorization
    var handlePaymentResult = COHelpers.handlePayments(order, order.orderNo);

    // Handle custom processing post authorization
    var options = {
        req: req,
        res: res
    };
    var postAuthCustomizations = hooksHelper('app.post.auth', 'postAuthorization', handlePaymentResult, order, options, require('*/cartridge/scripts/hooks/postAuthorizationHandling').postAuthorization);
    if (postAuthCustomizations && Object.prototype.hasOwnProperty.call(postAuthCustomizations, 'error')) {
        res.json(postAuthCustomizations);
        next();
    }

    if (handlePaymentResult.error) {
        if (sitePrefs.forterShowDeclinedPage === true && sitePrefs.forterCustomDeclineMessage) {
            res.json({
                error: true,
                errorMessage: sitePrefs.forterCustomDeclineMessage
            });
        } else {
            res.json({
                error: true,
                errorMessage: Resource.msg('error.technical', 'checkout', null)
            });
        }

        this.emit('route:Complete', req, res);
        return;
    }

    var fraudDetectionStatus = hooksHelper('app.fraud.detection', 'fraudDetection', currentBasket, require('*/cartridge/scripts/hooks/fraudDetection').fraudDetection);
    if (fraudDetectionStatus.status === 'fail') {
        Transaction.wrap(function () { OrderMgr.failOrder(order, true); });

        // fraud detection failed
        req.session.privacyCache.set('fraudDetectionStatus', true);

        res.json({
            error: true,
            cartError: true,
            redirectUrl: URLUtils.url('Error-ErrorCode', 'err', fraudDetectionStatus.errorCode).toString(),
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });

        this.emit('route:Complete', req, res);
        return;
    }

    // Places the order
    var placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus);
    if (placeOrderResult.error) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });

        this.emit('route:Complete', req, res);
        return;
    }

    COHelpers.sendConfirmationEmail(order, req.locale.id);

    // Reset usingMultiShip after successful Order placement
    req.session.privacyCache.set('usingMultiShipping', false);

    res.json({
        error: false,
        orderID: order.orderNo,
        orderToken: order.orderToken,
        continueUrl: URLUtils.url('Order-Confirm').toString()
    });

    this.emit('route:Complete', req, res);
    return;
});


module.exports = server.exports();
