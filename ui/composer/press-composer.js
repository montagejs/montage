/* <copyright>
Copyright (c) 2012, Motorola Mobility LLC.
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of Motorola Mobility LLC nor the names of its
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */
/*global require, exports*/
/**
	@module montage/ui/composer/press-composer
    @requires montage
    @requires montage/ui/composer/composer
    @requires montage/core/event/mutable-event
*/
var Montage = require("montage").Montage,
    Composer = require("ui/composer/composer").Composer,
    MutableEvent = require("core/event/mutable-event").MutableEvent;
/**
    @class module:montage/ui/composer/press-composer.PressComposer
    @extends module:montage/ui/composer/composer.Composer
    @fires pressStart
    @fires press
    @fires longPress
    @fires pressCancel
*/
var PressComposer = exports.PressComposer = Montage.create(Composer,/** @lends module:montage/ui/composer/press-composer.PressComposer# */ {

    /**
        Dispatched when a press begins. It is ended by either a {@link press} or
        {@link pressCancel} event.

        @event pressStart
        @memberof module:montage/ui/composer/press-composer.PressComposer
        @param {PressEvent} event
    */

    /**
        Dispatched when a press is complete.

        @event press
        @memberof module:montage/ui/composer/press-composer.PressComposer
        @param {PressEvent} event
    */

    /**
        Dispatched when a press lasts for longer than (@link longPressThreshold}

        @event longPress
        @memberof module:montage/ui/composer/press-composer.PressComposer
        @param {PressEvent} event
    */

    /**
        Dispatched when a press is canceled. This could be because the pointer
        left the element, was claimed by another component or maybe a phone call
        came in.

        @event pressCancel
        @memberof module:montage/ui/composer/press-composer.PressComposer
        @param {PressEvent} event
    */

    // Load/unload

    load: {
        value: function() {
            if (window.Touch) {
                this._element.addEventListener("touchstart", this, true);
            } else {
                this._element.addEventListener("mousedown", this, true);
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

    /**
    Delegate that implements <code>surrenderPointer</code>. See Component for
    explanation of what this method should do.

    @type {Object}
    @default null
    */
    delegate: {
        value: null
    },


    /**
    Cancel the current press.

    Can be used in a "longPress" event handler to prevent the "press" event
    being fired.
    @returns Boolean true if a press was canceled, false if the composer was
                     already in a unpressed or canceled state.
    */
    cancelPress: {
        value: function() {
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
        value: function(type, listener, useCapture) {
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
        enumerable: false,
        value: 0
    },
    state: {
        get: function() {
            return this._state;
        }
    },

    _shouldDispatchLongPress: {
        enumerable: false,
        value: false
    },

    _longPressThreshold: {
        enumerable: false,
        value: 1000
    },
    /**
    How long a press has to last for a longPress event to be dispatched
    */
    longPressThreshold: {
        get: function() {
            return this._longPressThreshold;
        },
        set: function(value) {
            if (this._longPressThreshold !== value) {
                this._longPressThreshold = value;
            }
        }
    },

    _longPressTimeout: {
        enumberable: false,
        value: null
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
            if (
                ("disabled" in this.component && this.component.disabled) ||
                this._observedPointer !== null
            ) {
                return false;
            }

            var i = 0, changedTouchCount;

            if (event.type === "touchstart") {
                changedTouchCount = event.changedTouches.length;
                for (; i < changedTouchCount; i++) {
                    if (!this.component.eventManager.componentClaimingPointer(event.changedTouches[i].identifier)) {
                        this._observedPointer = event.changedTouches[i].identifier;
                        break;
                    }
                 }

                if (this._observedPointer === null) {
                    // All touches have been claimed
                    return false;
                }

                document.addEventListener("touchend", this, false);
                document.addEventListener("touchcancel", this, false);
            } else if (event.type === "mousedown") {
                this._observedPointer = "mouse";
                // Needed to cancel action event dispatch is mouseup'd when
                // not on the component
                document.addEventListener("mouseup", this, false);
                // Needed to preventDefault if another component has claimed
                // the pointer
                document.addEventListener("click", this, false);
            }

            this.component.eventManager.claimPointer(this._observedPointer, this);

            this._dispatchPressStart(event);
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
            isTarget = target === this._element;

            if (isSurrendered && event.type === "click") {
                // Pointer surrendered, so prevent the default action
                event.preventDefault();
                // No need to dispatch an event as pressCancel was dispatched
                // in surrenderPointer, just end the interaction.
                this._endInteraction(event);
                return;
            } else if (event.type === "mouseup") {

                if (!isSurrendered && isTarget) {
                    this._dispatchPress(event);
                    this._endInteraction(event);
                    return;
                } else if (!isSurrendered && !isTarget) {
                    this._dispatchPressCancel(event);
                    this._endInteraction(event);
                    return;
                } else if (isSurrendered && !isTarget) {
                    this._endInteraction(event);
                }
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

            this._dispatchPressCancel();
            return true;
        }
    },

    // Handlers

    captureTouchstart: {
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
                    this._dispatchPressCancel(event);
                }
                this._endInteraction(event);
            }
        }
    },

    captureMousedown: {
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

            if (!event) {
                event = document.createEvent("CustomEvent");
                event.initCustomEvent(name, true, true, null);
            }

            pressEvent = PressEvent.create();
            pressEvent.event = event;
            pressEvent.type = name;
            pressEvent.pointer = this._observedPointer;

            if (event.changedTouches &&
                (index = this._changedTouchisObserved(event.changedTouches)) !== false
            ) {
                pressEvent.touch = event.changedTouches[index];
            }

            return pressEvent;
        }
    },

    /**
    Dispatch the pressStart event
    @private
    */
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

    /**
    Dispatch the press event
    @private
    */
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

    /**
    Dispatch the long press event
    @private
    */
    _dispatchLongPress: {
        enumerable: false,
        value: function (event) {
            if (this._shouldDispatchLongPress) {
                this.dispatchEvent(this._createPressEvent("longPress", event));
                this._longPressTimeout = null;
            }
        }
    },

    /**
    Dispatch the pressCancel event
    @private
    */
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


var PressEvent = (function(){
    var value, eventProps, typeProps, eventPropDescriptor, typePropDescriptor, i;

    value = Montage.create(Montage, {
        type: {
            value: "press"
        },
        _event: {
            enumerable: false,
            value: null
        },
        event: {
            get: function() {
                return this._event;
            },
            set: function(value) {
                this._event = value;
            }
        },
        _touch: {
            enumerable: false,
            value: null
        },
        touch: {
            get: function() {
                return this._touch;
            },
            set: function(value) {
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

    eventPropDescriptor = function(prop) {
        return {
            get: function() {
                return this._event[prop];
            }
        };
    };
    typePropDescriptor = function(prop) {
        return {
            get: function() {
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
