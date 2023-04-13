'use strict';

var guard = require('int_forter/cartridge/scripts/guard.js');

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

exports.UpdateForterInfo = guard.ensure(["post", "https"], updateForterInfo);
