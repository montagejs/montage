 
/**
    @module "montage/ui/toggle-button.reel"
*/

var Button = require("ui/button.reel").Button;
/**
  The ToggleButton component extends the Button component to include state management (pressed or not pressed), and the ability to specify labels and CSS classes for each state.
  @class module:"montage/ui/toggle-button.reel".ToggleButton
  @extends module:"montage/ui/button.reel".Button
 */
var ToggleButton = exports.ToggleButton = Button.specialize(/** @lends module:"montage/ui/toggle-button.reel".ToggleButton# */ {

    constructor: {
        value: function () {

            this.classList.add("montage-ToggleButton");

            this.defineBindings({
                // classList management
                "classList.has('montage-ToggleButton--pressed')": {
                    "<-": "pressed"
                }
            });
        }
    },

    hasTemplate: {
        value: false
    },

    _pressed: {
        value: false
    },
/**
    Gets and sets the ToggleButton's current state, updates the button's label to its <code>pressedLabel</code> or <code>unpressedLabel</code>, and requests a draw.
    @type {Boolean}
    @default false
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
        value: null
    },
/**
    The label to display when the ToggleButton is in its unpressed state. By default, it is set to the value of the <code>value</code> attribute assigned to the input element.
    @type {String}
    @default null
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
        value: null
    },
/**
    The value the button should take when it is in the pressed state. By default, it is set to the value of the <code>value</code> attribute assigned to the input element.
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
        value: "pressed"
    },
/**
    The CSS class that should be added to the element's class list when the button is in
    the pressed state. It is removed when the button is unpressed.
    @type {string}
    @default "pressed"
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
        The current value of the button. It is set to the value of <code>unpressedLabel</code> or
        <code>pressedLabel</code> depending on the ToggleButton's state.

        Setting this property equal to <code>unpressedLabel</code> or <code>pressedLabel</code> will change the <code>pressed</code> state of the button to `false` or `true`, respectively.
        @type {string}
        @default null
    */
    label: {
        get: function() {
            return Object.getPropertyDescriptor(Button.prototype,"label").get.call(this);
        },
        set: function(value) {
            // Call super
            //Object.getOwnPropertyDescriptor(Object.getPrototypeOf(ToggleButton),"label").set.call(this, value);
            Object.getPropertyDescriptor(Button.prototype, "label").set.call(this, value);
            if (this._pressed === true && this._label === this._unpressedLabel) {
                this.pressed = false;
            } else if (this._pressed === false && this._label === this._pressedLabel) {
                this.pressed = true;
            }
        }
    },

    setLabelInitialValue: {
        value: function(value) {
            if (this._label === null) {
                this._label = value;
            }
        }
    },

    enterDocument: {
        value: function(firstTime) {
            this.super(firstTime);

            if (firstTime) {
                // If we haven't set the (un)pressedLabel of the initial state,
                // then take it from the label
                if (this._unpressedLabel === null && this._label !== null) {
                    this._unpressedLabel = this._label;
                }
                if (this._pressedLabel === null && this._label !== null) {
                    this._pressedLabel = this._label;
                }
            }
        }
    },

    draw: {
        value: function() {
            this.super();

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
            this.super();
        }
    },

    /**
        Toggles the state of the button.
        @function
    */
    toggle: {
        value: function() {
            this.pressed = !this._pressed;
        }
    }
});
