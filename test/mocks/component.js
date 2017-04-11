var Set = require("montage/collections/set"),
    Event = require("mocks/event"),
    Component = require("montage/ui/component").Component,
    defaultEventManager = require("montage/core/event/event-manager").defaultEventManager;

exports.component = function () {
    var eventListeners = {};

    return {
        classList: {
            add: function (className) {
                this.__classList__.add.apply(this.__classList__, arguments);
            },
            remove: function (className) {
                this.__classList__.remove.apply(this.__classList__, arguments);
            },
            toggle: function (className) {
                if(this.__classList__.has(className)) {
                    this.__classList__.remove(className);
                } else {
                    this.__classList__.add(className);
                }
            },
            contains: function (className) {
                return this.__classList__.has(className);
            }
        },
        __classList__: new Set(),
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
        dispatchEvent: function (event) {
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
            return !!(eventListeners[eventType] &&
                      eventListeners[eventType].indexOf(listener) >= 0);
        },
        childComponents: [],
        addChildComponent: Component.prototype.addChildComponent,
        removeChildComponent: Function.noop,
        _addToDrawList: function () {}
    };
};

exports.rootComponent = function (_document) {
    var component = exports.component();

    defaultEventManager.registerEventHandlerForElement(component, _document);
    component.element = _document;
    component.drawTree = function () {};
    component.rootComponent = component;
    component.isComponentWaitingNeedsDraw = function () { return false; }

    return component;
};
