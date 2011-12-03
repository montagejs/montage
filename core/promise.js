/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

// Scope:
//  * ES5, W3C setImmediate (shimmed if necessary)
//  * speed and economy of memory before safety and securability
//  * run-time compatibility via thenability

// TODO coerce then -> sendPromise
// TODO use outOfService flag to stop early if a promise gets used
//      after its freed
// TODO note the comps/promiseSend/sendPromise and argument order
//      changes from Q

// This module is used during the boot-strapping, so it can be required as
// a normal CommonJS module, but alternately bootstraps Montage if there
// is a bootstrap global variable.
(function (definition) {
    if (typeof bootstrap !== "undefined") {
        bootstrap("core/promise", definition);
    } else if (typeof require !== "undefined") {
        // module
        definition(require, exports, module);
    } else {
        // global script
        Q = {};
        definition(function () {}, Q);
    }
})(function (require, exports, module) {

"use strict";

require("core/shim/timers"); // setImmediate

// abstract
function Promise()/** @lends module:montage/core/promise.Promise# */ {
}

// shared FulfilledPromise, RejectedPromise,
// overridden by DeferredPromise

/**
    @function module:montage/core/promise.#sendPromise
*/
Promise.prototype.sendPromise = function (resolve, op /*, ...args*/) {
    var result;
    try {
        result = (this._handlers[op] || this._fallback)
            .apply(this, arguments);
    } catch (error) {
        result = RejectedPromise(error.message, error);
    }
    resolve(result);
};
/**
    @function module:montage/core/promise.#toSource
*/
Promise.prototype.toSource = function () {
    return this.toString();
};
/**
    @function module:montage/core/promise.#toString
*/
Promise.prototype.toString = function () {
    return '[object Promise]';
};

var fulfilledPromisePool = [];

function FulfilledPromise(value) {
    return Object.create(FulfilledPromise.prototype, {
        _value: {
            value: value,
            writable: true
        }
    });
}
/**
    @function module:montage/core/promise.#create
*/
FulfilledPromise.prototype = Object.create(Promise.prototype);
/**
    @function module:montage/core/promise.#constructor
*/
FulfilledPromise.prototype.constructor = FulfilledPromise;

// All of these handlers receive the sendPromise resolve and operator
// arguments, even though they are never used, because it is cheaper
// to reuse the arguments object on apply than to slice the array.

/**
  @private
*/
FulfilledPromise.prototype._handlers = {
    when: function (r, o) {
        return this._value;
    },
    get: function (r, o, key) {
        return this._value[key];
    },
    put: function (r, o, key, value) {
        return this._value[key] = value;
    },
    del: function (r, o, key) {
        return delete this._value[key];
    },
    post: function (r, o, key, value) {
        return this._value[key].apply(this._value, value);
    },
    apply: function (r, o, self, args) {
        return this._value.apply(self, args);
    },
    keys: function (r, o) {
        return Object.keys(this._value);
    }
};
/**
  @private
*/
FulfilledPromise.prototype._fallback = function (r, operator) {
    return RejectedPromise("Promise does not support operation: " + operator);
};
/**
    @function module:montage/core/promise.#valueOf
*/
FulfilledPromise.prototype.valueOf = function () {
    return this._value;
};

FulfilledPromise.prototype.toString = function () {
    return '[object FulfilledPromise]';
};
/**
    @function module:montage/core/promise.#free
*/
FulfilledPromise.prototype.free = function () {
    this._outOfService = true;
    fulfilledPromisePool.push(this);
};

var deferredPool = [];
/**
   @function module:montage/core/promise.#Deferred
 */
function Deferred() {
    var deferred;
    if (deferredPool.length) {
        deferred = deferredPool.pop();
        deferred.promise._outOfService = false;
    } else {
        var promise = DeferredPromise();
        deferred = Object.create(Deferred.prototype, {
            promise: {
                value: promise,
                enumerable: true
            }
        });
        Object.defineProperty(promise, "_deferred", {
            value: deferred
        });
    }
    return deferred;
}
/**
    @function module:montage/core/promise.#resolve
*/
Deferred.prototype.resolve = function (value) {
    if (!this.promise._pending) {
        return;
    }
    this.promise._value = value = toPromise(value);
    this.promise._pending.forEach(function (pending) {
        setImmediate(function () {
            value.sendPromise.apply(value, pending);
        });
    });
    this.promise._pending = undefined;
    return value;
};
/**
    @function module:montage/core/promise.#reject
*/
Deferred.prototype.reject = function (reason, error, rejection) {
    return this.resolve(rejection || RejectedPromise(reason, error));
};
/**
   @function module:montage/core/promise.#DeferredPromise
 */
function DeferredPromise() {
    return Object.create(DeferredPromise.prototype, {
        _pending: {
            value: [],
            writable: true
        },
        _value: {
            value: undefined,
            writable: true
        }
    });
}
Deferred.Promise = DeferredPromise;

DeferredPromise.prototype = Object.create(Promise.prototype);

/**
    @function module:montage/core/promise.#constructor
*/
DeferredPromise.prototype.constructor = DeferredPromise;

/**
    @function module:montage/core/promise.#sendPromise
*/
DeferredPromise.prototype.sendPromise = function () {
    if (this._pending) {
        this._pending.push(arguments);
    } else {
        var args = arguments,
            value = this._value;
        setImmediate(function () {
            value.sendPromise.apply(value, args);
        });
    }
};
/**
    @function module:montage/core/promise/DeferredPromise.#valueOf
*/
DeferredPromise.prototype.valueOf = function () {
    return this._pending ? this : this._value.valueOf();
};
/**
    @function module:montage/core/promise/DeferredPromise.#free
*/
DeferredPromise.prototype.free = function () {
    this._outOfService = true;
    this._value = undefined;
    deferredPool.push(this._deferred);
};

var errors = [];
// Live console objects are not handled on tablets
if (!window.Touch) {

    /*
    * This promise library consumes exceptions thrown in callbacks so
    * that they can be handled asynchronously.  The exceptions get
    * added to ``errors`` when they are consumed, and removed when
    * they are handled.  In many debuggers, the view of the reported
    * array will update to reflect its current contents so you can
    * always see if you have missed an error.
    *
    * This log will appear once for every time this module gets
    * instantiated.  That should be once per frame.
    */
    console.log("Should be empty:", errors);

}

function RejectedPromise(reason, error) {
    var self = Object.create(RejectedPromise.prototype, {
        _reason: {
            value: reason
        },
        _error: {
            value: error
        }
    });
    errors.push(error && error.stack || self);
    return self;
}

RejectedPromise.prototype = Object.create(Promise.prototype);
/**
    @function module:montage/core/promise/RejectedPromise.#constructor
*/
RejectedPromise.prototype.constructor = RejectedPromise;

/**
  @private
*/
RejectedPromise.prototype._handlers = {
    when: function (r, o, rejected) {
        // remove this error from the list of unhandled errors on the console
        if (rejected) {
            var at = errors.indexOf(this._error && this._error.stack || this);
            if (at !== -1) {
                errors.splice(at, 1);
            }
        }
        return rejected ?
            rejected(this._reason, this._error, this) :
            this;
    }
};
/**
  @private
*/
RejectedPromise.prototype._fallback = function () {
    return this;
};
/**
 * @function module:montage/core/promise/RejectedPromise.#valueOf
 */
RejectedPromise.prototype.valueOf = function () {
    return this;
};
/**
 * @function module:montage/core/promise/RejectedPromise.#toString
 */
RejectedPromise.prototype.toString = function () {
    return '[object RejectedPromise]';
};
/**
 * @function module:montage/core/promise/RejectedPromise.#promiseRejected
 */
RejectedPromise.prototype.promiseRejected = true;
/**
 * @function module:montage/core/promise/RejectedPromise.#promiseRejected.
 */
RejectedPromise.prototype.free = function () {
    // noop; rejections are not reused
};
/**
    Description TODO
    @function
    @param {Object} object  TODO
    @returns object && typeof object.sendPromise === "function"
    */
function isPromise(object) {
    return object && typeof object.sendPromise === "function";
}
/**
    Description TODO
    @function
    @param {Object} object TODO
    @returns !isPromise(valueOf(object))
    */
function isResolved(object) {
    return !isPromise(valueOf(object));
}
/**
    Description TODO
    @function
    @param {Object} object TODO
    @returns !isPromise(valueOf(object)) && !isRejected(object)
    */
function isFulfilled(object) {
    return !isPromise(valueOf(object)) && !isRejected(object);
}
;
/**
    Description TODO
    @function
    @param {Object} object TODO
    @returns false || !!object.promiseRejected
    */
function isRejected(object) {
    object = valueOf(object);
    if (object === undefined || object === null) {
        return false;
    }
    return !!object.promiseRejected;
}
/**
    Description TODO
    @function
    @param {Number} value TODO
    @param {Boolean} fulfilled TODO
    @param {Boolean} rejected TODO
    */
function when(value, fulfilled, rejected) {
    var deferred = Deferred();
    var done = false;

    function fulfill(value) {
        try {
            deferred.resolve(fulfilled ? fulfilled(value) : value);
        } catch (error) {
            console.log(error.stack);
            deferred.reject(error.message, error);
        }
    }

    function reject(reason, error, rejection) {
        try {
            deferred.resolve(
                rejected ? rejected(
                    reason,
                    error,
                    rejection
                ) :
                    rejection || RejectedPromise(reason, error)
            );
        } catch (error) {
            deferred.reject(error.message, error);
        }
    }

    setImmediate(function () {
        toPromise(value)
            .sendPromise(
            function (value) {
                if (done) {
                    return;
                }
                done = true;
                toPromise(value)
                    .sendPromise(
                    fulfill,
                    "when",
                    reject
                )
            },
            "when",
            function (reason, error, rejection) {
                if (done) {
                    return;
                }
                done = true;
                reject(reason, error, rejection);
            }
        );
    });

    return deferred.promise;
}
/**
    Description TODO
    @function
    @param {String} promise TODO
    @param {String} rejected TODO
    @returns when(promise, undefined, rejected)
    */
function fail(promise, rejected) {
    return when(promise, undefined, rejected);
}
/**
    Description TODO
    @function
    @param {String} promise TODO
    @param {Function} callback The callback function.
    @returns value or reject(reason)
    */
function fin(promise, callback) {
    return when(promise, function (value) {
        return when(callback(), function () {
            return value;
        });
    }, function (reason, error, rejection) {
        return when(callback(), function () {
            return rejection;
        });
    });
}
/**
    Description TODO
    @function 
    @param {Property} value TODO
    */
function end(value) {
    when(value, undefined, function (reason, error) {
        // forward to a future turn so that ``when``
        // does not catch it and turn it into a rejection.
        setImmediate(function () {
            console.error(error && error.stack || error || reason);
            throw error;
        });
    });
}
/**
    Description TODO
    @function 
    @param {Property} value TODO
    @returns deferred.promise
    */
function send(value /*, operator, ...args*/) {
    var deferred = Deferred();
    var args = Array.prototype.slice.call(arguments, 1);
    var promise = toPromise(value);
    setImmediate(function () {
        promise.sendPromise.apply(
            promise,
            [function (value) {
                deferred.resolve(value);
            }].concat(args)
        );
    });
    return deferred.promise;
}
/**
    Description TODO
    @function
    @param {Operator} operator TODO
    @returns {Array} send.apply(undefined, [value, operator].concat(args))
    */
function sender(operator) {
    return function (value /*, ...args*/) {
        var args = Array.prototype.slice.call(arguments, 1);
        return send.apply(undefined, [value, operator].concat(args));
    }
}

var get = sender("get");
var put = sender("put");
var del = sender("del");
var post = sender("post");
var apply = sender("apply");
var keys = sender("keys");

/**
    Description TODO
    @function
    @param {Property} value TODO
    @param {Property} name TODO
    @returns post(value, name, args)
    */
var invoke = function (value, name) {
    var args = Array.prototype.slice.call(arguments, 2);
    return post(value, name, args);
};
/**
    Description TODO
    @function
    @param {Property} value TODO
    @param {Property} thisp TODO
    @returns apply(value, thisp, args)
    */
var call = function (value, thisp) {
    var args = Array.prototype.slice.call(arguments, 2);
    return apply(value, thisp, args);
};
/**
    Description TODO
    @function
    @param {Property} promises TODO
    @returns when(promises, function (promises) or toPromise(values) or deferred.promise
    */
function all(promises) {
    return when(promises, function (promises) {
        var countDown = promises.length;
        var values = [];
        if (countDown === 0) {
            return toPromise(values);
        }
        var deferred = Deferred();
        promises.forEach(function (promise, index) {
            when(promise, function (value) {
                values[index] = value;
                if (--countDown === 0) {
                    deferred.resolve(values);
                }
            }, function (reason, error, rejection) {
                deferred.reject(reason, error, rejection);
            });
        });
        return deferred.promise;
    });
}
/**
    Description TODO
    @function
    @param {Property} value TODO
    @returns value or promise or FulfilledPromise(value)
    */
function toPromise(value) {
    // return sendables unaltered
    if (isPromise(value)) {
        return value;
        //} else if (value && typeof value.sendPromise == "function") {
        //}
        //} else if (value && typeof value.then == "function") {
        //}
    } else if (fulfilledPromisePool.length) {
        var promise = fulfilledPromisePool.pop();
        promise._outOfService = false;
        promise._value = toPromise(value);
        return promise;
    } else {
        return FulfilledPromise(value);
    }
}
/**
    Description TODO
    @function
    @param {Function} callback The callback function.
    @returns function() or deferred.promise
    */
function node(callback) {
    return function () {
        var deferred = Deferred();
        var args = Array.prototype.slice.call(arguments);
        var self = this;
        // add a continuation that resolves the promise
        args.push(function (error, value) {
            if (error) {
                deferred.reject(error);
            } else {
                deferred.resolve(value);
            }
        });
        // trap exceptions thrown by the callback
        when(undefined,
            function () {
                callback.apply(self, args);
            }).fail(function (reason, error, rejection) {
                deferred.reject(reason, error, rejection);
            });
        return deferred.promise;
    };
}
/**
    Description TODO
    @function
    @param {Function} callback The callback function.
    @returns node(callback).apply(undefined, args)
    */
function ncall(callback /*, ...args*/) {
    var args = Array.prototype.slice.call(arguments, 1);
    return node(callback).apply(undefined, args);
}

// internal utilities
/**
    Description TODO
    @function
    @param {Property} value TODO
    @returns value.valueOf() or value
    */
function valueOf(value) {
    if (Object(value) === value) {
        return value.valueOf();
    } else {
        return value;
    }
}

/**
    Description TODO
    @function
    @param {Property} promise TODO
    @param {Property} timeout TODO
    @returns deferred.promise
    */
function timeout(promise, timeout) {
    var deferred = Deferred();
    when(promise, function (value) {
        clearTimeout(handle);
        deferred.resolve(value);
    }, function (reason, error, rejection) {
        clearTimeout(handle);
        deferred.reject(reason, error, rejection);
    });
    var handle = setTimeout(function () {
        deferred.reject("Timed out");
    }, timeout);
    return deferred.promise;
}
/**
    Description TODO
    @function
    @param {Property} promise TODO
    @param {Property} timeout TODO
    @returns deferred.promise
    */
function delay(promise, timeout) {
    var deferred = Deferred();
    setTimeout(function () {
        deferred.resolve(promise);
    }, timeout);
    return deferred.promise;
}


// Patch the prototype chain
/**
    Description TODO
    @function
    @param {Property} fun TODO
    @returns function () or fun.apply(void 0, [this].concat(args))
    */
function methodize(fun) {
    return function () {
        var args = Array.prototype.slice.call(arguments);
        return fun.apply(void 0, [this].concat(args));
    };
}

// Public API

Promise.prototype.then = methodize(when);
Promise.prototype.send = methodize(send);
Promise.prototype.get = methodize(get);
Promise.prototype.put = methodize(put);
Promise.prototype["delete"] = methodize(del);
Promise.prototype.post = methodize(post);
Promise.prototype.invoke = methodize(invoke);
Promise.prototype.keys = methodize(keys);
Promise.prototype.apply = methodize(apply);
Promise.prototype.call = methodize(call);
Promise.prototype.all = methodize(all);
Promise.prototype.timeout = methodize(timeout);
Promise.prototype.delay = methodize(delay);
Promise.prototype.fail = methodize(fail);
Promise.prototype.end = methodize(end);

exports.defer = Deferred;
exports.ref = toPromise; // subsumes FulfilledPromise
exports.fulfill = FulfilledPromise;
exports.reject = RejectedPromise;
exports.when = when;
exports.all = all;
exports.invoke = invoke;
exports.get = get;
exports.put = put;
exports.post = post;
exports["delete"] = del;
exports.invoke = invoke;
exports.apply = apply;
exports.call = call;
exports.isPromise = isPromise;
exports.isResolved = isResolved;
exports.isFulfilled = isFulfilled;
exports.isRejected = isRejected;
exports.node = node;
exports.ncall = ncall;
exports.pool = deferredPool;

});
