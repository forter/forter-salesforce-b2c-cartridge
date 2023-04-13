'use strict'

var fs = require('fs-extra');

// destination will be created or overwritten by default

// jquery
fs.copyFile('./node_modules/jquery/dist/jquery.min.js', './doc/js/server/template/static/scripts/jquery.min.js', function copy(err) {
    if (err) {
        throw err;
    } else {
        console.log('jquery - COPIED'); // eslint-disable-line no-console
    }
});
