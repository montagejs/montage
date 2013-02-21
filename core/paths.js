
var Montage = require("core/core").Montage;
var WeakMap = require("collections/weak-map");
var Map = require("collections/map");

var parse = require("frb/parse");
var evaluate = require("frb/evaluate");
var assign = require("frb/assign");
var observe = require("frb/observe");
var bind = require("frb/bind");
var compileObserver = require("frb/compile-observer");
var Observers = require("frb/observers");
var autoCancelPrevious = Observers.autoCancelPrevious;
var observeProperty = Observers.observeProperty;
var observeKey = Observers.observeKey;

var pathChangeDescriptors = new WeakMap();

Montage.defineProperties(Montage, {

    getPath: {
        value: function (path, parameters) {
            return evaluate(path, this, parameters);
        }
    },

    setPath: {
        value: function (path, value, parameters) {
            return assign(this, path, value, parameters);
        }
    },

    observePath: {
        value: function (path, emit, parameters, beforeChange) {
            var syntax = parse(path);
            var observe = compileObserver(syntax);
            return observe(emit, this, parameters, beforeChange);
        }
    },

    addRangeAtPathChangeListener: {
        value: function (path, handler, methodName) {
            methodName = methodName || "handleRangeChange";
            function dispatch(plus, minus, index) {
                if (handler[methodName]) {
                    handler[methodName](plus, minus, index);
                } else if (handler.call) {
                    handler.call(null, plus, minus, index);
                } else {
                    throw new Error("Can't dispatch range change to " + handler);
                }
            }
            var minus = [];
            return this.addPathChangeListener(path, function (plus) {
                plus = plus || [];
                dispatch(plus, minus, 0);
                minus = plus;
                return plus.addRangeChangeListener(dispatch);
            });
        }
    },

    // TODO removeRangeAtPathChangeListener
    // TODO add/removeMapAtPathChangeListener

    getPathChangeDescriptors: {
        value: function () {
            if (!pathChangeDescriptors.has(this)) {
                pathChangeDescriptors.set(this, {});
            }
            return pathChangeDescriptors.get(this);
        }
    },

    getPathChangeDescriptor: {
        value: function (path, handler, beforeChange) {
            var descriptors = Montage.getPathChangeDescriptors.call(this);
            if (!Object.owns(descriptors, path)) {
                descriptors[path] = {
                    willChangeListeners: new Map(), // handler to descriptor
                    changeListeners: new Map()
                };
            }

            descriptors = descriptors[path];
            if (beforeChange) {
                descriptors = descriptors.willChangeListeners;
            } else {
                descriptors = descriptors.changeListeners;
            }

            if (!descriptors.has(handler)) {
                descriptors.set(handler, {
                    path: path,
                    handler: handler,
                    beforeChange: beforeChange,
                    cancel: Function.noop
                })
            }

            return descriptors.get(handler);
        }
    },

    addPathChangeListener: {
        value: function (path, handler, methodName, beforeChange) {
            var self = this;

            handler = handler || Function.noop;

            var descriptor = Montage.getPathChangeDescriptor.call(this, path, handler, beforeChange);
            descriptor.cancel();

            var syntax = parse(path);

            var initialValue;
            var initialized;
            var emit;
            if (handler === Function.noop) {
                emit = function (value) {
                    if (initialized) {
                        throw new Error("Path change handler needs a handler because it emits new values when the source changes: " + JSON.stringify(path));
                    } else {
                        initialized = true;
                        initialValue = value;
                    }
                };
            } else if (methodName) {
                emit = function (value) {
                    return handler[methodName].apply(handler, arguments);
                };
            } else if (handler.handlePathChange) {
                emit = function (value) {
                    return handler.handlePathChange.apply(handler, arguments);
                };
            } else if (typeof handler === "function") {
                emit = function (value) {
                    return handler.apply(self, arguments);
                };
            } else {
                throw new Error("Can't recognize handler type: " + handler + ". Must be function or delegate implementing handlePathChange.");
            }

            var observe = compileObserver(syntax);
            var cancel = observe(autoCancelPrevious(emit), this);

            descriptor.cancel = cancel;

            if (initialized) {
                return initialValue;
            } else {
                return cancel;
            }
        }
    },

    removePathChangeListener: {
        value: function (path, handler, beforeChange) {
            handler = handler || Function.noop;
            var descriptorsForObject = Montage.getPathChangeDescriptors.call(this);
            var phase = beforeChange ? "willChangeListeners" : "changeListeners";

            if (!Object.owns(descriptorsForObject, path)) {
                throw new Error("Can't find " + phase + " for " + JSON.stringify(path));
            }
            var descriptorsForPath = descriptorsForObject[path];
            var descriptorsForPhase = descriptorsForPath[phase];
            if (!descriptorsForPhase.has(handler)) {
                throw new Error("Can't find " + phase + " for " + JSON.stringify(path));
            }
            var descriptor = descriptorsForPhase.get(handler);
            descriptor.cancel();
            descriptorsForPhase["delete"](handler);
            if (
                descriptorsForPath.willChangeListeners.length === 0 &&
                descriptorsForPath.changeListeners.length === 0
            ) {
                delete descriptorsForObject[path];
            }
            // if there are no other handlers
            for (var name in descriptorsForObject) {
                return;
            }
            pathChangeDescriptors["delete"](this);
        }
    },

    addBeforePathChangeListener: {
        value: function (path, handler, methodName) {
            return Montage.addPathChangeListener.call(this, path, handler, methodName, true);
        }
    },

    removeBeforePathChangeListener: {
        value: function (path, handler, methodName) {
            return Montage.removePathChangeListener.call(this, path, handler, true);
        }
    }

});

