/*global require, exports*/

/**
 * @module montage/composer/press-composer
 * @requires montage/core/core
 * @requires montage/composer/composer
 * @requires montage/core/event/mutable-event
 */
var Montage = require("../core/core").Montage,
    Composer = require("./composer").Composer,
    MutableEvent = require("../core/event/mutable-event").MutableEvent;

/**
 * @class PressComposer
 * @classdesc The `PressComposer` abstracts away handling mouse and touch
 * events that represent presses, allowing generic detection of presses, long
 * presses, and cancelled presses.
 *
 * @extends Composer
 * @fires pressStart
 * @fires press
 * @fires longPress
 * @fires pressCancel
 */
var PressComposer = exports.PressComposer = Composer.specialize(/** @lends PressComposer.prototype # */ {

    /**
     * Dispatched when a press begins. It is ended by either a {@link press} or
     * {@link pressCancel} event.
     *
     * @event pressStart
     * @memberof PressComposer
     * @param {PressEvent} event
     */

    /**
     * Dispatched when a press is complete.
     *
     * @event press
     * @memberof PressComposer
     * @param {PressEvent} event
     */

    /**
     * Dispatched when a press lasts for longer than (@link longPressThreshold}
     * On a long press, the sequence of events will be:
     * - pressStart: as soon as the composer recognizes it is a press.
     * - longPress: `longPressThreshold` after the pressStart, if the press has
     *   not yet ended.
     * - press: when the press ends, if it isn't cancelled.
     *
     * Handlers of the `longPress` event can call `cancelPress` to prevent
     * `press` being triggered.
     *
     * @event longPress
     * @memberof PressComposer
     * @param {PressEvent} event
     */

    /**
     * Dispatched when a press is canceled. This could be because the pointer
     * left the element, was claimed by another component or maybe a phone call
     * came in.
     *
     * @event pressCancel
     * @memberof PressComposer
     * @param {PressEvent} event
     */

    // Load/unload

    load: {
        value: function () {
            //todo: add support pointer events
            this._element.addEventListener("touchstart", this, false);
            this._element.addEventListener("mousedown", this, false);
        }
    },

    unload: {
        value: function () {
            //todo: add support pointer events
            this._element.removeEventListener("touchstart", this, false);
            this._element.removeEventListener("mousedown", this, false);
        }
    },

    /**
     * Delegate that implements `surrenderPointer`. See Component for
     * explanation of what this method should do.
     *
     * @type {Object}
     * @default null
     */
    delegate: {
        value: null
    },


    /**
     * Cancel the current press.
     *
     * Can be used in a "longPress" event handler to prevent the "press" event
     * being fired.
     * @returns boolean true if a press was canceled, false if the composer was
     * already in a unpressed or canceled state.
     */
    cancelPress: {
        value: function () {
            if (this._state === PressComposer.PRESSED) {
                this._dispatchPressCancel();
                this._endInteraction();
                return true;
            }
            return false;
        }
    },

    // Optimisation so that we don't set a timeout if we do not need to
    addEventListener: {
        value: function (type, listener, useCapture) {
            Composer.addEventListener.call(this, type, listener, useCapture);
            if (type === "longPress") {
                this._shouldDispatchLongPress = true;
            }
        }
    },

    UNPRESSED: {
        value: 0
    },
    PRESSED: {
        value: 1
    },
    CANCELLED: {
        value: 2
    },

    _state: {
        value: 0
    },
    state: {
        get: function () {
            return this._state;
        }
    },

    _shouldDispatchLongPress: {
        value: false
    },

    _longPressThreshold: {
        value: 1000
    },

    /**
     * How long a press has to last (in milliseconds) for a longPress event to
     * be dispatched
     * @type number
     */
    longPressThreshold: {
        get: function () {
            return this._longPressThreshold;
        },
        set: function (value) {
            if (this._longPressThreshold !== value) {
                this._longPressThreshold = value;
            }
        }
    },

    _longPressTimeout: {
        value: null
    },

    // Magic

    _observedPointer: {
        value: null
    },

    /**
     * Remove event listeners after an interaction has finished.
     * @private
     */
    _endInteraction: {
        value: function () {
            document.removeEventListener("touchend", this);
            document.removeEventListener("touchcancel", this);
            document.removeEventListener("mouseup", this);

            this._element.removeEventListener("dragstart", this, false);

            if (this.component.eventManager.isPointerClaimedByComponent(this._observedPointer, this)) {
                this.component.eventManager.forfeitPointer(this._observedPointer, this);
            }

            this._observedPointer = null;
            this._state = PressComposer.UNPRESSED;
        }
    },

    /**
     * Checks if we are observing one of the changed touches. Returns the index
     * of the changed touch if one matches, otherwise returns false. Make sure
     * to check against `!== false` or `=== false` as the
     * matching index might be 0.
     *
     * @function
     * @returns {number|boolean} The index of the matching touch, or false
     * @private
     */
    _changedTouchisObserved: {
        value: function (changedTouches) {
            if (this._observedPointer === null) {
                return false;
            }

            var i = 0, changedTouchCount = changedTouches.length;

            for (; i < changedTouchCount; i++) {
                if (changedTouches[i].identifier === this._observedPointer) {
                    return i;
                }
            }
            return false;
        }
    },

    // Surrender pointer

    surrenderPointer: {
        value: function (pointer, component) {
            var shouldSurrender = this.callDelegateMethod("surrenderPointer", pointer, component);
            if (typeof shouldSurrender !== "undefined" && shouldSurrender === false) {
                return false;
            }

            this._dispatchPressCancel();
            return true;
        }
    },

    _shouldPerformPress: {
        value: function () {
            return !(("enabled" in this.component && !this.component.enabled) || this._observedPointer !== null);
        }
    },

    // Handlers

    handleTouchstart: {
        value: function (event) {
            if (this._shouldPerformPress()) {
                if (event.changedTouches.length === 1) {
                    this._observedPointer = event.changedTouches[0].identifier;
                    this.component.eventManager.claimPointer(this._observedPointer, this);
                }

                if (this._observedPointer !== null && this.component.eventManager.isPointerClaimedByComponent(this._observedPointer, this)) {
                    document.addEventListener("touchend", this, false);
                    document.addEventListener("touchcancel", this, false);

                    this._dispatchPressStart(event);

                } else {
                    this._observedPointer = null;
                }
            }
        }
    },

    handleTouchend: {
        value: function (event) {
            if (this._observedPointer === null) {
                this._endInteraction(event);
                return;
            }

            if (this._changedTouchisObserved(event.changedTouches) !== false) {
                if (this.component.eventManager.isPointerClaimedByComponent(this._observedPointer, this)) {
                    this._dispatchPress(event);
                }

                this._endInteraction(event);
            }
        }
    },

    handleTouchcancel: {
        value: function (event) {
            if (this._observedPointer === null || this._changedTouchisObserved(event.changedTouches) !== false) {
                if (this.component.eventManager.isPointerClaimedByComponent(this._observedPointer, this)) {
                    this._dispatchPressCancel(event);
                }

                this._endInteraction(event);
            }
        }
    },

    handleMousedown: {
        value: function (event) {
            if (event.button === 0 && this._shouldPerformPress()) {
                this._observedPointer = "mouse";
                this.component.eventManager.claimPointer(this._observedPointer, this);

                if (this.component.eventManager.isPointerClaimedByComponent(this._observedPointer, this)) {
                    // Needed to cancel the press if mouseup'd when not on the component
                    document.addEventListener("mouseup", this, false);

                    document.addEventListener("touchend", this, false);

                    // Needed to cancel the press because once a drag is started
                    // no mouse events are fired
                    // http://www.whatwg.org/specs/web-apps/current-work/multipage/dnd.html#initiate-the-drag-and-drop-operation
                    this._element.addEventListener("dragstart", this, false);

                    this._dispatchPressStart(event);
                } else{
                    this._observedPointer = null;
                }
            }
        }
    },

    handleMouseup: {
        value: function (event) {
            if (this._observedPointer === null) {
                this._endInteraction(event);
                return;
            }

            var target = event.target;

            if (this.component.eventManager.isPointerClaimedByComponent(this._observedPointer, this)) {
                while (target !== this._element && target && target.parentNode) {
                    target = target.parentNode;
                }

                if (target === this._element) {
                    this._dispatchPress(event);
                    this._endInteraction(event);

                } else {
                    this._endInteraction(event);
                }
            } else{
                this._dispatchPressCancel(event);
                this._endInteraction(event);
            }
        }
    },

    handleDragstart: {
        value: function (event) {
            this._dispatchPressCancel(event);
            this._endInteraction();
        }
    },

    // Event dispatch

    _createPressEvent: {
        enumerable: false,
        value: function (name, event) {
            var pressEvent, detail, index;

            if (!event) {
                event = document.createEvent("CustomEvent");
                event.initCustomEvent(name, true, true, null);
            }

            pressEvent = new PressEvent();
            pressEvent.event = event;
            pressEvent.type = name;
            pressEvent.pointer = this._observedPointer;
            pressEvent.targetElement = event.target;

            if (event.changedTouches && (index = this._changedTouchisObserved(event.changedTouches)) !== false) {
                pressEvent.touch = event.changedTouches[index];
            }

            return pressEvent;
        }
    },

    _dispatchPressStart: {
        enumerable: false,
        value: function (event) {
            this._state = PressComposer.PRESSED;
            this.dispatchEvent(this._createPressEvent("pressStart", event));

            if (this._shouldDispatchLongPress) {
                var self = this;

                this._longPressTimeout = setTimeout(function () {
                    self._dispatchLongPress();
                }, this._longPressThreshold);
            }
        }
    },

    _dispatchPress: {
        enumerable: false,
        value: function (event) {
            if (this._shouldDispatchLongPress) {
                clearTimeout(this._longPressTimeout);
                this._longPressTimeout = null;
            }

            this.dispatchEvent(this._createPressEvent("press", event));
            this._state = PressComposer.UNPRESSED;
        }
    },

    _dispatchLongPress: {
        enumerable: false,
        value: function (event) {
            if (this._shouldDispatchLongPress) {
                this.dispatchEvent(this._createPressEvent("longPress", event));
                this._longPressTimeout = null;
            }
        }
    },

    _dispatchPressCancel: {
        enumerable: false,
        value: function (event) {
            if (this._shouldDispatchLongPress) {
                clearTimeout(this._longPressTimeout);
                this._longPressTimeout = null;
            }

            this._state = PressComposer.CANCELLED;
            this.dispatchEvent(this._createPressEvent("pressCancel", event));
        }
    }

});

/*
 * @class PressEvent
 * @inherits MutableEvent
 * @classdesc The event dispatched by the `PressComposer`, providing access to
 * the raw DOM event and proxying its properties.
 */
var PressEvent = (function (){
    var value, eventProps, typeProps, eventPropDescriptor, typePropDescriptor, i;

    value = MutableEvent.specialize({
        type: {
            value: "press"
        },
        _event: {
            enumerable: false,
            value: null
        },
        event: {
            get: function () {
                return this._event;
            },
            set: function (value) {
                this._event = value;
            }
        },
        _touch: {
            enumerable: false,
            value: null
        },
        touch: {
            get: function () {
                return this._touch;
            },
            set: function (value) {
                this._touch = value;
            }
        }
    });

    // These properties are available directly on the event
    eventProps = ["altKey", "ctrlKey", "metaKey", "shiftKey",
    "cancelBubble", "currentTarget", "defaultPrevented",
    "eventPhase", "timeStamp", "preventDefault",
    "stopImmediatePropagation", "stopPropagation"];
    // These properties are available on the event in the case of mouse, and
    // on the _touch in the case of touch
    typeProps = ["clientX", "clientY", "pageX", "pageY", "screenX", "screenY", "target"];

    eventPropDescriptor = function (prop) {
        return {
            get: function () {
                return this._event[prop];
            }
        };
    };
    typePropDescriptor = function (prop) {
        return {
            get: function () {
                return (this._touch) ? this._touch[prop] : this._event[prop];
            }
        };
    };

    for (i = eventProps.length - 1; i >= 0; i--) {
        Montage.defineProperty(value, eventProps[i], eventPropDescriptor(eventProps[i]));
    }
    for (i = typeProps.length - 1; i >= 0; i--) {
        Montage.defineProperty(value, typeProps[i], typePropDescriptor(typeProps[i]));
    }

    return value;
}());
