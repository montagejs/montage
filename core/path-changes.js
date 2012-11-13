
var Montage = require("core/core").Montage;
var WeakMap = require("collections/weak-map");
var Map = require("collections/map");

var parse = require("frb/parse");
var compileObserver = require("frb/compile-observer");
var autoCancelPrevious = require("frb/observers").autoCancelPrevious;

var pathChangeDescriptors = new WeakMap();

Montage.getPathChangeDescriptors = function () {
    if (!pathChangeDescriptors.has(this)) {
        pathChangeDescriptors.set(this, {});
    }
    return pathChangeDescriptors.get(this);
};

Montage.getPathChangeDescriptor = function (path, listener, beforeChange) {
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
};

Montage.addPathChangeListener = function (path, listener, token, beforeChange) {
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

    return initialValue; // or undefined if a handler was specified
};

Montage.removePathChangeListener = function (path, listener, beforeChange) {
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
};

Montage.addBeforePathChangeListener = function (path, listener, token) {
    return this.addPathChangeListener(path, listener, token, true);
};

Montage.removeBeforePathChangeListener = function (path, listener) {
    return this.removePathChangeListener(path, listener, true);
};

