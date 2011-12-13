/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

// Scope:
//  * ES5, W3C setImmediate (shimmed if necessary)
//  * speed and economy of memory before safety and securability
//  * run-time compatibility via thenability

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

try {
    // bootstrapping can't handle relative identifiers
    require("core/shim/timers"); // setImmediate
} catch (exception) {
    // in this case, node can't handle absolute identifiers
    require("./shim/timers"); // setImmediate
}

// merely ensures that the returned value can respond to
// messages; does not guarantee a full promise API
function toPromise(value) {
    if (value && typeof value.sendPromise !== "undefined") {
        return value;
    } else if (value && typeof value.then !== "undefined") {
        var deferred = Promise.defer();
        value.then(function (value) {
            deferred.resolve(value);
        }, function (reason, error, rejection) {
            if (rejection) {
                deferred.resolve(rejection);
            } else {
                deferred.reject(reason, error);
            }
        });
        return deferred.promise;
    } else {
        return Promise.fulfill(value);
    }
}

var Creatable = Object.create(Object.prototype, {
    create: {
        value: function (descriptor) {
            return Object.create(this, descriptor);
        }
    },
});

// Common implementation details of FulfilledPromise, RejectedPromise, and
// DeferredPromise
var AbstractPromise = Creatable.create({

    // Common implementation of sendPromise for FulfiledPromise and
    // RejectedPromise, but overridden by DeferredPromise to buffer
    // messages instead of handling them.
    sendPromise: {
        value: function (resolve, op /*, ...args*/) {
            var result;
            try {
                result = (this._handlers[op] || this._fallback)
                    .apply(this, arguments);
            } catch (error) {
                result = this.Promise.reject(error && error.message, error);
            }
            resolve(result);
        }
    },

    // Defers polymorphically to toString
    toSource: {
        value: function () {
            return this.toString();
        }
    }

});

// Basic implementation of the Promise object and prototypes for its
// Fulfilled, Rejected, and Deferred subtypes.  The mixin descriptors that
// give the promise types useful methods like "then" are not applied until
// .create() is used the first time to make the actual Promise export.
var PrimordialPromise = Creatable.create({

    create: {
        value: function (descriptor, promiseDescriptor) {

            // automatically subcreate each of the contained promise types
            var creation = Object.create(this, {
                DeferredPromise: {
                    value: this.DeferredPromise.create(promiseDescriptor)
                },
                FulfilledPromise: {
                    value: this.FulfilledPromise.create(promiseDescriptor)
                },
                RejectedPromise: {
                    value: this.RejectedPromise.create(promiseDescriptor)
                }
            });

            Object.defineProperties(creation, descriptor);

            // create static reflections of all new promise methods
            var statics = {};
            Object.keys(promiseDescriptor).forEach(function (name) {
                statics[name] = {
                    value: function (value) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        var promise = this.ref(value);
                        return promise[name].apply(promise, args);
                    }
                };
            });
            Object.defineProperties(creation, statics);

            return creation;
        }
    },

    isPromise: {
        value: function (value) {
            return value && typeof value.sendPromise !== "undefined";
        }
    },

    ref: {
        value: function (object) {
            // if it is already a promise, wrap it to guarantee
            // the full public API of this promise variety.
            if (object && typeof object.sendPromise === "function") {
                var deferred = this.defer();
                deferred.resolve(object);
                return deferred.promise;
            // if it is at least a thenable duck-type, wrap it
            } else if (object && typeof object.then === "function") {
                var deferred = this.defer();
                object.then(function (value) {
                    deferred.resolve(value);
                }, function (reason, error, rejection) {
                    // if the thenable recognizes rejection
                    // forwarding, accept the given rejection
                    if (rejection) {
                        deferred.resolve(rejection);
                    // otherwise, handle reason and optional error forwarding
                    } else {
                        deferred.reject(reason, error);
                    }
                })
                return deferred.promise;
            // if it is a fulfillment value, wrap it with a fulfillment
            // promise
            } else {
                return this.fulfill(object);
            }
        }
    },

    fulfill: {
        value: function (value) {
            return this.FulfilledPromise.create({
                _value: {
                    value: value,
                    writable: true
                },
                Promise: {
                    value: this
                }
            });
        }
    },

    FulfilledPromise: {
        value: AbstractPromise.create({

            _handlers: {
                value: {
                    then: function (r, o) {
                        return this._value;
                    },
                    get: function (r, o, key) {
                        return this._value[key];
                    },
                    put: function (r, o, key, value) {
                        return this._value[key] = value;
                    },
                    "delete": function (r, o, key) {
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
                }
            },

            _fallback: {
                value: function (callback, operator) {
                    return this.Promise.reject("Promise does not support operation: " + operator);
                }
            },

            valueOf: {
                value: function () {
                    return this._value;
                }
            },

            toString: {
                value: function () {
                    return '[object FulfilledPromise]';
                }
            }

        })
    },

    reject: {
        value: function (reason, error) {
            var self = this.RejectedPromise.create({
                _reason: {
                    value: reason
                },
                _error: {
                    value: error
                },
                Promise: {
                    value: this
                }
            });
            errors.push(error && error.stack || self);
            return self;
        }
    },

    RejectedPromise: {
        value: AbstractPromise.create({

            _handlers: {
                value: {
                    then: function (r, o, rejected) {
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
                }
            },

            _fallback: {
                value: function () {
                    return this;
                }
            },

            valueOf: {
                value: function () {
                    return this;
                }
            },

            toString: {
                value: function () {
                    return '[object RejectedPromise]';
                }
            },

            promiseRejected: {
                value: true
            }

        })
    },

    defer: {
        value: function () {
            var deferred;
            var promise = this.DeferredPromise.create({
                _pending: {
                    value: [],
                    writable: true
                },
                _value: {
                    value: undefined,
                    writable: true
                },
                Promise: {
                    value: this
                }
            });
            deferred = this.Deferred.create({
                promise: {
                    value: promise,
                    enumerable: true
                },
                Promise: {
                    value: this
                }
            });
            Object.defineProperty(promise, "_deferred", {
                value: deferred
            });
            return deferred;
        }
    },

    Deferred: {
        value: Creatable.create({

            resolve: {
                value: function (value) {
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
                }
            },

            reject: {
                value: function (reason, error, rejection) {
                    return this.resolve(
                        rejection ||
                        this.Promise.reject(reason, error)
                    );
                }
            },

        })
    },

    DeferredPromise: {
        value: AbstractPromise.create({

            sendPromise: {
                value: function (resolve, operation, reason) {
                    if (this._pending) {
                        this._pending.push(arguments);
                    } else {
                        var args = arguments,
                            value = this._value;
                        setImmediate(function () {
                            value.sendPromise.apply(value, args);
                        });
                    }
                }
            },

            valueOf: {
                value: function () {
                    return this._pending ? this : this._value.valueOf();
                }
            },

            toString: {
                value: function () {
                    return '[object Promise]';
                }
            }

        })
    },

});

// The API is created from a basic set of static functions and a
// descriptor that will be applied to each of the derrived promise types.
var Promise = PrimordialPromise.create({}, { // Descriptor for each of the three created promise types

    // Synonym for then
    when: {
        value: function (fulfilled, rejected) {
            return this.then(fulfilled, rejected);
        }
    },

    then: {
        value: function (fulfilled, rejected) {
            var self = this;
            var deferred = this.Promise.defer();
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
                            rejection || Promise.reject(reason, error)
                    );
                } catch (error) {
                    deferred.reject(error.message, error);
                }
            }

            setImmediate(function () {
                self.sendPromise(
                    function (value) {
                        if (done) {
                            return;
                        }
                        done = true;
                        toPromise(value)
                            .sendPromise(
                            fulfill,
                            "then",
                            reject
                        )
                    },
                    "then",
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
    },

    send: {
        value: function (name, args) {
            var deferred = Promise.defer();
            var self = this;
            setImmediate(function () {
                self.sendPromise.apply(
                    self,
                    [
                        function (resolution) {
                            deferred.resolve(resolution);
                        },
                        name
                    ].concat(Array.prototype.slice.call(args))
                );
            })
            return deferred.promise;
        }
    },

    get: {
        value: function () {
            return this.send("get", arguments);
        }
    },

    put: {
        value: function () {
            return this.send("put", arguments);
        }
    },

    "delete": {
        value: function () {
            return this.send("delete", arguments);
        }
    },

    post: {
        value: function () {
            return this.send("post", arguments);
        }
    },

    invoke: {
        value: function (name /*, ...args*/) {
            var args = Array.prototype.slice.call(arguments, 1);
            return this.send("post", [name, args]);
        }
    },

    apply: {
        value: function () {
            return this.send("apply", arguments);
        }
    },

    call: {
        value: function (thisp /*, ...args*/) {
            var args = Array.prototype.slice.call(arguments, 1);
            return this.send("apply", [thisp, args]);
        }
    },

    keys: {
        value: function () {
            return this.send("keys", []);
        }
    },

    all: {
        value: function () {
            var self = this;
            return self.then(function (promises) {
                var countDown = promises.length;
                var values = [];
                if (countDown === 0) {
                    return toPromise(values);
                }
                var deferred = self.Promise.defer();
                promises.forEach(function (promise, index) {
                    toPromise(promise).then(function (value) {
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
    },

    delay: {
        value: function (timeout) {
            var deferred = this.Promise.defer();
            this.then(function (value) {
                clearTimeout(handle);
                deferred.resolve(value);
            }, function (reason, error, rejection) {
                clearTimeout(handle);
                deferred.resolve(rejection);
            });
            var handle = setTimeout(function () {
                deferred.reject("Timed out");
            }, timeout);
            return deferred.promise;
        }
    },

    timeout: {
        value: function (timeout) {
            var deferred = this.Promise.defer();
            this.then(function (value) {
                clearTimeout(handle);
                deferred.resolve(value);
            }, function (reason, error, rejection) {
                clearTimeout(handle);
                deferred.resolve(rejection);
            }).end();
            var handle = setTimeout(function () {
                deferred.reject("Timed out");
            }, timeout);
            return deferred.promise;
        }
    },

    fail: {
        value: function (rejected) {
            return this.then(void 0, rejected);
        }
    },

    fin: {
        value: function (callback) {
            return this.then(function (value) {
                return Promise.call(callback)
                .then(function () {
                    return value;
                });
            }, function (reason, error, rejection) {
                return Promise.call(callback)
                .then(function () {
                    return rejection;
                });
            })
            // Guarantees that the same API gets
            // returned as received.
            .to(this.Promise);
        }
    },

    end: {
        value: function () {
            this.then(void 0, function (reason, error) {
                // forward to a future turn so that ``when``
                // does not catch it and turn it into a rejection.
                setImmediate(function () {
                    console.error(error && error.stack || error || reason);
                    throw error;
                });
            })
            // Returns undefined
        }
    },

    isResolved: {
        value: function () {
            return this.isFulfilled() || this.isRejected();
        }
    },

    isFulfilled: {
        value: function () {
            return (
                !Promise.isPromise(this.valueOf()) &&
                !this.isRejected()
            );
        }
    },

    isRejected: {
        value: function () {
            var value = this.valueOf();
            return !!(value && value.promiseRejected);
        }
    },

    to: {
        value: function (Type) {
            return Type.ref(this);
        }
    }

});

var errors = [];
// Live console objects are not handled on tablets
if (typeof window !== "undefined" && !window.Touch) {

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

exports.Promise = Promise;

});
