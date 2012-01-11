/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    Button = require("ui/button.reel/button").Button;
/**
 * The Text input
 */
var ToggleButton = exports.ToggleButton = Montage.create(Button, {
    _pressed: {
        enumerable: false,
        value: false
    },

    pressed: {
        get: function() {
            return this._pressed;
        },
        set: function(value) {
            this._pressed = !!value;
            this.value = (this._pressed) ? this._pressedValue : this._unpressedValue;
            this.needsDraw = true;
        }
    },

    _unpressedValue: {
        enumerable: false,
        value: null
    },
    unpressedValue: {
        get: function() {
            return _unpressedValue;
        },
        set: function(value) {
            this._unpressedValue = value;
            if (!this._pressed) {
                this.value = this._unpressedValue;
                this.needsDraw = true;
            }
        }
    },

    _pressedValue: {
        enumerable: false,
        value: null
    },
    pressedValue: {
        get: function() {
            return this._pressedValue;
        },
        set: function(value) {
            this._pressedValue = value;
            if (this._pressed) {
                this.value = this._pressedValue;
                this.needsDraw = true;
            }
        }
    },

    value: {
      get: function() {
        return this._value;
      },
      set: function(value) {
        // Call super
        Object.getOwnPropertyDescriptor(Object.getPrototypeOf(ToggleButton),"value").set.call(this, value);
        if (this._pressed === true && this._value === this._unpressedValue) {
            this.pressed = false;
        } else if (this._pressed === false && this._value === this._pressedValue) {
            this.pressed = true;
        }
      }
    },

    _dispatchActionEvent: {
        value: function() {
            this.pressed = !this._pressed;
            Object.getPrototypeOf(ToggleButton)._dispatchActionEvent.call(this);
        }
    },

    toggle: {
        value: function() {
            this.pressed = !this._pressed;
        }
    }
});
