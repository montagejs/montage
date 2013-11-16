
/**
 * Patches [Montage]{@link Montage#} with methods pertaining to FRB “path”
 * expressions.
 * @module
 */

var Montage = require("core/core").Montage;
var WeakMap = require("collections/weak-map");
var Map = require("collections/map");

var parse = require("frb/parse");
var evaluate = require("frb/evaluate");
var assign = require("frb/assign");
var observe = require("frb/observe");
var bind = require("frb/bind");
var compileObserver = require("frb/compile-observer");
var Scope = require("frb/scope");
var Observers = require("frb/observers");
var autoCancelPrevious = Observers.autoCancelPrevious;

var pathChangeDescriptors = new WeakMap();

var pathPropertyDescriptors = { /** @lends Montage# */

    /**
     * Evaluates an FRB expression on this object
     * @method
     * @param {string} path an FRB expression
     * @return the result of the query
     */
    getPath: {
        value: function (path, parameters, document, components) {
            return evaluate(
                path,
                this,
                parameters || this,
                document,
                components
            );
        }
    },

    /**
     * Assigns a value to the FRB expression from this object.  Not all
     * expressions can be assigned to.  Property chains will work, but will
     * silently fail if the target object does not exist.
     * @method
     * @param {string} path an FRB expression designating the value to replace
     * @param value the new value
     */
    setPath: {
        value: function (path, value, parameters, document, components) {
            return assign(
                this,
                path,
                value,
                parameters || this,
                document,
                components
            );
        }
    },

    /**
     * Observes changes to the value of an FRB expression.  The content of the
     * emitted value may react to changes, particularly if it is an array.
     * @method
     * @param {string} path an FRB expression
     * @param {function} emit a function that receives new values in response
     * to changes.  The emitter may return a `cancel` function if it manages
     * event listeners that must be collected when the value changes.
     * @return {function} a canceler function that will remove all involved
     * change listeners, prevent new values from being observed, and prevent
     * previously emitted values from reacting to any further changes.
     */
    observePath: {
        value: function (path, emit) {
            var syntax = parse(path);
            var observe = compileObserver(syntax);
            return observe(autoCancelPrevious(emit), new Scope(this));
        }
    },

    /**
     * Observes changes to the content of the value for an FRB expression.
     * The handler will receive “ranged content change” messages.  When a
     * change listener is added, the handler will be immediately invoked with
     * the initial content added at index 0 for the expression.
     * @method
     * @param {string} path an FRB expression that produces content changes
     * @param handler a function that accepts `plus`, `minus`, and `index`
     * arguments, or a handler object with a designated method by that
     * signature.  `plus` and `minus` are arrays of values that were added
     * or removed.  `index` is the offset at which the `minus` was removed,
     * then the `plus` was added.
     * @param {?string} methodName the name of the method on the handler object
     * that should receive change messages.
     */
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
                if (plus && plus.toArray && plus.addRangeChangeListener) {
                    // Give copies to avoid modification by the listener.
                    dispatch(plus.toArray(), minus.toArray(), 0);
                    minus = plus;
                    return plus.addRangeChangeListener(dispatch);
                } else {
                    plus = [];
                    dispatch(plus, minus, 0);
                    minus = plus;
                }
            });
        }
    },

    // TODO removeRangeAtPathChangeListener
    // TODO add/removeMapAtPathChangeListener

    /**
     * @method
     */
    getPathChangeDescriptors: {
        value: function () {
            if (!pathChangeDescriptors.has(this)) {
                pathChangeDescriptors.set(this, {});
            }
            return pathChangeDescriptors.get(this);
        }
    },

    /**
     * @method
     * @param {string} path an FRB expression
     * @param handler a function that will receive a value change notification,
     * or an object with a method that will receive the change notifications
     */
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

    /**
     * @method
     */
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
                    return handler[methodName].call(handler, value, path, self);
                };
            } else if (handler.handlePathChange) {
                emit = function (value) {
                    return handler.handlePathChange.call(handler, value, path, self);
                };
            } else if (typeof handler === "function") {
                emit = function (value) {
                    return handler.call(self, value, path, self);
                };
            } else {
                throw new Error("Can't recognize handler type: " + handler + ". Must be function or delegate implementing handlePathChange.");
            }

            var observe = compileObserver(syntax);
            var cancel = observe(autoCancelPrevious(emit), new Scope(this));

            descriptor.cancel = cancel;

            if (initialized) {
                return initialValue;
            } else {
                return cancel;
            }
        }
    },

    /**
     * @method
     */
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

    /**
     * @method
     */
    addBeforePathChangeListener: {
        value: function (path, handler, methodName) {
            return Montage.addPathChangeListener.call(this, path, handler, methodName, true);
        }
    },

    /**
     * @method
     */
    removeBeforePathChangeListener: {
        value: function (path, handler, methodName) {
            return Montage.removePathChangeListener.call(this, path, handler, true);
        }
    }

};
Montage.defineProperties(Montage, pathPropertyDescriptors);
Montage.defineProperties(Montage.prototype, pathPropertyDescriptors);
