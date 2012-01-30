/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    NativeControl = require("ui/native-control").NativeControl;

var CheckInput = exports.CheckInput =  Montage.create(NativeControl, {

    // Callbacks
    draw: {
        value: function() {
            // Call super
            NativeControl.draw.call(this);
            this._element.setAttribute("aria-checked", this._checked);
        }
    },

    /**
        Description TODO
        @function
    */
    prepareForDraw: {
        enumerable: false,
        value: function() {
            this._element.addEventListener('change', this);
        }
    },

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

    /**
    Fake the checking of the element.

    Changes the checked property of the element and dispatches a change event.
    Radio button overrides this.

    @private
    */
    _fakeCheck: {
        enumerable: false,
        value: function() {
            var changeEvent;
            // NOTE: this may be BAD, modifying the element outside of
            // the draw loop, but it's what a click/touch would
            // actually have done
            this._element.checked = !this._element.checked;
            changeEvent = document.createEvent("HTMLEvents");
            changeEvent.initEvent("change", true, true);
            this._element.dispatchEvent(changeEvent);
        }
    },

    /*
    Stores if we need to fake checking.

    When preventDefault is called on touchstart and touchend events (e.g. by
    the scrollview component) the checkbox doesn't check itself, so we need
    to fake it later.

    @default false
    @private
    */
    _shouldFakeChecking: {
        enumerable: false,
        value: false
    },

    // _startInteraction and _endInteraction should be on nativecomponent,
    // but this should be a callback implemented by each component?
    _interpretInteraction: {
        value: function(event) {
            var isTarget = Object.getPrototypeOf(CheckInput)._interpretInteraction.call(this, event, false);

            if (isTarget) {
                if (this._shouldFakeChecking && this.eventManager.isPointerClaimedByComponent(this._observedPointer, this)) {
                    this._shouldFakeChecking = false;
                    this._fakeCheck();
                }

                // If this was a mouseup event then don't end the interaction
                // because we need to handle/preventDefault on the click event
                if (event.type !== "mouseup") {
                    this._endInteraction(event);
                }
            } else {
                this._endInteraction(event);
            }

            return isTarget;
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
    }
});
