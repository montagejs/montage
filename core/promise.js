// Montage promises are implemented in the bluebird package.  If Montage Require is
// used for bootstrapping, this file will never actually be required, but will
// be injected instead.

var Promise = require("bluebird");

// Patch "Promise.is" to support native
Promise.is = function (obj) {
    /*
        It's unlikely an object that's neither an object nor a function would have both a then and catch methods, so dropping (typeof obj === 'object' || typeof obj === 'function') for performance optimization. All montage tests pass the same
    */
    return obj && (typeof obj === 'object' || typeof obj === 'function') && ("then" in obj) && ("catch" in obj) && typeof obj.then === "function" && typeof obj.catch === "function";
    //return obj && typeof obj.then === 'function' && typeof obj.catch === 'function';
    // return obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function' && typeof obj.catch === 'function';
};

// Polyfill "Promise.prototypefinally" to support finally
if (Promise.prototype.hasOwnProperty('finally') === false) {
	Promise.prototype['finally'] = function finallyPolyfill(callback) {
		var constructor = this.constructor;
		return this.then(function(value) {
				return constructor.resolve(callback()).then(function() {
					return value;
				});
			}, function(reason) {
				return constructor.resolve(callback()).then(function() {
					throw reason;
				});
			});
	};
}

if(!Promise.resolveNull) {
    /**
     * A shared promise resolved with a value of null
     *
     * @type {external:Promise}
     */
    Object.defineProperty(Promise, "resolveNull", {
        value: Promise.resolve(null),
        enumerable: false
    });
}

if(!Promise.resolveUndefined) {
    /**
     * A shared promise resolved with a value of undefined
     *
     * @type {external:Promise}
     */
    Object.defineProperty(Promise, "resolveUndefined", {
        value: Promise.resolve(undefined),
        enumerable: false
    });
}

if(!Promise.resolveTrue) {
    /**
     * A shared promise resolved with a value of undefined
     *
     * @type {external:Promise}
     */
    Object.defineProperty(Promise, "resolveTrue", {
        value: Promise.resolve(true),
        enumerable: false
    });
}

if(!Promise.resolveFalse) {
    /**
     * A shared promise resolved with a value of undefined
     *
     * @type {external:Promise}
     */
    Object.defineProperty(Promise, "resolveFalse", {
        value: Promise.resolve(false),
        enumerable: false
    });
}

if(!Promise.timeout) {
    /**
     * The timeoutPromise helper allows you to wrap any promise to fulfill within a timeout.
     *
     * @param {Promise} promise A promise instance
     * @param {BigInteger} timeoutInMilliseconds The time limit in milliseconds to fulfill or reject the promise.
     * @returns {Promise} A pending Promise
     */

     Object.defineProperty(Promise, "timeout", {
        value: function PromiseTimeout(promise, timeoutInMilliseconds){
            return Promise.race([
                promise,
                new Promise(function(resolve, reject){
                    setTimeout(function() {
                        reject(new Error("timeout"));
                    }, timeoutInMilliseconds);
                })
            ]);
        },
        enumerable: false
    });
}

exports.Promise = Promise;
