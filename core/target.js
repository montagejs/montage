var Montage = require("./core").Montage,
    defaultEventManager = require("./event/event-manager").defaultEventManager,
    MutableEvent = require("./event/mutable-event").MutableEvent;

/**
 * A Target is any object that can be a candidate for dispatching and receiving
 * events throughout what is typically considered the "component tree" of a
 * Montage application.
 *
 * @class Target
 * @extends Montage
 */
exports.Target = Montage.specialize( /** @lends Target.prototype */{
    /**
     * Whether or not this target can accept user focus and become the
     * activeTarget This matches up with the `document.activeElement` property
     * purpose-wise; Events from components that should be dispatched as
     * logically occurring at the point of user focus should be dispatched at
     * the activeTarget
     *
     * By default a target does not accept this responsibility.
     *
     * @type {boolean}
     * @default false
     */
    acceptsActiveTarget: {
        serializable: false,
        value: false
    },

    /**
     * Whether or not this is the activeTarget
     *
     * This is a getter and is not bindable. Bind to
     * `defaultEventManager.activeTarget == this`.
     *
     * @type {boolean}
     * @readonly
     */
    isActiveTarget: {
        get: function () {
            return this === defaultEventManager.activeTarget;
        }
    },

    /**
     * Called prior to this target becoming the activeTarget
     * @function
     * @param {Target} oldTarget the current activeTarget
     */
    willBecomeActiveTarget: {
        value: Function.noop
    },

    /**
     * Called after to this target became the activeTarget
     * @function
     */
    didBecomeActiveTarget: {
        value: Function.noop
    },

    /**
     * Ask this target to surrender its activeTarget status.
     * @function
     * @param {Target} newTarget the Target that is about to become the
     * `activeTarget`
     * @returns {boolean} Whether or not to surrender activeTarget status
     */
    surrendersActiveTarget: {
        value: function (newTarget) {
            return true;
        }
    },

    /**
     * Which target to distribute an event after this when distributing events
     * throughout a graph of targets.
     * @property {boolean} serializable
     * @property {Component} value
     */
    nextTarget: {
        serializable: false,
        value: null
    },

    /**
     * Dispatches the specified event with this target
     * as the event's proximal target
     * @function
     * @param {Event} event The event object to dispatch
     */
    dispatchEvent: {
        value: function (event) {
            var targettedEvent = event;

            if (! (event instanceof MutableEvent)) {
                targettedEvent = MutableEvent.fromEvent(targettedEvent);
            }

            targettedEvent.target = this;
            defaultEventManager.handleEvent(targettedEvent);

            return !event.defaultPrevented;
        }
    },

    /**
     * Creates and dispatches an event with the specified properties with this
     * target as the event's proximal target
     * @function
     * @param {string} type The type of the event to dispatch
     * @param {boolean} canBubble Whether or not the event can bubble
     * @param {boolean} cancelable Whether or not the event can be cancelled
     * @param {Object} detail The optional detail object of the event
     */
    dispatchEventNamed: {
        value: function (type, canBubble, cancelable, detail) {
            var event = MutableEvent.fromType(type, canBubble, cancelable, detail);
            event.target = this;
            defaultEventManager.handleEvent(event);

            return !event.defaultPrevented;
        }
    },

    /**
     * Adds an event listener to the object.
     * @function
     * @param {string} type The event type to listen for.
     * @param {object | function} listener The listener object or function.
     * @param {boolean} useCapture Specifies whether to listen for the event during the bubble or capture phases.
     */
    addEventListener: {
        value: function addEventListener(type, listener, useCapture) {
            if (listener) {
                defaultEventManager.registerEventListener(this, type, listener, useCapture);
            }
        }
    },

    /**
     * Removes an event listener from the object.
     * @function
     * @param {string} type The event type.
     * @param {object | function} listener The listener object or function.
     * @param {boolean} useCapture The phase of the event listener.
     */
    removeEventListener: {
        value: function removeEventListener(type, listener, useCapture) {
            if (listener) {
                defaultEventManager.unregisterEventListener(this, type, listener, useCapture);
            }
        }
    },

    /**
     * Load a Composer
     * @function
     * @param {Composer} composer
     */
    loadComposer: {
        value: function (composer) {
            if (composer && !composer._isLoaded) {
                composer._resolveDefaults();
                composer.load();
                composer._isLoaded = true;
            }
        }
    },

    /**
     * Unload a Composer
     * @function
     * @param {Composer} composer
     */
    unloadComposer: {
        value: function (composer) {
            if (composer && composer._isLoaded) {
                composer.unload();
                composer._isLoaded = false;
            }
        }
    }

});

