var Montage = require("montage").Montage,
    defaultEventManager = require("core/event/event-manager").defaultEventManager,
    MutableEvent = require("core/event/mutable-event").MutableEvent;

/**
 * A Target is any object that can be a candidate for dispatching and receiving events
 * throughout what is typically considered the "component tree" of a Montage application.
 *
 * @type {Target}
 */
exports.Target = Montage.create(Montage, {

    /**
     * Whether or not this target can accept user focus and become the activeTarget
     * This matches up with the <code>document.activeElement</code> property purpose-wise;
     * Events from components that should be dispatched as logically occurring at the point
     * of user focus should be dispatched at the activeTarget
     *
     * By default a target does not accept this responsibility.
     */
    acceptsFocus: {
        value: false
    },

    /**
     * Whether or not this is the activeTarget
     */
    isActiveTarget: {
        get: function () {
            return this === defaultEventManager.activeTarget;
        }
    },

    /**
     * Which target to distribute an event after this when distributing events throughout a
     * graph of targets.
     */
    nextTarget: {
        value: null
    },

    dispatchEvent: {
        value: function(event) {
            var targettedEvent = event;

            if (!MutableEvent.isPrototypeOf(event)) {
                targettedEvent = MutableEvent.fromEvent(event);
            }

            targettedEvent.target = this;
            defaultEventManager.handleEvent(targettedEvent);
        }
    },

    dispatchEventNamed: {
        value: function(type, canBubble, cancelable, detail) {
            var event = MutableEvent.fromType(type, canBubble, cancelable, detail);
            event.target = this;
            defaultEventManager.handleEvent(event);
        }
    },

    /**
     * Dispatches the specified event with the activeTarget as the event's proximal target
     * @param {Event} event The event object to dispatch
     */
    dispatchFocusedEvent: {
        value: function (event) {
            defaultEventManager.activeTarget.dispatchEvent(event);
        }
    },

    /**
     * Creates and dispatches an event with the specified properties
     * @param {string} type The type of the event to dispatch
     * @param {boolean} canBubble Whether or not the event can bubble
     * @param {boolean} cancelable Whether or not the event can be cancelled
     * @param {Object} detail The optional detail object of the event
     */
    dispatchFocusedEventNamed: {
        value: function (type, canBubble, cancelable, detail) {
            defaultEventManager.activeTarget.dispatchEventNamed(type, canBubble, cancelable, detail);
        }
    }
});
