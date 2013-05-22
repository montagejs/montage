var Set = require("montage/collections/set"),
    defaultKeyManager = require("montage/core/event/key-manager").defaultKeyManager,
    Event = require("mocks/event");

exports.element = function (_document) {
    var eventListeners = {},
        classList = new Set();

    return {
        classList: {
            add: function (className) {
                classList.add.apply(classList, arguments);
            },
            remove: function (className) {
                classList.remove.apply(classList, arguments);
            },
            toggle: function (className) {
                if(classList.has(className)) {
                    classList.remove(className);
                } else {
                    classList.add(className);
                }
            },
            contains: function (className) {
                return classList.has(className);
            }
        },
        className: "",
        style: {},
        removeAttribute: function () {},
        __attributes__: {},
        setAttribute: function (attribute, value) {
            this.__attributes__[attribute] = value;
        },
        getAttribute: function (attribute) {
            return this.__attributes__[attribute] || "";
        },
        hasAttribute: function (attribute) {
            return attribute in this.__attributes__;
        },
        childNodes: [],
        appendChild: function(child) {
            if (child.parentNode) {
                child.parentNode.removeChild(child);
            }
            this.childNodes.push(child);
            child.parentNode = this;
        },
        removeChild: function(child) {
            var ix = this.childNodes.indexOf(child);

            if (ix >= 0) {
                this.childNodes.splice(ix, 1);
            } else {
                throw new Error("DOM: child not found");
            }
            child.parentNode = null;
        },
        contains: function(child) {
            do {
                if (child === this) {
                    return true;
                }
            } while (child = /* assignment */ child.parentNode);

            return false;
        },
        focus: function () {},
        blur: function () {},
        addEventListener: function (eventType, listener, useCapture) {
            if (typeof listener !== "function" && typeof listener !== "object") {
                throw new Error("Missing listener");
            }

            if (!eventListeners[eventType]) {
                eventListeners[eventType] = [];
            }

            eventListeners[eventType].push(listener);
        },
        removeEventListener: function () {},
        dispatchEvent: function(event) {
            var type = event.type,
                listeners,
                names,
                typedEvent;

            if (eventListeners[type]) {
                listeners = eventListeners[type];

                // Clone the event so we can set a target on it.
                typedEvent = event instanceof Event.MockEvent ? event : Event.fromEvent(event);
                typedEvent.target = this;
                typedEvent.currentTarget = this;

                for (var i = 0, listener; listener = listeners[i]; i++) {
                    if (typeof listener === "function") {
                        listener(typedEvent);
                    } else {
                        names = ["handle" + type[0].toUpperCase() + type.slice(1),
                            "handleEvent"];

                        for (var j = 0, name; name = names[j]; j++) {
                            if (typeof listener[name] === "function") {
                                listener[name](typedEvent);
                                break;
                            }
                        }
                    }
                }
            }
        },
        hasEventListener: function(eventType, listener) {
            return !!(eventListeners[eventType] &&
                      eventListeners[eventType].indexOf(listener) >= 0);
        },
        ownerDocument: _document || exports.document(),
        tagName: "MOCK"
    };
};

exports.window = function () {
    var eventListeners = {};

    return {
        addEventListener: function (eventType, listener, useCapture) {
            if (typeof listener !== "function" && typeof listener !== "object") {
                throw new Error("Missing listener");
            }

            if (!eventListeners[eventType]) {
                eventListeners[eventType] = [];
            }

            eventListeners[eventType].push(listener);
        },
        removeEventListener: function () {},
        dispatchEvent: function(event) {
            var type = event.type,
                listeners,
                names,
                typedEvent;

            if (eventListeners[type]) {
                listeners = eventListeners[type];

                // Clone the event so we can set a target on it.
                typedEvent = event instanceof Event.MockEvent ? event : Event.fromEvent(event);
                typedEvent.target = this;
                typedEvent.currentTarget = this;

                for (var i = 0, listener; listener = listeners[i]; i++) {
                    if (typeof listener === "function") {
                        listener(typedEvent);
                    } else {
                        names = ["handle" + type[0].toUpperCase() + type.slice(1),
                            "handleEvent"];

                        for (var j = 0, name; name = names[j]; j++) {
                            if (typeof listener[name] === "function") {
                                listener[name](typedEvent);
                                break;
                            }
                        }
                    }
                }
            }
        },
        hasEventListener: function(eventType, listener) {
            return !!(eventListeners[eventType] &&
                eventListeners[eventType].indexOf(listener) >= 0);
        }
    }
};

exports.document = function() {
    var result = {
        defaultView: exports.window(),
        body: null
    };

    result.body = exports.element(result);

    return result;
};

exports.keyPressEvent = function(keys, target) {
    var modifiersAndKeyCode =
        defaultKeyManager._convertKeysToModifiersAndKeyCode(
            defaultKeyManager._normalizeKeySequence(keys)
        );

    var MODIFIERS = {
        metaKey: 1,
        altKey: 2,
        ctrlKey: 4,
        shiftKey: 8
    };

    var event = document.createEvent("KeyboardEvent");
    event.initKeyboardEvent("keypress", true, true, window,
        0, 0, 0, 0,
        0, modifiersAndKeyCode.keyCode);

    // Clone the event so we can set a target and modifiers on it.
    var customEvent = {};
    for (var key in event) {
        customEvent[key] = event[key];
    }
    customEvent.charCode = modifiersAndKeyCode.keyCode;
    customEvent.target = target;

    for (var key in MODIFIERS) {
        if (modifiersAndKeyCode.modifiers & MODIFIERS[key]) {
            customEvent[key] = true;
        }
    }

    return customEvent;
};
