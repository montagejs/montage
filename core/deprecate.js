/* global console */
var Montage = require("./core").Montage,
    Map = require("collections/map");

var deprecatedFeaturesOnceMap = new Map();

function generateDeprecatedKey(name, alternative) {
    return alternative ? name + "_" + alternative : name;
}

/**
 * @module montage/core/deprecate
 */

/**
 * Prints out a deprecation warning to the console.warn with the format:
 * `name` is deprecated, use `alternative` instead.
 * It can also print out a stack trace with the line numbers.
 *
 * @param {String} name - Name of the thing that is deprecated.
 * @param {String} alternative - Name of alternative that should be used instead.
 * @param {Number} [stackTraceLimit] - depth of the stack trace to print out. Set to falsy value to disable stack.
 */
var deprecationWarning = exports.deprecationWarning = function deprecationWarning(name, alternative, stackTraceLimit) {
    stackTraceLimit = stackTraceLimit === true ? 2 : stackTraceLimit;
    var stackTraceLimitOrigin;
    if (stackTraceLimit) {
        stackTraceLimitOrigin = Error.stackTraceLimit;
        Error.stackTraceLimit = stackTraceLimit;
    }
    if (typeof console !== "undefined" && typeof console.warn === "function") {
        var stack = (stackTraceLimit ? new Error("").stack : "") ;
        if(alternative) {
            console.warn(name + " is deprecated, use " + alternative + " instead.", stack);
        } else {
            //name is a complete message
            console.warn(name, stack);
        }
    }
    if (stackTraceLimit) {
        Error.stackTraceLimit = stackTraceLimitOrigin;
    }
};

/**
 *
 * Call deprecationWarning function only once.
 *
 * @param {String} name - Name of the thing that is deprecated.
 * @param {String} alternative - Name of alternative that should be used instead.
 * @param {Number} [stackTraceLimit] - depth of the stack trace to print out. Set to falsy value to disable stack.
 */
exports.deprecationWarningOnce = function deprecationWarningOnce(name, alternative, stackTraceLimit) {
    var key = generateDeprecatedKey(name, alternative);
    if (!deprecatedFeaturesOnceMap.has(key)) {
        exports.deprecationWarning(name, alternative, stackTraceLimit);
        deprecatedFeaturesOnceMap.set(key, true);
    }
};

/**
 * Provides a function that can replace a method that has been deprecated.
 * Prints out a deprecation warning to the console.warn with the format:
 * `name` is deprecated, use `alternative` instead.
 * It will also print out a stack trace with the line numbers.
 *
 * @param {Object} scope - The object that will be used as the `this` when the `deprecatedFunction` is applied.
 * @param {Function} deprecatedFunction - The function object that is deprecated.
 * @param {String} name - Name of the method that is deprecated.
 * @param {String} alternative - Name of alternative method that should be used instead.
 *
 * @returns {Function} deprecationWrapper
 */
exports.deprecateMethod = function deprecate(scope, deprecatedFunction, name, alternative, once) {
    var deprecationWrapper = function () {
        // stackTraceLimit = 3 // deprecationWarning + deprecate + caller of the deprecated method
        if (once) {
            exports.deprecationWarningOnce(name, alternative, 3);
        } else {
            deprecationWarning(name, alternative, 3);
        }
        
        return deprecatedFunction.apply(scope ? scope : this, arguments);
    };
    deprecationWrapper.deprecatedFunction = deprecatedFunction;
    return deprecationWrapper;
};

/**
 * To call a function immediately and log a deprecation warning
 *
 * @param scope
 * @param callback
 * @param name
 * @param alternative
 * @returns {*}
 */
exports.callDeprecatedFunction = function (scope, callback, name, alternative/*, ...args */) {
    var depth = Error.stackTraceLimit,
        scopeName,
        args;

    Error.stackTraceLimit = 2;
    if (typeof console !== "undefined" && typeof console.warn === "function") {
        scopeName = Montage.getInfoForObject(scope).objectName;

        if (alternative) {
            console.warn(name + " is deprecated, use " + alternative + " instead.", scopeName);
        } else {
            // name is a complete message
            console.warn(name, scopeName);
        }

    }
    Error.stackTraceLimit = depth;
    args = Array.prototype.slice.call(arguments, 4);
    return callback.apply(scope ? scope : this, args);
};
