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
exports.PressComposer = Montage.create(Composer,/** @lends module:montage/ui/event/composer/press-composer.PressComposer# */ {

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
    Basic interaction interpreter. Generally should be overridden.

    In overriding function it should be used as follows:
    <code><pre>
    _interpretInteraction: function(event) {
        var isTarget = Object.getPrototypeOf(YOUR_CLASS_NAME)._interpretInteraction.call(this, event, false);
        // Your own code here
        // This example will not end in the interaction when a mouseup is
        // received on the element, so that you can preventDefault when you
        // receive a click.
        if (isTarget && event.type !== "mouseup") {
            this._endInteraction(event);
        } else {
            this._endInteraction(event);
        }

        return isTarget;
    }
    </pre></code>

    @param {Event} event The event that caused this to be called.
    @param {Boolean} [endInteraction=true] Whether _endInteraction should be
        called from this function. Set to false if you want to perform
        additional actions yourself before ending the interaction.
    @returns {Boolean} Whether this component's element was the target of the event.
    */
    _interpretInteraction: {
        value: function(event) {
            if (this._observedPointer === null) {
                this._endInteraction(event);
                return false;
            }

            var target = event.target;

            while (target !== this._element && target && target.parentNode) {
                target = target.parentNode;
            }

            if (this._element === target) {
                // preventDefault if another component has claimed the pointer
                if (this.component.eventManager.isPointerClaimedByComponent(this._observedPointer, this)) {
                    this._dispatchPress(event);
                } else {
                    // TODO: should this be here, or handled by the component?
                    event.preventDefault();
                    this._dispatchPresscancel(event);
                }

                this._endInteraction(event);
                return true;
            }

            this._endInteraction(event);
            return false;
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
        }
    },

    _changedTouchisObserved: {
        value: function(changedTouches) {
            var i = 0, changedTouchCount = event.changedTouches.length;

            for (; i < changedTouchCount; i++) {
                if (event.changedTouches[i].identifier === this._observedPointer) {
                    return true;
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

            if (this._changedTouchisObserved(event.changedTouches)) {
                this._interpretInteraction(event);
            }
        }
    },
    handleTouchcancel: {
        value: function(event) {
            if (this._observedPointer === null || this._changedTouchisObserved(event.changedTouches)) {
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

    /**
    Dispatch the pressstart event
    @private
    */
    _dispatchPressstart: {
        value: function (event) {
            // TODO: somehow pass through the preventDefault method of the
            // click event?

            var pressEvent = document.createEvent("CustomEvent");
            // TODO make this look like a mouse/touch event
            // clientX, screenX etc.
            pressEvent.clientX = this._X;
            pressEvent.clientY = this._Y;
            pressEvent.identifier = this._fingerId;
            pressEvent.initCustomEvent("pressstart", true, true, null);
            this.dispatchEvent(pressEvent);
        }
    },

    /**
    Dispatch the press event
    @private
    */
    _dispatchPress: {
        value: function (event) {
            // TODO: somehow pass through the preventDefault method of the
            // click event?

            var pressEvent = document.createEvent("CustomEvent");
            // TODO make this look like a mouse/touch event
            // clientX, screenX etc.
            pressEvent.clientX = this._X;
            pressEvent.clientY = this._Y;
            pressEvent.identifier = this._fingerId;
            pressEvent.initCustomEvent("press", true, true, null);
            this.dispatchEvent(pressEvent);
        }
    },

    /**
    Dispatch the presscancel event
    @private
    */
    _dispatchPresscancel: {
        value: function (event) {
            // TODO: somehow pass through the preventDefault method of the
            // click event?

            var pressEvent = document.createEvent("CustomEvent");
            // TODO make this look like a mouse/touch event
            // clientX, screenX etc.
            pressEvent.clientX = this._X;
            pressEvent.clientY = this._Y;
            pressEvent.identifier = this._fingerId;
            pressEvent.initCustomEvent("presscancel", true, true, null);
            this.dispatchEvent(pressEvent);
        }
    }

});
