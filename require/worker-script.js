(function (global) {

var postMessage = global.postMessage.bind(global);
var addEventListener = global.addEventListener.bind(global);
var removeEventListener = global.removeEventListener.bind(global);

console = {
    log: function () {
        postMessage({
            type: "console",
            method: "log",
            args: Array.prototype.map.call(arguments, function (value) {
                if (typeof value === "string") {
                    return value;
                } else {
                    return JSON.stringify(value);
                }
            })
        });
    },
    error: function () {
        postMessage({
            type: "console",
            method: "error",
            args: Array.prototype.map.call(arguments, function (value) {
                if (typeof value === "string") {
                    return value;
                } else {
                    return JSON.stringify(value);
                }
            })
        });
    }
};

var factories = {};
bootstrap = function (id, factory) {
    factories[id] = factory;
};

importScripts(
    "require.js",
    "../core/promise.js",
    "../core/next-tick.js",
    "../core/url.js"
);

delete bootstrap;

var modules = {};
function bootRequire(id) {
    if (!modules[id]) {
        var exports = modules[id] = {};
        factories[id](bootRequire, exports);
    }
    return modules[id];
}

var Require = bootRequire("require/require");
var Promise = bootRequire("core/promise").Promise;

var packageDeferred = Promise.defer();
var location;
var module;

Require.getLocation = function () {
    return location;
};

Require.overlays = ["worker", "browser", "montage"];

var reads = {};
Require.read = function (url) {
    if (reads[url] === void 0) {
        var deferred = Promise.defer();
        postMessage({
            type: "read",
            url: url
        });
        reads[url] = deferred;
    }
    return reads[url].promise;
};

// By using a named "eval" most browsers will execute in the global scope.
// http://www.davidflanagan.com/2010/12/global-eval-in.html
// Unfortunately execScript doesn't always return the value of the evaluated expression (at least in Chrome)
var globalEval = /*this.execScript ||*/eval;
// For Firebug evaled code isn't debuggable otherwise
// http://code.google.com/p/fbug/issues/detail?id=2198
if (global.navigator && global.navigator.userAgent.indexOf("Firefox") >= 0) {
    globalEval = new Function("_", "return eval(_)");
}

var __FILE__String = "__FILE__",
    DoubleUnderscoreString = "__",
    globalEvalConstantA = "(function ",
    globalEvalConstantB = "(require, exports, module) {",
    globalEvalConstantC = "//*/\n})\n//@ sourceURL=";

Require.Compiler = function (config) {
    return function (module) {
        if (module.factory || module.text === void 0)
            return module;
        // Here we use a couple tricks to make debugging better in various browsers:
        // TODO: determine if these are all necessary / the best options
        // 1. name the function with something inteligible since some debuggers display the first part of each eval (Firebug)
        // 2. append the "//@ sourceURL=location" hack (Safari, Chrome, Firebug)
        //  * http://pmuellr.blogspot.com/2009/06/debugger-friendly.html
        //  * http://blog.getfirebug.com/2009/08/11/give-your-eval-a-name-with-sourceurl/
        //      TODO: investigate why this isn't working in Firebug.
        // 3. set displayName property on the factory function (Safari, Chrome)

        var displayName = __FILE__String+module.location.replace(/\.\w+$|\W/g, DoubleUnderscoreString);

        try {
            module.factory = globalEval(globalEvalConstantA+displayName+globalEvalConstantB+module.text+globalEvalConstantC+module.location);
        } catch (exception) {
            throw new SyntaxError("in " + module.location + ": " + exception.message);
        }

        // This should work and would be simpler, but Firebug does not show scripts executed via "new Function()" constructor.
        // TODO: sniff browser?
        // module.factory = new Function("require", "exports", "module", module.text + "\n//*/"+sourceURLComment);

        module.factory.displayName = displayName;
    };
};

Require.ReadLoader = function (config) {
    return function (url, module) {
        return Require.read(url)
        .then(function (text) {
            module.type = "javascript";
            module.text = text;
            module.location = url;
        });
    };
};

Require.makeLoader = function (config) {
    return Require.MappingsLoader(
        config,
        Require.ExtensionsLoader(
            config,
            Require.PathsLoader(
                config,
                Require.MemoizedLoader(
                    config,
                    Require.ReadLoader(config)
                )
            )
        )
    );
};


global.postMessage = function (event) {
    postMessage({
        type: "forward",
        data: event.data
    })
};

var workerDeferred = Promise.defer();

var handlers = [];
function dispatch(event) {
    handlers.forEach(function (handler) {
        if (handler.handleEvent) {
            handler.handleEvent(event);
        } else {
            handler(event);
        }
    });
    if (global.onmessage) {
        global.onmessage(event);
    }
}

global.addEventListener = function (name, handler, capture, untrusted) {
    if (name === "message") {
        handlers.push(handler);
    } else {
        return addEventListener(name, handler, caputre, untrusted);
    }
};

global.removeEventListener = function (name, handler) {
    if (name === "message") {
        var pos = handlers.indexOf(handler);
        if (pos !== -1) {
            handlers.splice(pos, 1);
        }
    } else {
        return removeEventListener(name, handler);
    }
};

addEventListener("message", function (event) {
    event.stopPropagation();
    event.preventDefault();
    if (event.data.type === "init") {
        location = event.data.package;
        module = event.data.module;
        var packagePromise = Require.loadPackage(location)
        .then(function (package) {
            return package.async(module)
            .then(function () {
                workerDeferred.resolve(global);
            })
        })
        .end()
    } else if (event.data.type === "read") {
        if (event.data.content !== void 0) {
            reads[event.data.url].resolve(event.data.content);
        } else {
            reads[event.data.url].reject(event.data.error);
        }
        delete reads[event.data.url];
    } else if (event.data.type === "forward") {
        workerDeferred.promise.then(function (worker) {
            dispatch({
                data: event.data.data
            });
        })
        .end()
    } else {
        // XXX
    }
}, false);

})(this);
