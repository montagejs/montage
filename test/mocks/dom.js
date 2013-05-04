Set = require("montage/collections/set");

exports.element = function () {
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
                typedEvent = {};
                for (var key in event) {
                    typedEvent[key] = event[key];
                }
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
        tagName: "MOCK"
    };
}
