var Event = require("mocks/event");

exports.mediaController = function () {
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
        hasEventListener: function(eventType, listener) {
            return !!(eventListeners[eventType] &&
                      eventListeners[eventType].indexOf(listener) >= 0);
        },
        play: function() {},
        pause: function() {},
        unpause: function() {},
        defaultPlaybackRate: 1,
        playbackRate: 1,
        playbackState: "waiting",
        currentTime: 0,
        duration: 0,
        volume: 1,
        muted: false,
        paused: false
    };
}
