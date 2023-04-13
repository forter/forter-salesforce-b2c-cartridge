var ForterLogger = require('*/cartridge/scripts/lib/forter/ForterLogger');
var log = new ForterLogger('ForterOrderUpdate.js');
var jsonResponse = {
    updated: [],
    failed: []
};

/**
* Call forter order status update functionality.
*/
function processOrders() {
    var sitePrefs = require('dw/system/Site').getCurrent().getPreferences().getCustom();
    var Calendar = require('dw/util/Calendar');
    var OrderMgr = require('dw/order/OrderMgr');

    if (sitePrefs.forterEnabled) {
        var hoursago = -168 * sitePrefs.forterWeeksAmount; // 168 hours per week
        var past = new Calendar();

        past.add(Calendar.HOUR, hoursago);
        var pastDate = past.getTime();

        OrderMgr.processOrders(callback, "(custom.forterDecision = {0} OR custom.forterDecision = {1} OR custom.forterDecision = {2}) AND creationDate >= {3}", 'APPROVED', 'DECLINED', 'NOT_REVIEWED', pastDate); // eslint-disable-line

        var stringResponse = JSON.stringify(jsonResponse, undefined, 2);

        log.info('Forter update order status result :::\n' + stringResponse);
    }
}

function callback(order) {
    if (order.status.value !== order.custom.forterOrderStatus) {
        var sitePrefs = require('dw/system/Site').getCurrent().getPreferences().getCustom();
        var Transaction = require('dw/system/Transaction');
        var ForterUpdate = require('*/cartridge/scripts/lib/forter/dto/ForterUpdate');
        var ForterStatusUpdateService = require('*/cartridge/scripts/lib/forter/services/ForterStatusUpdateService');
        var success = false;
        var forterStatusUpdateService = new ForterStatusUpdateService();
        var callArgs = {
            siteId: sitePrefs.forterSiteID,
            secretKey: sitePrefs.forterSecretKey
        };

        try {
            var request = new ForterUpdate(order);
            var requestString = JSON.stringify(request, undefined, 2);
            callArgs.orderId = order.orderNo;

            log.debug('Forter Order Update Request for Order ' + callArgs.orderId + ' ::: \n' + requestString);

            var forterResponse = forterStatusUpdateService.update(callArgs, request);

            if (!empty(forterResponse) && forterResponse.ok === true) {
                log.debug('Forter Order Update Response for Order ' + callArgs.orderId + ' ::: \n' + forterResponse.object.text);

                var fResponse = JSON.parse(forterResponse.object.text);

                if (fResponse.status === 'success') {
                    Transaction.wrap(function () {
                        order.custom.forterOrderStatus = order.status.value; // eslint-disable-line
                    });
                    success = true;
                }
            } else {
                log.error(forterResponse.msg);
            }
        } catch (e) {
            log.error(e);
        }

        if (success === true) {
            jsonResponse.updated.push(order.orderNo);
        } else {
            jsonResponse.failed.push(order.orderNo);
        }
    }
}

exports.ProcessOrders = processOrders;
