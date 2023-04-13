// Toggle visibility of elements by selector.
// @param selector - selector by which to search for elements
// @param show - if true, show the element with display:block style, otherwise hide the element with display:none.
function toggle(selector, show) {
    var elements = document.querySelectorAll(selector);

    for (var index = 0; index < elements.length; index++) {
        elements[index].style.display = show ? 'block' : 'none';
    }
}

// Toggle ajax progress image.
// @param show - if true show the progress image, otherwise hide it.
function toggleWaiting(show) {
    toggle('.js-waiting', show);
}

// Toggle credentials fields, and the link in the options page.
// @param show - if true show the credentials and hide the link, otherwise hide the credentials and show the link
function toggleChangeCredentials(show) {
    toggle('.js-change-api-credentials', show);
    toggle('.js-change-api-credentials-link', !show);
}

// Toggle decline message text area based on the checked state of the input field.
// @param obj - the input field from which checked state will be taken
function toggleDeclineMessage(obj) {
    var target = document.getElementById('decline-decision');

    // enable/disable logic for the decline decision checkbox; if disabled styling is applied
    if (!document.getElementById('cancelOrder').checked) {
        obj.checked = false; // eslint-disable-line

        if (target.className.indexOf('disabled-checkbox') === -1) {
            target.className += ' disabled-checkbox';
        }
    } else {
        target.className = 'labelForCheckbox';
    }

    toggle('.js-customized-message', obj.checked);
}

// Toggle cancel order checkbox based on the checked state of the input field.
// @param obj - the input field from which checked state will be taken
function toggleCancelOrder(obj, load) {
    // if save was triggered return
    if (load) {
        return;
    }

    var target = document.getElementById('declineDecision');
    var decision = document.getElementById('decline-decision');

    // enable/disable logic for the decline decision checkbox; if disabled styling is applied
    if (!obj.checked && target.checked) {
        target.click();
    } else if (obj.checked && !target.checked) {
        target.click();
    } else {
        if (decision.className.indexOf('disabled-checkbox') === -1) { // eslint-disable-line
            decision.className += ' disabled-checkbox';
        }
    }

    if (obj.checked) {
        decision.className = 'labelForCheckbox';
    }
}

function fadeOut(selector, timeout) {
    var iterations = timeout / 100;

    func = function () { // eslint-disable-line
        var elements = document.querySelectorAll(selector);
        var step = 1 / iterations;

        for (var j = 0; j < elements.length; j++) {
            if (elements[j].style.display === 'none') {
                continue; // eslint-disable-line
            }
            if (elements[j].style.opacity === '') {
                elements[j].style.opacity = 1;
            }
            elements[j].style.opacity = elements[j].style.opacity - step; // eslint-disable-line
            if (elements[j].style.opacity <= 0) {
                elements[j].style.opacity = 1;
                elements[j].style.display = 'none';
            }
        }
    };

    for (var i = 1; i <= iterations + 1; i++) {
        window.setTimeout(func, i * 100); // eslint-disable-line
    }
}

// Show the fields for options screen, and hide these for initial screen.
function showOptionsWindow() {
    toggle('.js-options-screen', true);
    toggle('.js-initial-screen', false);
    toggle('.js-save-errors', false);
    toggleChangeCredentials(false);
    toggleDeclineMessage(document.querySelector('input[name=declineDecision]'));
    toggleCancelOrder(document.querySelector('input[name=cancelOrder]'), true);
    toggle('.js-save-info', true);
    fadeOut('.js-save-info', 2000);
}

// Handler on loaded ajax response for Forter link event.
function linkLoaded() { // eslint-disable-line
    toggleWaiting(false);

    var responseObj = JSON.parse(decodeURI(this.response));

    if (responseObj.status === 'error') {
        var element = document.querySelector('.js-link-errors');
        element.innerHTML = responseObj.errors[0];
    } else {
        showOptionsWindow();
    }
}

// Handler on loaded ajax response for Forter save event.
function saveLoaded() { // eslint-disable-line
    toggleWaiting(false);

    var responseObj = JSON.parse(decodeURI(this.response));

    if (responseObj.status === 'error') {
        var element = document.querySelector('.js-save-errors');
        element.innerHTML = responseObj.errors[0];
        toggle('.js-save-errors', true);
    } else {
        showOptionsWindow();
    }
}

// Toggle cancel order checkbox based on the checked state of the input field
// @param obj - the input field from which checked state will be taken
function toggleDecline(obj) { // eslint-disable-line
    var target = document.getElementById('declineDecision');
    var decision = document.getElementById('decline-decision');

    // enable/disable logic for the decline decision checkbox; if disabled styling is applied
    if (decision.className.indexOf('disabled-checkbox') === -1) {
        decision.className += ' disabled-checkbox';
    }

    if (obj.checked && target.checked) {
        target.click();
    } else if (!obj.checked && !target.checked) {
        target.click();
    }
}

// Create an ajax call according the options specified.
// Options: {
//  formId : form id
//  url : optional, url to call or use form.action
//  method : optional, method to use or use form.method
//  onabort : function
//  onerror : function
//  onload : function
//  onloadend : function
//  onloadstart : function
//  onreadystatechange : function
//  ontimeout : function
// }
function ajax(options) { // eslint-disable-line
    var form = document.getElementById(options.formId);
    var url = options.url || form.action;
    var method = options.method || form.method;
    var xhr = new XMLHttpRequest();
    var paramsArr = [];

    for (var i = 0; i < form.elements.length; i++) {
        var el = form.elements[i];

        if (el.type === 'checkbox' && !el.checked) {
            continue; // eslint-disable-line
        }
        if (el.name === null || el.name === '') {
            continue; // eslint-disable-line
        }
        if (el.disabled) {
            continue; // eslint-disable-line
        }
        paramsArr.push(encodeURIComponent(el.name) + '=' + encodeURIComponent(el.value));
    }

    var params = paramsArr.join('&');

    xhr.open(method, url);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

    // .bind ensures that this inside of the function is the XHR object.
    xhr.onabort = options.onabort ? options.onabort.bind(xhr) : null;
    xhr.onerror = options.onerror ? options.onerror.bind(xhr) : null;
    xhr.onload = options.onload ? options.onload.bind(xhr) : null;
    xhr.onloadend = options.onloadend ? options.onloadend.bind(xhr) : null;
    xhr.onloadstar = options.onloadstart ? options.onloadstart.bind(xhr) : null;
    xhr.onreadystatechange = options.onreadystatechange ? options.onreadystatechange.bind(xhr) : null;
    xhr.ontimeout = options.ontimeout ? options.ontimeout.bind(xhr) : null;

    // All preperations are clear, send the request!
    toggleWaiting(true);
    xhr.send(params);
}
