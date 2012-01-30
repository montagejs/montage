/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    CheckInput = require("ui/check-input").CheckInput;

var Checkbox = exports.Checkbox = Montage.create(CheckInput, {
    handleChange: {
        enumerable: false,
        value: function(event) {
            if (this._observedPointer === null || this.eventManager.isPointerClaimedByComponent(this._observedPointer, this)) {
                Object.getPropertyDescriptor(this, "checked").set.call(this,
                    this.element.checked, true);
                this._dispatchActionEvent();
            }
        }
    },

    _observedPointer: {
        enumerable: false,
        value: null
    },

    /*
    Stores if we need to fake checking.

    When preventDefault is called on touchstart and touchend events (e.g. by
    the scrollview component) the checkbox doesn't check itself, so we need
    to fake it later.
    */
    _shouldFakeChecking: {
        enumerable: false,
        value: false
    },

    _startInteraction: {
        enumerable: false,
        value: function(event) {
            if (event.type === "touchstart") {
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

            this.eventManager.claimPointer(this._observedPointer, this);
        }
    },

    // _startInteraction and _endInteraction should be on nativecomponent,
    // but this should be a callback implemented by each component?
    _interpretInteraction: {
        value: function(event) {
            if (this._observedPointer === null) {
                this._endInteraction(event);
                return;
            }

            var target = event.target, changeEvent;

            while (target !== this._element && target && target.parentNode) {
                target = target.parentNode;
            }

            if (this._element === target) {
                // If this is the target, but the pointer has been claimed by
                // another component then don't check the box
                if (!this.eventManager.isPointerClaimedByComponent(this._observedPointer, this)) {
                    event.preventDefault();
                } else if (this._shouldFakeChecking) {
                    this._shouldFakeChecking = false;
                    // NOTE: this may be BAD, modifying the element outside of
                    // the draw loop, but it's what a click/touch would
                    // actually have done
                    this._element.checked = !this._element.checked;
                    changeEvent = document.createEvent("HTMLEvents");
                    changeEvent.initEvent("change", true, true);
                    this._element.dispatchEvent(changeEvent);
                }

                // If this was a mouseup event then don't end the interaction
                // because we need to handle/preventDefault on the click event
                if (event.type !== "mouseup") {
                    this._endInteraction(event);
                }
            } else {
                this._endInteraction(event);
            }
        }
    },

    _endInteraction: {
        value: function(event) {
            if (event.type === "touchend" || event.type === "touchcancel") {
                document.removeEventListener("touchend", this);
                document.removeEventListener("touchcancel", this);
            } else if (event.type === "click" || event.type === "mouseup") {
                document.removeEventListener("click", this);
                document.removeEventListener("mouseup", this);
            }

            if (this.eventManager.isPointerClaimedByComponent(this._observedPointer, this)) {
                this.eventManager.forfeitPointer(this._observedPointer, this);
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

    handleTouchstart: {
        value: function(event) {
            this._shouldFakeChecking = event.defaultPrevented;
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
                this._shouldFakeChecking = this._shouldFakeChecking || event.defaultPrevented;
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
    }
});
Checkbox.addAttributes({
    autofocus: 'off', // on/off
    disabled: {value: false, dataType: 'boolean'},
    checked: {value: false, dataType: 'boolean'},
    form: null,
    name: null,
    readonly: {value: false, dataType: 'boolean'},
    title: null,
    /*
    "On getting, if the element has a value attribute, it must return that
    attribute's value; otherwise, it must return the string "on". On setting,
    it must set the element's value attribute to the new value."
    http://www.w3.org/TR/html5/common-input-element-attributes.html#dom-input-value-default-on
    */
    value: {value: 'on'}
});
