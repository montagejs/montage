/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/*global require, exports */
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    NativeControl = require("ui/native-control").NativeControl,
    PressComposer = require("ui/composer/press-composer").PressComposer;

var CheckInput = exports.CheckInput =  Montage.create(NativeControl, {

    // Callbacks
    draw: {
        value: function() {
            // Call super
            NativeControl.draw.call(this);
            this._element.setAttribute("aria-checked", this._checked);
        }
    },

    prepareForActivationEvents: {
        value: function() {
            var pressComposer = PressComposer.create();
            this.addComposer(pressComposer);
            pressComposer.addEventListener("pressstart", this, false);
            pressComposer.addEventListener("press", this, false);
            // TODO need to listen to this?
            //pressComposer.addEventListener("presscancel", this, false);
        }
    },

    prepareForDraw: {
        enumerable: false,
        value: function() {
            this._element.addEventListener('change', this);
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

    /**
    Stores if we need to fake checking.

    When preventDefault is called on touchstart and touchend events (e.g. by
    the scrollview component) the checkbox doesn't check itself, so we need
    to fake it later.

    @default false
    @private
    */
    _shouldFakeCheck: {
        enumerable: false,
        value: false
    },

    // Handlers

    handlePressstart: {
        value: function(event) {
            console.log(event.detail);
            this._shouldFakeCheck = event.defaultPrevented;
        }
    },


    handlePress: {
        value: function(event) {
            if (this._shouldFakeCheck) {
                this._shouldFakeCheck = false;
                this._fakeCheck();
            }
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
    }
});
