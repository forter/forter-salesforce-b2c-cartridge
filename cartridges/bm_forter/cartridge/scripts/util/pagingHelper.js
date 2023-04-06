'use strict';

/**
 * getPagingElements returns paging elements
 *
 * @param pagingmodel Object
 * @param pageurl String
 * @param params Object
 *
 **/

function getPagingElements(pagingmodel, pageurl, params) {
    var pagingElements = {};

    var current = pagingmodel.start;
    var totalCount = pagingmodel.count;
    var pageSize = pagingmodel.pageSize;
    var pageURL = pageurl;
    var currentPage = pagingmodel.currentPage;
    var maxPage = pagingmodel.maxPage;
    var showingStart = current + 1;
    var showingEnd = current + pageSize;
    var rangeBegin;
    var rangeEnd;

    if (showingEnd > totalCount) {
        showingEnd = totalCount;
    }

    var lr = 2; // number of explicit page links to the left and right
    if (maxPage <= 2 * lr) {
        rangeBegin = 0;
        rangeEnd = maxPage;
    } else {
        var mult = 2 * lr;
        rangeBegin = Math.max(Math.min(currentPage - lr, maxPage - mult), 0);
        rangeEnd = Math.min(rangeBegin + mult, maxPage);
    }

    var parameters = [];
    var allKeys = params.parameterNames;
    var iterator = allKeys.iterator();

    while (iterator.hasNext()) {
        var key = iterator.next();

        if (key.indexOf('pageIndex') < 0) {
            var value = params.get(key);
            parameters.push({
                key: key,
                value: value
            });
        }
    }

    pagingElements.current = current;
    pagingElements.totalCount = totalCount;
    pagingElements.pageSize = pageSize;
    pagingElements.pageURL = pageURL;
    pagingElements.currentPage = currentPage;
    pagingElements.maxPage = maxPage;
    pagingElements.showingStart = showingStart;
    pagingElements.showingEnd = showingEnd;
    pagingElements.rangeBegin = rangeBegin;
    pagingElements.rangeEnd = rangeEnd;
    pagingElements.parameters = parameters;

    return pagingElements;
}

module.exports.getPagingElements = getPagingElements;
