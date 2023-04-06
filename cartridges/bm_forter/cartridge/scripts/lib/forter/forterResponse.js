'use strict';
/**
 * ForterResponse class is the response object of the calls.
 *
 * To include this script use:
 * var ForterResponse = require('~/cartridge/scripts/lib/forter/forterResponse');
 */
function ForterResponse() {
    this.status = 'ok';
    this.errors = [];
    this.request = null;
}

module.exports = ForterResponse;
