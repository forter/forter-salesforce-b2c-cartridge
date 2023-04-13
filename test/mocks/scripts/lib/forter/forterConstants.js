'use strict';

/**
 * forterConstants contains all static configuration data,
 *
 * To include this script use:
 * require('~/cartridge/scripts/lib/forter/forterConstants').CUSTOMER_CREATE;
 */

module.exports = {
    STATUS_APPROVED: 'APPROVE',
    STATUS_DECLINED: 'DECLINED',
    STATUS_NOT_REVIEWED: 'NOT_REVIEWED',
    STATUS_VERIFICATION_REQ: 'VERIFICATION_REQUIRED',
    STATUS_ORDER_APPROVE: 'APPROVE',
    STATUS_ORDER_DECLINE: 'DECLINE',
    STATUS_FAILED: 'FAILED',
    STATUS_NOT_SENT: 'NOT_SENT',
    CUSTOMER_LOGIN: 'login',
    CUSTOMER_LOGOUT: 'logout',
    CUSTOMER_CREATE: 'signup',
    CUSTOMER_PROFILE_UPDATE: 'update',
    CUSTOMER_PROFILE_ACCESS: 'profile-access',
    CUSTOMER_AUTH_RESULT: 'authentication-result',
    CUSTOMER_AUTH_ATTEMPT: 'authentication-attempt',
    PHONE_TYPE_PRIMARY: 'Primary',
    PHONE_TYPE_SECONDARY: 'Secondary',
    PHONE_DESC_HOME: 'Home',
    PHONE_DESC_WORK: 'Work',
    PHONE_DESC_MOBILE: 'Mobile',
    ORDER_VALIDATES: 'validates'
};
