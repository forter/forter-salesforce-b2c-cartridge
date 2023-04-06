'use strict';

/* API Includes */
var Calendar = require('dw/util/Calendar');
var StringUtils = require('dw/util/StringUtils');
var OrderMgr = require('dw/order/OrderMgr');
var PagingModel = require('dw/web/PagingModel');
var URLUtils = require('dw/web/URLUtils');
var PaymentMgr = require('dw/order/PaymentMgr');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var CurrentSite = require('dw/system/Site').getCurrent();

/* Script Modules */
var app = require('~/cartridge/scripts/app');
var guard = require('~/cartridge/scripts/guard');

function order() {
    var params = request.httpParameterMap;
    var searchform = session.forms.fortersearchorder;
    var conditions = [];

    try {
        if (!empty(searchform.orderID.getValue())) {
            conditions.push("orderNo = '" + searchform.orderID.getValue() + "'");
        }

        if (!empty(searchform.customerName.getValue())) {
            conditions.push("customerName ILIKE '*" + searchform.customerName.getValue() + "*'");
        }

        if (!empty(searchform.email.getValue())) {
            conditions.push("customerEmail ILIKE '*" + searchform.email.getValue() + "*'");
        }

        if (!empty(searchform.status.getValue())) {
            conditions.push('status = ' + searchform.status.getValue());
        }

        // If an order id is entered the dates should be disabled/cleared in the UI (date should not be added in the query)
        if (!empty(searchform.orderID.getValue())) {
            searchform.startDate.setValue('');
            searchform.endDate.setValue('');
        } else {
            if (empty(searchform.startDate.getValue()) && empty(searchform.endDate.getValue())) {
                var today = new Calendar();
                var pastWeek = new Calendar();

                searchform.endDate.setValue(StringUtils.formatCalendar(today, 'MM/dd/yyyy'));

                pastWeek.roll(Calendar.DAY_OF_YEAR, -7);
                searchform.startDate.setValue(StringUtils.formatCalendar(pastWeek, 'MM/dd/yyyy'));
            }

            if (!empty(searchform.startDate.getValue())) {
                var start = new Date(searchform.startDate.getValue());

                start = start.toISOString().split('.')[0];
                conditions.push('creationDate >= ' + start);
            }

            if (!empty(searchform.endDate.getValue())) {
                var date = searchform.endDate.getValue();

                date += ' 23:59:59';

                var end = new Date(date);

                end = end.toISOString().split('.')[0];
                conditions.push('creationDate <= ' + end);
            }
        }

        if (!empty(searchform.forterSearchDecision.getValue())) {
            var decision = searchform.forterSearchDecision.getValue();

            if (decision === 'NOT_SENT') {
                conditions.push('custom.forterDecision = NULL');
            } else {
                conditions.push("custom.forterDecision = '" + decision + "'");
            }
        }
    } catch (e) {
        conditions.push("orderNo = '-1'");
    }

    // check if pagination is sent and output it so it can be used in the paging pipelet
    var page = params.getParameterMap('pageIndex').getParameterNames();
    if (!empty(page) && page.size() > 0) {
        page = Number(page[0]);
    } else {
        page = 0;
    }

    var orders = OrderMgr.searchOrders(conditions.join(' AND '), 'creationDate DESC');

    var paging = new PagingModel(orders, orders.count);
    paging.setStart(page * 10);
    paging.setPageSize(10);

    app.getView({
        MAIN_MENU_NAME: 'Forter',
        TOP_URL: URLUtils.url('SiteNavigationBar-ShowMenuitemOverview', 'CurrentMenuItemId', 'forter_id01'),
        OrderPagingModel: paging
    }).render('forter/forterorders');
}

function config() {
    app.getView({
        MAIN_MENU_NAME: 'Forter',
        TOP_URL: URLUtils.url('SiteNavigationBar-ShowMenuitemOverview', 'CurrentMenuItemId', 'forter_id01')
    }).render('forter/forterregister');
}

function callLink(params) {
    var ForterResponse = require('*/cartridge/scripts/lib/forter/forterResponse');
    var ForterVerifyService = require('*/cartridge/scripts/lib/forter/services/forterVerifyService');
    var ForterLogger = require('*/cartridge/scripts/lib/forter/forterLogger');
    var ForterConfig = require('*/cartridge/scripts/lib/forter/forterConfig.ds').ForterConfig;
    var log = new ForterLogger('ForterExtension-CallLink');
    var result = true;
    var fResponse = new ForterResponse();
    var forterVerifyService = new ForterVerifyService();

    var callParams = {
        siteId: params.get('siteID').value,
        secretKey: params.get('secretKey').value
    };
    var forterResponse = forterVerifyService.verifyConfig(callParams);

    log.debug(forterResponse);
    result = (forterResponse.ok === true);

    if (result === true) {
        log.debug('Forter Config Verify Response ::: \n' + forterResponse.object.text);

        ForterConfig.forterSiteID = params.get('siteID').value;
        ForterConfig.forterSecretKey = params.get('secretKey').value;

        Transaction.wrap(function () {
            ForterConfig.saveSiteCredentials();
        });

        fResponse.status = 'ok';
    } else {
        log.error(forterResponse.msg);

        fResponse.status = 'error';

        if (forterResponse.msg === 'Unauthorized') {
            fResponse.errors.push(Resource.msg('forter_bm.configuration.errors.credentials', 'forter_bm', null));
        } else {
            fResponse.errors.push(Resource.msg('forter_bm.configuration.errors.timeout', 'forter_bm', null));
        }
    }

    return fResponse;
}

function link() {
    var params = request.httpParameterMap;
    var fResponse = callLink(params);

    app.getView({
        JsonResponse: fResponse
    }).render('forter/json');
}

function callSave(params, fLinkResponse) {
    var ForterLogger = require('*/cartridge/scripts/lib/forter/forterLogger');
    var ForterResponse = require('*/cartridge/scripts/lib/forter/forterResponse');
    var ForterSettingsService = require('*/cartridge/scripts/lib/forter/services/forterSettingsService');
    var ForterConfig = require('*/cartridge/scripts/lib/forter/forterConfig.ds').ForterConfig;
    var log = new ForterLogger('ForterExtension-CallSave');
    var result = true;
    var fResponse = fLinkResponse;
    var forterSettingsService = new ForterSettingsService();
    var paymentMethods = PaymentMgr.getActivePaymentMethods();

    if (fResponse === null) {
        fResponse = new ForterResponse();
    }

    var callArgs = {
        siteId: ForterConfig.forterSiteID,
        secretKey: ForterConfig.forterSecretKey
    };
    var callParams = {
        action: 'settings_update',
        enabled: params.get('configureFooter').value === 'on',
        merchantName: CurrentSite.name,
        merchantID: CurrentSite.ID,
        created: new Date().getTime(),
        merchantAdminEmail: CurrentSite.getCustomPreferenceValue('customerServiceEmail'),
        declineMessage: params.get('declineDecision').value === 'on' ? params.get('declineMessage').value : '',
        autoInvoiceOrder: params.get('autoInvoice').value === 'on',
        autoCancelOrder: params.get('cancelOrder').value === 'on',
        forterWeeksAmount: params.get('forterWeeksAmount').value,
        paymentMethods: []
    };

    for (var i = 0; i < paymentMethods.length; i++) {
        callParams.paymentMethods.push({
            active: paymentMethods[i].active,
            id: paymentMethods[i].ID,
            title: paymentMethods[i].name,
            paymentAction: 'authorize'
        });
    }

    log.debug('Forter Save Parameters Request ::: \n' + JSON.stringify(callParams, undefined, 2));

    var callResponse = forterSettingsService.settings(callArgs, callParams);
    result = (callResponse.ok === true);

    // Save only if the response is OK
    if (result === true) {
        log.debug('Forter Save Parameters Response ::: \n' + callResponse.object.text);

        ForterConfig.forterEnabled = params.get('configureFooter').value === 'on';
        ForterConfig.forterShowDeclinedPage = params.get('declineDecision').value === 'on';
        ForterConfig.forterCustomDeclineMessage = params.get('declineMessage').value;
        ForterConfig.forterAutoInvoiceOnApprove = params.get('autoInvoice').value === 'on';
        ForterConfig.forterCancelOrderOnDecline = params.get('cancelOrder').value === 'on';
        ForterConfig.forterWeeksAmount = params.get('forterWeeksAmount').intValue;

        Transaction.wrap(function () {
            ForterConfig.saveSitePreferences();
        });
    } else {
        fResponse.status = 'error';

        log.error(callResponse.msg);
        if (callResponse.msg === 'Unauthorized') {
            fResponse.errors.push(Resource.msg('forter_bm.configuration.errors.credentials', 'forter_bm', null));
        } else {
            fResponse.errors.push(Resource.msg('forter_bm.configuration.errors.timeout', 'forter_bm', null));
        }
    }

    return fResponse;
}

function save() {
    var ForterConfig = require('*/cartridge/scripts/lib/forter/forterConfig.ds').ForterConfig;
    var fLinkResponse = null;
    var params = request.httpParameterMap;

    if (params.get('siteID').value !== ForterConfig.forterSiteID || params.get('secretKey').value !== ForterConfig.forterSecretKey) {
        fLinkResponse = callLink(params);
    }

    var fResponse = callSave(params, fLinkResponse);

    app.getView({
        JsonResponse: fResponse
    }).render('forter/json');
}

exports.Config = guard.all(config);
exports.Order = guard.all(order);
exports.Save = guard.all(save);
exports.Link = guard.all(link);
