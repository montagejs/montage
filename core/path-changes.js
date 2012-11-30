
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
        value: function (path, listener, beforeChange) {
            var descriptors = this.getPathChangeDescriptors();
            if (!Object.owns(descriptors, path)) {
                descriptors[path] = {
                    willChangeListeners: new Map(), // listener to descriptor
                    changeListeners: new Map()
                };
            }

            descriptors = descriptors[path];
            if (beforeChange) {
                descriptors = descriptors.willChangeListeners;
            } else {
                descriptors = descriptors.changeListeners;
            }

            if (!descriptors.has(listener)) {
                descriptors.set(listener, {
                    path: path,
                    listener: listener,
                    beforeChange: beforeChange,
                    cancel: Function.noop
                })
            }

            return descriptors.get(listener);
        },
        writable: true,
        configurable: true,
        enumerable: false
    },

    addPathChangeListener: {
        value: function (path, listener, token, beforeChange) {
            var self = this;

            listener = listener || Function.noop;

            var descriptor = this.getPathChangeDescriptor(path, listener, beforeChange);
            descriptor.cancel();

            var syntax = parse(path);

            var initialValue;
            var initialized;
            var emit;
            var handleTokenChange = token ? 'handle' + token.toCapitalized() + 'Change' : '';
            if (listener === Function.noop) {
                emit = function (value) {
                    if (initialized) {
                        throw new Error("Path change listener needs a handler because it emits new values when the source changes: " + JSON.stringify(path));
                    } else {
                        initialized = true;
                        initialValue = value;
                    }
                };
            } else if (token && listener[handleTokenChange]) {
                emit = function (value) {
                    return listener[handleTokenChange].apply(listener, arguments);
                };
            } else if (listener.handlePathChange) {
                emit = function (value) {
                    return listener.handlePathChange.apply(listener, arguments);
                };
            } else if (typeof listener === "function") {
                emit = function (value) {
                    return listener.apply(self, arguments);
                };
            } else {
                throw new Error("Can't recognize listener type: " + listener + ". Must be function or delegate implementing handlePathChange or handle{Token}Change.");
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
        value: function (path, listener, beforeChange) {
            listener = listener || Function.noop;
            var descriptorsForObject = this.getPathChangeDescriptors();
            var phase = beforeChange ? "willChangeListeners" : "changeListeners";

            if (!Object.owns(descriptorsForObject, path)) {
                throw new Error("Can't find " + phase + " for " + JSON.stringify(path));
            }
            var descriptorsForPath = descriptorsForObject[path];
            var descriptorsForPhase = descriptorsForPath[phase];
            if (!descriptorsForPhase.has(listener)) {
                throw new Error("Can't find " + phase + " for " + JSON.stringify(path));
            }
            var descriptor = descriptorsForPhase.get(listener);
            descriptor.cancel();
            descriptorsForPhase["delete"](listener);
            if (
                descriptorsForPath.willChangeListeners.length === 0 &&
                descriptorsForPath.changeListeners.length === 0
            ) {
                delete descriptorsForObject[path];
            }
            // if there are no other listeners
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
        value: function (path, listener, token) {
            return this.addPathChangeListener(path, listener, token, true);
        },
        writable: true,
        configurable: true,
        enumerable: false
    },

    removeBeforePathChangeListener: {
        value: function (path, listener) {
            return this.removePathChangeListener(path, listener, true);
        }
    }

});

