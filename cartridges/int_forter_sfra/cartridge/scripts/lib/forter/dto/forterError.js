'use strict';
/**
 * ForterError class is the DTO object of the parameters for Forter error call.
 *
 * To include this script use:
 * var ForterError = require('~/cartridge/scripts/lib/forter/dto/forterError');
 */

/**
 * ForterException object contains parameters for Forter error call.
 * @param {string} msg - error message
 * @param {string} debugInfo - details
 */
function ForterException(msg, debugInfo) {
    this.message = !empty(msg) ? msg : '';
    this.debugInfo = !empty(debugInfo) ? debugInfo : '';
}

/**
 * ForterError class is the DTO object of the parameters for Forter error call.
 * @param {string} orderID - order id
 * @param {string} msg - error message
 * @param {string} debugInfo - details
 */
function ForterError(orderID, msg, debugInfo) {
    this.orderID = !empty(orderID) ? orderID : '';
    this.exception = new ForterException(msg, debugInfo);
}

module.exports = ForterError;
