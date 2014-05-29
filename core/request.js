var Promise = require("./promise").Promise;

/**
 * Makes an XHR request.
 *
 * @example
 * request("http://example.com")
 *
 * @param  {string|object} request A url, or request object
 * @param {string} request.url          The URL to request.
 * @param {string} [request.method]     The request method, such as "GET" or "POST"
 * @param {object} [request.headers]    An object mapping from header name to value.
 * The value can be an array to set the same header multiple times.
 * @param {any} [request.body]          The body of the request to send.
 * @param {string} [request.overrideMimeType] Override the return MIME-type of the request
 * @param {object} [request.options]    An object of properties to set on the XHR object, such as `responseType` or `withCredentials`
 * @param {object} [request.xhr]        An existing XMLHttpRequest object to use.
 * @return {Promise.<object>}           A promise for a response object
 * containing `status`, `headers`, `body` and `xhr` properties.
 */
exports = module.exports = function doRequest(request) {
    request = exports.normalizeRequest(request);
    var done = Promise.defer();

    var xhr = request.xhr || new XMLHttpRequest();
    xhr.open(request.method, request.url, true);

    xhr.onload = function() {
        var response = {
            status: xhr.status,
            headers: exports.parseResponseHeaders(xhr.getAllResponseHeaders()),
            body: xhr.response,

            xhr: xhr
        };

        done.resolve(response);
    };
    xhr.onerror = function() {
        done.reject(new Error("Could not load"));
    };

    var headers = request.headers;
    //jshint -W089
    for (var name in headers) {
        var value = headers[name];
        // The header value can be an array, in which case set all of them
        if (Array.isArray(value)) {
            for (var i = 0; i < value.length; i++) {
                xhr.setRequestHeader(name, value[i]);
            }
        } else {
            xhr.setRequestHeader(name, value);
        }
    }

    // Allow any options to be set on the XHR
    var options = request.options;
    for (var o in options) {
        xhr[o] = options[o];
    }

    // Method can't be passed into options
    if (request.overrideMimeType) {
        xhr.overrideMimeType(request.overrideMimeType);
    }
    //jshint +W089

    xhr.send(request.body);

    return done.promise;
};
exports.request = exports;

exports.makeOk = function (next) {
    return function ok(request) {
        request = exports.normalizeRequest(request);
        var url = request.url;

        return Promise.when(next(request), function (response) {
            if (response.status >= 200 && response.status < 300) {
                return response;
            } else {
                var error = new Error("Could not load " + JSON.stringify(url) + ": " + response.status + " " + response.xhr.statusText);
                error.response = response;
                throw error;
            }
        });
    };
};
/**
 * Makes an XHR request and only resolves the promise if the response status
 * is 2xx, otherwise it is rejected. The rejected Error object has a `response`
 * property containing the response.
 * @param  {string|object} request See documentation for `request`
 * @return {Promise.<object>}      See documentation for `request`
 */
exports.ok = exports.makeOk(exports.request);

exports.makeJson = function (next) {
    return function json(request) {
        request = exports.normalizeRequest(request);
        var url = request.url;

        request.headers.accept = request.headers.accept || "application/json";
        request.headers["content-type"] = request.headers["content-type"] || "application/json";

        if (typeof request.body === "object") {
            request.body = JSON.stringify(request.body);
        }

        request.overrideMimeType = request.overrideMimeType || "application/json";
        request.options.responseType = request.options.responseType || "json";

        return Promise.when(next(request), function (response) {
            // If response.body is null then the JSON.parse failed, so do it
            // ourselves to get a informative error
            if (response.body === null || typeof response.body === "string") {
                try {
                    response.body = JSON.parse(response.body);
                } catch (error) {
                    throw new Error("Could not parse JSON from " + JSON.stringify(url) + ": " + error.message);
                }
            }

            return response;
        });
    };
};
exports.json = exports.makeJson(exports.request);

exports.normalizeRequest = function (request) {
    if (typeof request === "string") {
        request = {
            url: request
        };
    }
    request.method = request.method || "GET";
    request.headers = request.headers || {};
    request.options = request.options || {};

    return request;
};

exports.parseResponseHeaders = function (headerString) {
    var headers = {};
    if (!headerString) {
        return headers;
    }

    headerString.replace(/^([^:]+):(.*)$/gm, function (_, name, value) {
        name = name.trim().toLowerCase();
        value = value.trim();

        if (name in headers) {
            // Put multiple headers of the same name into an array
            if (typeof headers[name] === "string") {
                headers[name] = [headers[name]];
            }
            headers[name].push(value);
        } else {
            headers[name] = value;
        }
    });

    return headers;
};
