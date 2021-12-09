var B = require("bluebird");
var Bproto = B.prototype;

//deferredPrototype is Object.prototype, and that creates a mess
// var deferredPrototype = B.pending().constructor.prototype;

// deferredPrototype.makeNodeResolver = function() {
//         return this.asCallback;
// };

function bind(fn, ctx) {
    return function() {
        return fn.apply(ctx, arguments);
    };
}

module.exports = Q;
function Q(value) {
    return B.cast(value);
}

Object.defineProperty(Q, "longStackSupport", {
    set: function(val) {
        if (val) {
            B.longStackTraces();
        }
    },
    get: function() {
        return B.haveLongStackTraces();
    }
});

Q.reject = B.rejected;
Q.defer = function() {
    var b = B.pending();
    b.resolve = bind(b.resolve, b);
    b.reject = bind(b.reject, b);
    //b.progress doesn't exists anymore
    //b.notify = bind(b.progress, b);
    b.makeNodeResolver = function() {
        return this.asCallback;
    };
    return b;
};
Q.all = B.all;
Q.allSettled = B.allSettled;
Bproto.allSettled = Bproto.all;

Q.delay = function (object, timeout) {
    if (timeout === void 0) {
        timeout = object;
        object = void 0;
    }
    return Q(object).delay(timeout);
};

Q.timeout = function (object, ms, message) {
    return Q(object).timeout(ms, message);
};

Q.spread = function(a, b, c) {
    return Q(a).spread(b, c);
};

Q.join = function (x, y) {
    return Q.spread([x, y], function (x, y) {
        if (x === y) {
            // TODO: "===" should be Object.is or equiv
            return x;
        } else {
            throw new Error("Can't join: not the same: " + x + " " + y);
        }
    });
};

Q.race = B.race;

Q["try"] = function(callback) {
    return B.try(callback);
};


Q.fapply = function (callback, args) {
    return B.try(callback, args);
};

Q.fcall = function (callback) {
    return B.try(callback, [].slice.call(arguments, 1));
};

Q.fbind = function(callback) {
    var args = [].slice.call(arguments, 1);
    return function() {
        return B.try(callback, [].slice.call(arguments).concat(args), this);
    };
};

Q.async = B.coroutine;
Q.spawn = B.spawn;
Q.cast = B.cast;
Q.isPromise = B.is;

Q.promised = promised;
function promised(callback) {
    return function () {
        return Q.spread([this, all(arguments)], function (self, args) {
            return callback.apply(self, args);
        });
    };
}

Q.isThenable = function(o) {
    return o && typeof o.then === "function";
};

Q.Promise = function(handler) {
    return new B(handler);
};

Bproto.inspect = Bproto.toJSON;
Bproto.thenResolve = Bproto.thenReturn;
Bproto.thenReject = Bproto.thenThrow;
Bproto.progress = Bproto.progressed;

Bproto.dispatch = function(op, args) {
    if (op === "then" || op === "get" || op === "post" || op === "keys") {
        return this[op].apply(this, args);
    }
    return B.rejected(new Error(
            "Fulfilled promises do not support the " + op + " operator"
    ));
};

Bproto.post = function(name, args, thisp) {
    return this.then(function(val) {
        if (name == null) {
            return val.apply(thisp, args);
        }
        else {
            return val[name].apply(val, args);
        }
    });
};

Bproto.invoke = function(name) {
    var args = [].slice.call(arguments, 1);
    return this.post(name, args);
};

Bproto.fapply = function(args) {
    return this.post(void 0, args);
};

Bproto.fcall = function() {
    var args = [].slice.call(arguments);
    return this.post(void 0, args);
};

Bproto.keys = function() {
    return this.then(function(val) {
        return Object.keys(val);
    });
};

Bproto.timeout = function(ms, message) {
    var self = this;
    setTimeout(function() {
        var e = new Error(message || "Timed out after " + ms + " ms");
        self.reject(e);
    }, ms);
    return this.then();
};

function delay(ms, val) {
    var d = B.pending();
    setTimeout(function(){
        d.fulfill(val);
    }, ms);
    return d.promise;
}

Bproto.delay = function(ms) {
    return this.then(function(value){
        return delay(ms, value);
    });
};

var b = B.fulfilled();
function thrower(e){
    process.nextTick(function(){
        throw e;
    });
}
Q.nextTick = function(fn) {
    b.then(fn).caught(thrower);
};

Q.resolve = B.fulfilled;
Q.fulfill = B.fulfilled;
Q.isPromiseAlike = Q.isThenable;
Q.when = function(a, b, c, d) {
    return B.cast(a).then(b, c, d);
};
Q.fail = function(a, b) {
    return B.cast(a).caught(b);
};
Q.fin = function(a, b) {
    return B.cast(a).lastly(b);
};
Q.progress = function(a, b) {
    return B.cast(a).progress(b);
};
Q.thenResolve = function(a, b) {
    return B.cast(a).thenReturn(b);
};
Q.thenReject = function(a, b) {
    return B.cast(a).thenThrow(b);
};
Q.isPending = function(a, b) {
    return B.cast(a).isPending()
};
Q.isFulfilled = function(a, b) {
    return B.cast(a).isFulfilled();
};
Q.isRejected = function(a, b) {
    return B.cast(a).isRejected();
};
Q.master = function(a, b) {
    return a;
};
Q.makePromise = function (b) {
    return Q.Promise(b);
};
Q.dispatch = function(a, b, c) {
    return B.cast(a).dispatch(b, c);
};
Q.get = function(a, b) {
    return B.cast(a).get(b);
};
Q.keys = function(a, b) {
    return B.cast(a).keys();
};
Q.post = function(a, b, c) {
    return B.cast(a).post(b, c);
};
Q.mapply = function(a, b, c) {
    return B.cast(a).post(b, c);
};
Q.send = function(a, b) {
    return B.cast(a).post(b, [].slice.call(arguments, 2));
};
Q.set = function(a, b, c) {
    return B.cast(a).then(function(val){
        return val[b] = c;
    });
};
Q.delete = function(a, b) {
    return B.cast(a).then(function(val){
        return delete val[b];
    });
};
Q.nearer = function(v) {
    if( B.is(v) && v.isFulfilled()) {
        return v.inspect().value;
    }
    return v;
};

Bproto.fail = Bproto.caught;
Bproto.fin = Bproto.lastly;

Bproto.mapply = Bproto.post;
Bproto.fbind = function() {
    return Q.fbind.apply(Q, [this].concat(Array.prototype.slice.call(arguments)));
};

Bproto.send = function(){
    return this.post(name, [].slice.call(arguments));
};

Bproto.mcall = Bproto.send;

//wtf?
Bproto.passByCopy = function(v) {
    return v;
};


/**
 * Terminates a chain of promises, forcing rejections to be
 * thrown as exceptions.
 * @param {Any*} promise at the end of a chain of promises
 * @returns nothing
 */
Q.done = function (object, fulfilled, rejected, progress) {
    return Q(object).done(fulfilled, rejected, progress);
};

Bproto.done = function (fulfilled, rejected, progress) {
    var onUnhandledError = function (error) {
        // forward to a future turn so that ``when``
        // does not catch it and turn it into a rejection.
        var onerror = Q.onerror;
        var sheduled = scheduler(function () {
            promise._attachExtraTrace(error);
            if (onerror) {
                onerror(error);
            } else {
                throw error;
            }
        });
        if (scheduler.isStatic === true && typeof sheduled === "function") {
            sheduled();
    	}
    };

    // Avoid unnecessary `nextTick`ing via an unnecessary `when`.
    var promise = fulfilled || rejected || progress ?
        this.then(fulfilled, rejected, progress) :
        this;

    if (typeof process === "object" && process && process.domain) {
        onUnhandledError = process.domain.bind(onUnhandledError);
    }

    promise.then(void 0, onUnhandledError);
};



/*
    Benoit 4/21/2020

    NQ doesn't seems to be used anyway, commenting
*/
// var NQ = {};

// NQ.makeNodeResolver = function (resolve) {
//     return function (error, value) {
//         if (error) {
//             resolve(Q.reject(error));
//         } else if (arguments.length > 2) {
//             resolve(Array.prototype.slice.call(arguments, 1));
//         } else {
//             resolve(value);
//         }
//     };
// };

Q.nfapply = function(callback, args) {

};

/*Directly copypasted from Q */
//// BEGIN UNHANDLED REJECTION TRACKING

// This promise library consumes exceptions thrown in handlers so they can be
// handled by a subsequent promise.  The exceptions get added to this array when
// they are created, and removed when they are handled.  Note that in ES6 or
// shimmed environments, this would naturally be a `Set`.

var unhandledReasons = [];
var unhandledRejections = [];
var unhandledReasonsDisplayed = false;
var trackUnhandledRejections = true;
function displayUnhandledReasons() {
    if (
        !unhandledReasonsDisplayed &&
        typeof window !== "undefined" &&
        window.console
    ) {
        console.warn("[Q] Unhandled rejection reasons (should be empty):",
                     unhandledReasons);
    }

    unhandledReasonsDisplayed = true;
}

function logUnhandledReasons() {
    for (var i = 0; i < unhandledReasons.length; i++) {
        var reason = unhandledReasons[i];
        console.warn("Unhandled rejection reason:", reason);
    }
}

function resetUnhandledRejections() {
    unhandledReasons.length = 0;
    unhandledRejections.length = 0;
    unhandledReasonsDisplayed = false;

    if (!trackUnhandledRejections) {
        trackUnhandledRejections = true;

        // Show unhandled rejection reasons if Node exits without handling an
        // outstanding rejection.  (Note that Browserify presently produces a
        // `process` global without the `EventEmitter` `on` method.)
        if (typeof process !== "undefined" && process.on) {
            process.on("exit", logUnhandledReasons);
        }
    }
}

function trackRejection(promise, reason) {
    if (!trackUnhandledRejections) {
        return;
    }

    unhandledRejections.push(promise);
    if (reason && typeof reason.stack !== "undefined") {
        unhandledReasons.push(reason.stack);
    } else {
        unhandledReasons.push("(no stack) " + reason);
    }
    displayUnhandledReasons();
}

function untrackRejection(promise) {
    if (!trackUnhandledRejections) {
        return;
    }

    var at = unhandledRejections.indexOf(promise);
    if (at !== -1) {
        unhandledRejections.splice(at, 1);
        unhandledReasons.splice(at, 1);
    }
}

Q.resetUnhandledRejections = resetUnhandledRejections;

Q.getUnhandledReasons = function () {
    // Make a copy so that consumers can't interfere with our internal state.
    return unhandledReasons.slice();
};

Q.stopUnhandledRejectionTracking = function () {
    resetUnhandledRejections();
    if (typeof process !== "undefined" && process.on) {
        process.removeListener("exit", logUnhandledReasons);
    }
    trackUnhandledRejections = false;
};

resetUnhandledRejections();
/*Directly copypasted from Q end */



B.onPossiblyUnhandledRejection(function(reason, promise){
    trackRejection(promise, reason);
});
