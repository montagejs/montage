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
    /**
        Whether the toggle button is down/pressed or not.
        @type {Property}
        @default {Boolean} false
    */
    pressed: {
        get: function() {
            return this._pressed;
        },
        set: function(value) {
            this._pressed = !!value;
            this._label = (this._pressed) ? this._pressedLabel : this._unpressedLabel;
            this.needsDraw = true;
        }
    },

    _unpressedLabel: {
        enumerable: false,
        value: null,
        serializable: true
    },
    /**
        The value the button should take when it is in the unpressed state. If
        this is not set at initialization it will be set to the `value` of the
        button.
        @type {Property}
        @default {String} null
    */
    unpressedLabel: {
        get: function() {
            return this._unpressedLabel;
        },
        set: function(value) {
            this._unpressedLabel = value;
            if (!this._pressed) {
                this.label = this._unpressedLabel;
                this.needsDraw = true;
            }
        }
    },

    _pressedLabel: {
        enumerable: false,
        value: null,
        serializable: true
    },
    /**
        The value the button should take when it is in the pressed state. If
        this is not set at initialization it will be set to the `value` of the
        button.
        @type {Property}
        @default {String} null
    */
    pressedLabel: {
        get: function() {
            return this._pressedLabel;
        },
        set: function(value) {
            this._pressedLabel = value;
            if (this._pressed) {
                this.label = this._pressedLabel;
                this.needsDraw = true;
            }
        }
    },

    _pressedClass: {
        enumerable: false,
        value: "pressed",
        serializable: true
    },
    /**
        The class that should be added to the element when the button is in
        the pressed state. It is removed when the button is unpressed.
        @type {Property}
        @default {String} "pressed"
    */
    pressedClass: {
        get: function() {
            return this._pressedClass;
        },
        set: function(value) {
            this._pressedClass = value;
            if (this._pressed) {
                this.needsDraw = true;
            }
        }
    },

    /**
        The current value of the button. It will be set to unpressedLabel or
        pressedLabel depending on state.

        Setting this property equal to unpressedLabel or pressedLabel will
        change the pressed state of the button to `false` and `true` respectively.
        @type {Property}
        @default {String} null, or the value of the element
    */
    label: {
      get: function() {
        return Object.getOwnPropertyDescriptor(Object.getPrototypeOf(ToggleButton),"label").get.call(this);
      },
      set: function(value) {
        // Call super
        Object.getOwnPropertyDescriptor(Object.getPrototypeOf(ToggleButton),"label").set.call(this, value);
        if (this._pressed === true && this._label === this._unpressedLabel) {
            this.pressed = false;
        } else if (this._pressed === false && this._label === this._pressedLabel) {
            this.pressed = true;
        }
      }
    },

    didSetElement: {
        value: function() {
            Object.getPrototypeOf(ToggleButton).didSetElement.call(this);

            // If we haven't set the (un)pressedLabel of the initial state,
            // then take it from the label
            if (this._unpressedLabel === null && this._label !== null) {
                this._unpressedLabel = this._label;
            }
            if (this._pressedLabel === null && this._label !== null) {
                this._pressedLabel = this._label;
            }
        }
    },

    draw: {
        value: function() {
            Object.getPrototypeOf(ToggleButton).draw.call(this);
            if (this._pressed) {
                this._element.classList.add(this._pressedClass);
                this._element.setAttribute("aria-pressed", true);
            } else {
                this._element.classList.remove(this._pressedClass);
                this._element.setAttribute("aria-pressed", false);
            }
        }
    },

    _dispatchActionEvent: {
        value: function() {
            this.pressed = !this._pressed;
            Object.getPrototypeOf(ToggleButton)._dispatchActionEvent.call(this);
        }
    },

    /**
        Change the button to the inverse of its current state.
        @type {Function}
    */
    toggle: {
        value: function() {
            this.pressed = !this._pressed;
        }
    }
});
