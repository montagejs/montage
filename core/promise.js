
// Montage promises are implemented in the Q package.  If Montage Require is
// used for bootstrapping, this file will never actually be required, but will
// be injected instead.
//exports.Promise = require("q");
exports.Promise = require("bluebird");

var THIS = {};
var INSTANCE = {};

var aliasMap = {
    thenReturn: "thenResolve",
    thenThrow: "thenReject",
    caught: "fail",
    progressed: "progress",
    lastly: "fin",
    call: "send mcall invoke".split(" ")
};

var staticAliasMap = {
    reject: "reject rejected".split(" "),
    resolve: "resolve resolved fulfill fulfilled".split(" "),
    is: "isPromise",
    race: "race",
    async: "coroutine",
    spawn: "spawn",
    delay: "delay",

    timeout: INSTANCE,
    join: INSTANCE,
    spread: INSTANCE,
    tap: INSTANCE,
    thenReject: INSTANCE,
    thenResolve: INSTANCE,
    isPending: INSTANCE,
    isFulfilled: INSTANCE,
    isRejected: INSTANCE,
    get: INSTANCE,
    set: INSTANCE,
    del: INSTANCE,
    'delete': INSTANCE,
    'try': INSTANCE,
    keys: INSTANCE,
    allResolved: INSTANCE,
    allSettled: INSTANCE,
    fail: INSTANCE,
    "catch": INSTANCE,
    progress: INSTANCE,
    fin: INSTANCE,
    "finally": INSTANCE,
    done: INSTANCE,
    timeout: INSTANCE,
    nodeify: INSTANCE,
    nfapply: INSTANCE,
    nfcall: INSTANCE,
    nfbind: INSTANCE,
    npost: INSTANCE,
    nsend: INSTANCE,
    ninvoke: INSTANCE,
    nbind: INSTANCE,
    nmcall: INSTANCE,
    fapply: INSTANCE,
    fcall: INSTANCE,
    fbind: INSTANCE,
    denodeify: INSTANCE,
    nmapply: INSTANCE,
    mapply: INSTANCE,
    post: INSTANCE,
    send: INSTANCE,
    mcall: INSTANCE,
    invoke: INSTANCE
};

Object.keys(aliasMap).forEach(function(key) {
    var Qmethods = aliasMap[key];
    if (!Array.isArray(Qmethods)) Qmethods = [Qmethods];
    Qmethods.forEach(function(Qmethod) {
        Promise.prototype[Qmethod] = Promise.prototype[key];
    });
});

Object.keys(staticAliasMap).forEach(function(key) {
    var Qmethods = staticAliasMap[key];
    if (Qmethods === INSTANCE) {
        if (typeof Promise.prototype[key] !== "function")
            throw new Error("unimplemented Promise.prototype." + key);
        Q[key] = function(promise) {
            var instance = Q(promise);
            return instance[key].apply(instance, [].slice.call(arguments, 1));
        };
    } else {
        if (!Array.isArray(Qmethods)) Qmethods = [Qmethods];
        Qmethods.forEach(function(Qmethod) {
            Q[Qmethod] = Promise[key];
        });
    }
});

