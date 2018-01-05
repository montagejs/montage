var RawDataService = require("data/service/raw-data-service").RawDataService,
    DataQuery = require("data/model/data-query").DataQuery,
    Enumeration = require("data/model/enumeration").Enumeration,
    Map = require("collections/map"),
    Montage = require("montage").Montage,
    parse = require("frb/parse"),
    compile = require("frb/compile-evaluator"),
    evaluate = require("frb/evaluate"),
    Scope = require("frb/scope"),
    Promise = require("core/promise").Promise;


var HttpError = exports.HttpError = Montage.specialize({

    constructor: {
        value: function HttpError() {
            this.stack = (new Error()).stack;
        }
    },

    isAuthorizationError: {
        get: function () {
            return this._isAuthorizationError || (this.statusCode === 401 || this.statusCode === 403);
        },
        set: function (value) {
            this._isAuthorizationError = value;
        }
    },

    message: {
        get: function () {
            if (!this._message) {
                this._message = "Status " + this.statusCode + " received for url: " + this.url;
            }
            return this._message;
        }
    },

    name: {
        value: "HttpError"
    },

    url: {
        value: undefined
    },

    statusCode: {
        value: undefined
    }

}, {

    withMessage: {
        value: function (message) {
            var error = new this();
            error._message = message;
            return error;
        }
    },


    withRequestAndURL: {
        value: function (request, url) {
            var error = new this();
            error.statusCode = request.status;
            error.url = url;
            return error;
        }
    }

});

/**
 * Superclass for services communicating using HTTP, usually REST services.
 *
 * @class
 */
/*
 * TODO: Restore @extends when parent class has been cleaned up to not provide
 * so many unnecessary properties and methods.
 *
 * @extends RawDataService
 */
var HttpService = exports.HttpService = RawDataService.specialize(/** @lends HttpService.prototype */ {

    /***************************************************************************
     * Constants
     */

    /**
     * The Content-Type header corresponding to
     * [application/x-www-form-urlencoded]{@link https://www.w3.org/TR/html401/interact/forms.html#h-17.13.4.1},
     * the default format of form data.
     *
     * @type {Object<string, string>}
     */
    FORM_URL_ENCODED: {
        value: {"Content-Type": "application/x-www-form-urlencoded"}
    },

    /**
     * @type {Object<string, string>}
     * @deprecated in favor of
     *             [FORM_URL_ENCODED]{@link HttpService#FORM_URL_ENCODED}.
     */
    FORM_URL_ENCODED_CONTENT_TYPE_HEADER: {
        get: function () {
            console.warn("HttpService.FORM_URL_ENCODED_CONTENT_TYPE_HEADER is deprecated - use HttpService.FORM_URL_ENCODED instead");
            return this.FORM_URL_ENCODED;
        }
    },


    /***************************************************************************
     * Authorization
     */

    setHeadersForQuery: {
        value: function (headers, query) {
            var authorization = query && query.authorization && query.authorization[0],
                evaluate, scope;

            if (authorization && authorization.headerValueExpression && this.authorizationHeaderName) {
                scope = new Scope(authorization);
                evaluate = compile(parse(authorization.headerValueExpression));
                headers[this.authorizationHeaderName] = evaluate(scope);
            } else if (query && this.authorizationHeaderName && this.authorizationHeaderValueExpression) {
                scope = new Scope(query);
                evaluate = compile(parse(this.authorizationHeaderValueExpression));
                headers[this.authorizationHeaderName] = evaluate(scope);
            } else if (this.authorizationHeaderName && this.authorizationHeaderValue) {
                headers[this.authorizationHeaderName] = this.authorizationHeaderValue;
            }
        }
    },

    /**
     * @type {string}
     * @description Name of header to be passed to all requests along with authorizationHeaderValue
     *
     */
    authorizationHeaderName: {
        value: "Authorization"
    },

    /**
     * @type {string}
     * @description Value of header with name authorizationHeaderName to include with all requests from this service
     *
     */
    authorizationHeaderValue: {
        value: undefined
    },

    /**
     * @type {string}
     * @description FRB Expression defining the authorizationHeaderValue when evaluated against a DataQuery
     *              passed to this service.
     *
     */
    authorizationHeaderValueExpression: {
        value: undefined
    },

    /***************************************************************************
     * Getting property data
     */

    fetchHttpObjectProperty: {
        value: function (type, object, propertyName, prerequisitePropertyNames, criteria) {
            var self, selector, prerequisites, stream;
            // Create and cache a new fetch promise if necessary.
            if (!this._getCachedFetchPromise(object, propertyName)) {
                // Parse arguments.
                if (arguments.length >= 4) {
                    selector = DataQuery.withTypeAndCriteria(type, arguments[arguments.length - 1]);//RDW unclear if there's any special change required here for formal Criteria

                } else {
                    selector = DataQuery.withTypeAndCriteria(type);
                }
                if (arguments.length < 5 || !prerequisitePropertyNames) {
                    prerequisites = [];
                } else if (!Array.isArray(prerequisitePropertyNames)) {
                    prerequisites = Array.prototype.slice.call(arguments, 3, -1);
                } else {
                    prerequisites = prerequisitePropertyNames;
                }
                // Create and cache a new fetch promise
                self = this;
                this._setCachedFetchPromise(object, propertyName, this.nullPromise.then(function () {
                    // First get prerequisite data if necessary...
                    return self.rootService.getObjectProperties(object, prerequisites);
                }).then(function () {
                    // Then fetch the requested data...
                    stream = self.rootService.fetchData(selector);
                    return stream;
                }).then(function () {
                    // Then wait until the next event loop to ensure only one
                    // fetch is dispatched per event loop (caching ensures all
                    // subsequent requests for the same fetch promise within the
                    // same event loop will return the same promise)...
                    return self.eventLoopPromise;
                }).then(function () {
                    // Then removes the promise from the cache so subsequent
                    // requests for this fetch promise generate new fetches.
                    self._setCachedFetchPromise(object, propertyName, null);
                    return stream.data;
                }));
            }
            // Return the created or cached fetch promise.
            return this._getCachedFetchPromise(object, propertyName);
        }
    },

    /**
     * @private
     * @method
     */
    _getCachedFetchPromise: {
        value: function (object, propertyName) {
            this._cachedFetchPromises = this._cachedFetchPromises || {};
            this._cachedFetchPromises[propertyName] = this._cachedFetchPromises[propertyName] || new Map();
            return this._cachedFetchPromises[propertyName].get(object);
        }
    },

    /**
     * @private
     * @method
     */
    _setCachedFetchPromise: {
        value: function (object, propertyName, promise) {
            this._cachedFetchPromises = this._cachedFetchPromises || {};
            this._cachedFetchPromises[propertyName] = this._cachedFetchPromises[propertyName] || new Map();
            this._cachedFetchPromises[propertyName].set(object, promise);
        }
    },

    /***************************************************************************
     * Getting raw data
     */

    /**
     * Fetches raw data from an HTTP REST endpoint.
     *
     * @method
     * @argument {String} url                        - The URL of the endpoint.
     * @argument {Object<string, string>}
     *           [headers={}]                        - HTTP header names and
     *                                                 values. Optional except
     *                                                 if a body or types are to
     *                                                 be specified. Pass in an
     *                                                 empty, null, or undefined
     *                                                 header to specify a body
     *                                                 or types but no header.
     * @argument [body]                              - The body to send with the
     *                                                 XMLHttpRequest. Optional
     *                                                 except if types are to be
     *                                                 specified. Pass in a null
     *                                                 or undefined body to
     *                                                 specify types but no
     *                                                 body.
     * @argument {Array<HttpService.DataType>}
     *           [types=[HttpService.DataType.JSON]] - The possible types of
     *                                                 the data expected in
     *                                                 responses. These will
     *                                                 be used to parse the
     *                                                 response data. Currently
     *                                                 only the first type is
     *                                                 taken into account. The
     *                                                 types can be specified as
     *                                                 an array or as a sequence
     *                                                 of
     *                                                 [DataType]{@link HttpService.DataType}
     *                                                 arguments.
     * @argument {boolean} [sendCredentials=true]    - Determines whether
     *                                                 credentials are sent with
     *                                                 the request.
     * @returns {external:Promise} - A promise settled when the fetch is
     * complete. On success the promise will be fulfilled with the data returned
     * from the fetch, parsed according to the specified or detaul types. On
     * error the promise will be rejected with the error.
     */

    _fetchHttpRawDataWithParsedArguments: {
        value: function (parsed) {
            var self = this,
                error, request;

            if (!parsed) {
                error = new Error("Invalid arguments to fetchHttpRawData()");
            } else if (!parsed.url) {
                error = new Error("No URL provided to fetchHttpRawData()");
            }

            return new Promise(function (resolve, reject) {
                var i, keys, key,
                    startTime = new Date().getTime();

                // Report errors or fetch the requested raw data.
                if (error) {
                    console.warn(error);
                    reject(error);
                } else {
                    request = new XMLHttpRequest();
                    request.onreadystatechange = function () {
                        if (request.readyState === 4) {
                            resolve(request);
                            // console.log("Completed request for (", parsed.url, ") in (", ((new Date().getTime() - startTime)), ") ms");
                        }
                    };
                    request.onerror = function () {
                        error = HttpError.withRequestAndURL(request, parsed.url);
                        reject(error);
                    };
                    request.open(parsed.body ? "POST" : "GET", parsed.url, true);

                    self.setHeadersForQuery(parsed.headers, parsed.query, parsed.url);

                    keys = Object.keys(parsed.headers);
                    for (i = 0; (key = keys[i]); ++i) {
                        request.setRequestHeader(key, parsed.headers[key]);
                    }
                    request.withCredentials = parsed.credentials;
                    request.send(parsed.body);
                }
            }).then(function () {
                // The response status can be 0 initially even for successful
                // requests, so defer the processing of this response until the
                // next event loop to give the status time to be set correctly.
                return self.eventLoopPromise;
            }).then(function () {
                // Log a warning for error status responses.
                // TODO: Reject the promise for error statuses.
                if (self._isRequestUnauthorized(request) && typeof self.authorize === "function") {
                    return self.authorize().then(function () {
                        return self._fetchHttpRawDataWithParsedArguments(parsed);
                    });
                } else if (!error && (request.status >= 300 || request.status === 0)) {
                    // error = new Error("Status " + request.status + " received for REST URL " + parsed.url);
                    // console.warn(error);
                    throw HttpError.withRequestAndURL(request, parsed.url);
                }
                // Return null for errors or return the results of parsing the
                // request response according to the specified types.
                // TODO: Support multiple alternate types.

                return parsed.types[0].parseResponse(request, parsed.url);
            });
        }
    },

    

    fetchHttpRawData: {
        value: function (url, headers, body, types, query, sendCredentials) {
            var parsed = this._parseFetchHttpRawDataArguments.apply(this, arguments);

            // Create and return a promise for the fetch results.
            return this._fetchHttpRawDataWithParsedArguments(parsed);

        }
    },

    /**
     * @private
     * @method
     */
    _parseFetchHttpRawDataArguments: {
        value: function (/* url [, headers [, body [, types]]][, sendCredentials] */) {
            var parsed, last, i, n;
            // Parse the url argument, setting the "last" argument index to -1
            // if the URL is invalid.
            parsed = {url: arguments[0]};
            last = typeof parsed.url === "string" ? arguments.length - 1 : -1;
            if (last < 0) {
                console.warn(new Error("Invalid URL for fetchHttpRawData()"));
            }
            // Parse the sendCredentials argument, which must be the last
            // argument if it is provided, and set the "last" argument index to
            // point just past the last non-sendCredentials argument.
            parsed.credentials = last < 1 || arguments[last];
            if (parsed.credentials instanceof Boolean) {
                parsed.credentials = parsed.credentials.valueOf();
            } else if (typeof parsed.credentials !== "boolean") {
                parsed.credentials = true;
                last += 1;
            }
            // Parse the headers argument, which cannot be a boolean.
            var headers = last > 1 && arguments[1] || {};
            parsed.headers = {};
            if (typeof headers === "object") {
                Object.assign(parsed.headers, headers);
            }
            if (this._isBoolean(headers)) {
                console.warn(new Error("Invalid headers for fetchHttpRawData()"));
                last = -1;
            }
            // Parse the body argument, which cannot be a boolean.
            if (last > 2 && arguments[2]) {
                parsed.body = arguments[2];
                if (this._isBoolean(parsed.body)) {
                    console.warn(new Error("Invalid body for fetchHttpRawData()"));
                    last = -1;
                }
            }

            // Parse the types, which can be provided as an array or as a
            // sequence of DataType arguments.
            if (last === 4 && Array.isArray(arguments[3])) {
                parsed.types = arguments[3];
            } else if (last < 4 || !(arguments[3] instanceof exports.HttpService.DataType)) {
                parsed.types = [exports.HttpService.DataType.JSON];
            } else {
                i = 3;
                n = last;
                while (i < n && arguments[i] instanceof exports.HttpService.DataType) {
                    ++i;
                }
                parsed.types = Array.prototype.slice.call(arguments, 3, i);
                if (i < n) {
                    console.warn(new Error("Invalid types for fetchHttpRawData()"));
                    last = -1;
                }
            }


            if (last === 5 && arguments[4] instanceof DataQuery) {
                parsed.query = arguments[4];
            } else if (last === 4 && arguments[3] instanceof DataQuery) {
                parsed.query = arguments[3];
            }
            // Return the parsed arguments.
            return last >= 0 ? parsed : undefined;
        }
    },

    /**
     * @private
     * @method
     */
    _isBoolean: {
        value: function (value) {
            return typeof value === "boolean" || value instanceof Boolean;
        }
    },

    /***************************************************************************
     * Authorization
     */

    _authRegexp: {
        value: new RegExp(/error=\"([^&]*)\"/)
    },

    _isRequestUnauthorized: {
        value: function (request) {
            return request.status === 401 || (typeof this.didAuthorizationFail === "function" && this.didAuthorizationFail(request));
        }
    },

    /***************************************************************************
     * Utilities
     */

    formUrlEncode: {
        value: function (string) {
            return encodeURIComponent(string).replace(/ /g, "+").replace(/[!'()*]/g, function(c) {
                return '%' + c.charCodeAt(0).toString(16);
            });
        }
    }

}, /** @lends HttpService */ {

    /***************************************************************************
     * Types
     */

    /**
     * @class
     */
    DataType: {
        get: Enumeration.getterFor("_DataType", /** @lends HttpService.DataType */ {

            /**
             * @type {DataType}
             */
            BINARY: [{
                // TO DO.
            }],

            /**
             * @type {DataType}
             */
            JSON: [{
                parseResponse: {
                    value: function (request, url) {
                        var text = request && request.responseText,
                            data = null;
                        if (text) {
                            try {
                                data = JSON.parse(text);
                            } catch (error) {
                                console.warn(new Error("Can't parse JSON received from " + url));
                            }
                        } else if (request) {
                            console.warn(new Error("No JSON response received from " + url));
                        }
                        return data;
                    }
                }
            }],

            /**
             * @type {DataType}
             */
            JSONP: [{
                parseResponse: {
                    value: function (request, url) {
                        var text = request && request.responseText,
                            start = text && text.indexOf("(") + 1,
                            end = text && Math.max(text.lastIndexOf(")"), 0),
                            data = null;
                        if (start && end) {
                            try {
                                data = text && JSON.parse(text.slice(start, end));
                            } catch (error) {
                                console.warn(new Error("Can't parse JSONP received from " + url));
                                console.warn("Response text:", text);
                            }
                        } else if (text) {
                            console.warn(new Error("Can't parse JSONP received from " + url));
                            console.warn("Response text:", text);
                        } else if (request) {
                            console.warn(new Error("No JSONP response received from " + url));
                        }
                        return data;
                    }
                }
            }],

            /**
             * @type {DataType}
             */
            TEXT: [{
                parseResponse: {
                    value: function (request, url) {
                        var text = request && request.responseText;
                        if (!text && request) {
                            console.warn(new Error("No text response received from " + url));
                        }
                        return text;
                    }
                }
            }],

            /**
             * @type {DataType}
             */
            XML: [{
                // TO DO.
            }]

        })
    }

});
