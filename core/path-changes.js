
var WeakMap = require("collections/weak-map");
var Map = require("collections/map");

var parse = require("frb/parse");
var compileObserver = require("frb/compile-observer");
var autoCancelPrevious = require("frb/observers").autoCancelPrevious;

var pathChangeDescriptors = new WeakMap();

Object.defineProperties(Object.prototype, {

    getPathChangeDescriptors: {
        value: function () {
            if (!pathChangeDescriptors.has(this)) {
                pathChangeDescriptors.set(this, {});
            }
            return pathChangeDescriptors.get(this);
        },
        writable: true,
        configurable: true,
        enumerable: false
    },

    getPathChangeDescriptor: {
        value: function (path, handler, beforeChange) {
            var descriptors = this.getPathChangeDescriptors();
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
        },
        writable: true,
        configurable: true,
        enumerable: false
    },

    addPathChangeListener: {
        value: function (path, handler, methodName, beforeChange) {
            var self = this;

            handler = handler || Function.noop;

            var descriptor = this.getPathChangeDescriptor(path, handler, beforeChange);
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
        },
        writable: true,
        configurable: true,
        enumerable: false
    },

    removePathChangeListener: {
        value: function (path, handler, beforeChange) {
            handler = handler || Function.noop;
            var descriptorsForObject = this.getPathChangeDescriptors();
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
        },
        writable: true,
        configurable: true,
        enumerable: false
    },

    addBeforePathChangeListener: {
        value: function (path, handler, methodName) {
            return this.addPathChangeListener(path, handler, methodName, true);
        },
        writable: true,
        configurable: true,
        enumerable: false
    },

    removeBeforePathChangeListener: {
        value: function (path, handler, methodName) {
            return this.removePathChangeListener(path, handler, true);
        }
    }

});

