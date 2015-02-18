var Set = require("montage/collections/set"),
    defaultKeyManager = require("montage/core/event/key-manager").defaultKeyManager,
    Event = require("mocks/event"),
    Component = require("mocks/component");

var EventTarget = {
    addEventListener: function (eventType, listener, useCapture) {
        if (typeof listener !== "function" && typeof listener !== "object") {
            throw new Error("Missing listener");
        }

        if (!this._eventListeners[eventType]) {
            this._eventListeners[eventType] = [];
        }

        this._eventListeners[eventType].push(listener);
    },
    removeEventListener: function (eventType, listener, useCapture) {
        var listeners = this._eventListeners[eventType];
        if (!listeners) {
            return;
        }
        var listenerIndex = listeners.indexOf(listener);
        if (listenerIndex === -1) {
            return;
        }
        listeners.splice(listenerIndex, 1);
    },
    dispatchEvent: function (event) {
        var type = event.type,
            listeners,
            names,
            typedEvent;

        if (this._eventListeners[type]) {
            listeners = this._eventListeners[type];

            // Clone the event so we can set a target on it.
            typedEvent = event instanceof Event.MockEvent ? event : Event.fromEvent(event);
            typedEvent.target = this;
            typedEvent.currentTarget = this;

            for (var i = 0, listener; listener = listeners[i]; i++) {
                if (typeof listener === "function" && !listener.__isConstructor__) {
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
    hasEventListener: function (eventType, listener) {
        return !!(this._eventListeners[eventType] &&
                  this._eventListeners[eventType].indexOf(listener) >= 0);
    }
};

exports.element = function (_document) {
    var classList = new Set();

    var result = {
        _eventListeners: {},
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
            },
            forEach: function () {
                return classList.forEach.apply(classList, arguments);
            }
        },
        className: "",
        style: {},
        removeAttribute: function (attribute) {
            delete this.__attributes__[attribute];
        },
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
        appendChild: function (child) {
            if (child.parentNode) {
                child.parentNode.removeChild(child);
            }
            this.childNodes.push(child);
            child.parentNode = this;
        },
        removeChild: function (child) {
            var ix = this.childNodes.indexOf(child);

            if (ix >= 0) {
                this.childNodes.splice(ix, 1);
            } else {
                throw new Error("DOM: child not found");
            }
            child.parentNode = null;
        },
        contains: function (child) {
            do {
                if (child === this) {
                    return true;
                }
            } while (child = /* assignment */ child.parentNode);

            return false;
        },
        getElementsByTagName: function (tagName) {
            var elements = [];
            for (var i=0;i<this.childNodes.length;i++) {
                if (this.childNodes[i].tagName.toUpperCase() === tagName.toUpperCase()) {
                    elements.push(this.childNodes[i]);
                }
            }
            return elements;
        },
        focus: function () {},
        blur: function () {},
        ownerDocument: _document || exports.document(),
        tagName: "MOCK"
    };
    Object.addEach(result, EventTarget);

    Object.defineProperty(result.classList, 'length', {
        get: function () {
            return classList.length;
        }
    });

    return result;
};

exports.window = function () {
    var eventListeners = {};

    var result = {
        _eventListeners: {}
    };
    Object.addEach(result, EventTarget);

    return result;
};

exports.document = function () {
    var result = {
        defaultView: exports.window(),
        body: null,
        _eventListeners: {},
        createElement: function (tagName) {
            return exports.element(this);
        }
    };
    Object.addEach(result, EventTarget);

    result.body = exports.element(result);
    // configure html element
    result.body.parentNode = exports.element(result);
    result.body.parentNode.parentNode = result;

    result.rootComponent = Component.rootComponent(result);

    return result;
};

exports.keyPressEvent = function (keys, target) {
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

    var event = document.createEvent("KeyboardEvent"),
        args = [
            "keypress", // DOMString typeArg
            true, // Boolean canBubbleArg
            true, // Boolean cancelableArg
            window // nsIDOMAbstractView viewArg
        ];

    if (typeof event.initKeyboardEvent === "function") {
        event.initKeyboardEvent.apply(event, args.concat(
            0, // long detailArg
            'Enter', // DOMString keyArg
            0, // unsigned long locationArg
            '', //  DOMString modifiersListArg
            false // boolean repeat
        ));

    } else if (typeof event.initKeyEvent === "function") {
        event.initKeyEvent.apply(event, args.concat(
            false, // boolean ctrlKeyArg
            false, // boolean altKeyArg
            false, // boolean shiftKeyArg
            false, // boolean metaKeyArg
            modifiersAndKeyCode.keyCode, // unsigned long keyCodeArg
            modifiersAndKeyCode.keyCode // unsigned long charCodeArg
        ));
    }

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
