'use strict';

var Logger = require('dw/system/Logger');

/**
 * ForterLogger class manages Forter error and debug logging.
 *
 * To include this script use:
 * var ForterLogger = require('~/cartridge/scripts/lib/forter/ForterLogger');
 *
 * @param {string} scriptFileName - name of the log file name
 */
function ForterLogger(scriptFileName) {
    this.scriptFileName = scriptFileName;
    this.log = Logger.getLogger('FORTER');
}

/**
 * Logs error messages for a given script.
 * @param {string} errorMessage - text of error message
 */
ForterLogger.prototype.error = function (errorMessage) {
    if (Logger.isErrorEnabled()) {
        Logger.error(this.scriptFileName + ' ' + errorMessage);
    }
};

/**
 * Logs debug messages for a given script.
 * @param {string} debugMessage - text of debug message
 */
ForterLogger.prototype.debug = function (debugMessage) {
    if (this.log.isDebugEnabled()) {
        this.log.debug(this.scriptFileName + ' ' + debugMessage);
    }
};

/**
 * Logs info messages for a given script.
 * @param {string} infoMessage - text of info message
 */
ForterLogger.prototype.info = function (infoMessage) {
    if (this.log.isInfoEnabled()) {
        this.log.info(this.scriptFileName + ' ' + infoMessage);
    }
};

module.exports = ForterLogger;
