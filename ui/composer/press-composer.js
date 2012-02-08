/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/*global require, exports*/
/**
	@module montage/ui/composer/press-composer
    @requires montage
    @requires montage/ui/composer/composer
*/
var Montage = require("montage").Montage,
    Composer = require("ui/composer/composer").Composer;
/**
    @class module:montage/ui/composer/press-composer.PressComposer
    @extends module:montage/ui/composer/composer.Composer
*/
var PressComposer = exports.PressComposer = Montage.create(Composer,/** @lends module:montage/ui/event/composer/press-composer.PressComposer# */ {

    /**
    @event
    @name pressstart
    @param {Event} event

    Dispatched when a press begins. It is ended by either a {@link press} or
    {@link presscancel} event.
    */

    /**
    @event
    @name press
    @param {Event} event

    Dispatched when a press is complete.
    */

    /**
    @event
    @name presscancel
    @param {Event} event

    Dispatched when a press is canceled. This could be because the pointer
    left the element, was claimed by another component or maybe a phone call
    came in.
    */

    // Load/unload

    load: {
        value: function() {
            if (window.Touch) {
                this._element.addEventListener("touchstart", this);
            } else {
                this._element.addEventListener("mousedown", this);
            }
        }
    },

    unload: {
        value: function() {
            if (window.Touch) {
                this._element.removeEventListener("touchstart", this);
            } else {
                this._element.removeEventListener("mousedown", this);
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
        enumerable: false,
        value: 0
    },
    state: {
        get: function() {
            return this._state;
        }
    },

    // Magic

    /**
    @default null
    @private
    */
    _observedPointer: {
        enumerable: false,
        value: null
    },

    // TODO: maybe this should be split and moved into handleTouchstart
    // and handleMousedown
    _startInteraction: {
        enumerable: false,
        value: function(event) {
            if ("disabled" in this.component && this.component.disabled) {
                return false;
            }

            if (event.type === "touchstart") {
                // TODO: Get first identifier which isn't claimed
                this._observedPointer = event.changedTouches[0].identifier;
                document.addEventListener("touchend", this);
                document.addEventListener("touchcancel", this);
            } else if (event.type === "mousedown") {
                this._observedPointer = "mouse";
                // Needed to cancel action event dispatch is mouseup'd when
                // not on the component
                document.addEventListener("mouseup", this);
                // Needed to preventDefault if another component has claimed
                // the pointer
                document.addEventListener("click", this);
            }

            this.component.eventManager.claimPointer(this._observedPointer, this);

            this._dispatchPressstart(event);
        }
    },

    /**
    Decides what should be done based on an interaction.

    @param {Event} event The event that caused this to be called.
    */
    _interpretInteraction: {
        value: function(event) {
            // TODO maybe the code should be moved out to handleClick and
            // handleMouseup
            var isSurrendered, target, isTarget;

            if (this._observedPointer === null) {
                this._endInteraction(event);
                return;
            }

            isSurrendered = !this.component.eventManager.isPointerClaimedByComponent(this._observedPointer, this);
            target = event.target;
            while (target !== this._element && target && target.parentNode) {
                target = target.parentNode;
            }
            isTarget = target === this.component.element;

            if (isSurrendered && event.type === "click") {
                // Pointer surrendered, so prevent the default action
                event.preventDefault();
                // No need to dispatch an event as presscancel was dispatched
                // in surrenderPointer, just end the interaction.
                this._endInteraction(event);
                return;
            }

            if (!isSurrendered && isTarget && event.type === "click") {
                this._dispatchPress(event);
                this._endInteraction(event);
                return;
            }

            if (!isSurrendered && !isTarget && event.type === "mouseup") {
                this._dispatchPresscancel(event);
                this._endInteraction(event);
                return;
            }
        }
    },

    /**
    Remove event listeners after an interaction has finished.
    */
    _endInteraction: {
        value: function(event) {
            if (!event || event.type === "touchend" || event.type === "touchcancel") {
                document.removeEventListener("touchend", this);
                document.removeEventListener("touchcancel", this);
            } else if (!event || event.type === "click" || event.type === "mouseup") {
                document.removeEventListener("click", this);
                document.removeEventListener("mouseup", this);
            }

            if (this.component.eventManager.isPointerClaimedByComponent(this._observedPointer, this)) {
                this.component.eventManager.forfeitPointer(this._observedPointer, this);
            }
            this._observedPointer = null;
            this._state = PressComposer.UNPRESSED;
        }
    },

    /**
    Checks if we are observing one of the changed touches. Returns the index
    of the changed touch if one matches, otherwise returns false. Make sure
    to check against <code>!== false</code> or <code>=== false</code> as the
    matching index might be 0.

    @function
    @private
    @returns {Number,Boolean} The index of the matching touch, or false
    */
    _changedTouchisObserved: {
        value: function(changedTouches) {
            if (this._observedPointer === null) {
                return false;
            }

            var i = 0, changedTouchCount = event.changedTouches.length;

            for (; i < changedTouchCount; i++) {
                if (event.changedTouches[i].identifier === this._observedPointer) {
                    return i;
                }
            }
            return false;
        }
    },

    // Surrender pointer

    surrenderPointer: {
        value: function(pointer, component) {
            var shouldSurrender = this.callDelegateMethod("surrenderPointer", pointer, component);
            if (typeof shouldSurrender !== "undefined" && shouldSurrender === false) {
                return false;
            }

            this._dispatchPresscancel();
            return true;
        }
    },

    // Handlers

    handleTouchstart: {
        value: function(event) {
            this._startInteraction(event);
        }
    },
    handleTouchend: {
        value: function(event) {
            if (this._observedPointer === null) {
                this._endInteraction(event);
                return;
            }

            if (this._changedTouchisObserved(event.changedTouches) !== false) {
                if (this.component.eventManager.isPointerClaimedByComponent(this._observedPointer, this)) {
                    this._dispatchPress(event);
                } else {
                    event.preventDefault();
                }
                this._endInteraction(event);
            }
        }
    },
    handleTouchcancel: {
        value: function(event) {
            if (this._observedPointer === null || this._changedTouchisObserved(event.changedTouches) !== false) {
                if (this.component.eventManager.isPointerClaimedByComponent(this._observedPointer, this)) {
                    this._dispatchPresscancel(event);
                }
                this._endInteraction(event);
            }
        }
    },

    handleMousedown: {
        value: function(event) {
            this._startInteraction(event);
        }
    },
    handleClick: {
        value: function(event) {
            this._interpretInteraction(event);
        }
    },
    handleMouseup: {
        value: function(event) {
            this._interpretInteraction(event);
        }
    },

    // Event dispatch

    _createPressEvent: {
        enumerable: false,
        value: function(name, event) {
            var pressEvent, detail, index;

            if (event) {
                pressEvent = event;
                pressEvent.type = name;
            } else {
                pressEvent = document.createEvent("CustomEvent");
                pressEvent.initCustomEvent(name, true, true, null);
            }

            pressEvent.pointer = this._observedPointer;

            return pressEvent;
        }
    },

    /**
    Dispatch the pressstart event
    @private
    */
    _dispatchPressstart: {
        enumerable: false,
        value: function (event) {
            this._state = PressComposer.PRESSED;
            this.dispatchEvent(this._createPressEvent("pressstart", event));
        }
    },

    /**
    Dispatch the press event
    @private
    */
    _dispatchPress: {
        enumerable: false,
        value: function (event) {
            this.dispatchEvent(this._createPressEvent("press", event));
            this._state = PressComposer.UNPRESSED;
        }
    },

    /**
    Dispatch the presscancel event
    @private
    */
    _dispatchPresscancel: {
        enumerable: false,
        value: function (event) {
            this._state = PressComposer.CANCELLED;
            this.dispatchEvent(this._createPressEvent("presscancel", event));
        }
    }

});
