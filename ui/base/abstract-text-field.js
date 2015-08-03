/*global require, exports, document, Error*/
var AbstractControl = require("./abstract-control").AbstractControl,
    KeyComposer = require("../../composer/key-composer").KeyComposer;

var CLASS_PREFIX = "montage-TextField";



/**
 * @class AbstractTextField
 * @extends AbstractControl
 */
var AbstractTextField = exports.AbstractTextField = AbstractControl.specialize(
/** @lends AbstractTextField# */
{

    /**
     * Dispatched when the textfield is activated when the user presses enter.
     * @event action
     * @memberof AbstractTextField
     * @param {Event} event
     */

    constructor: {
        value: function AbstractTextField() {
            if(this.constructor === AbstractTextField) {
                throw new Error("AbstractTextField cannot be instantiated.");
            }
            AbstractControl.constructor.call(this); // super

            this._keyComposer = new KeyComposer();
            this._keyComposer.component = this;
            this._keyComposer.keys = "enter";
            this.addComposer(this._keyComposer);

            this.defineBindings({
                // classList management
                "classList.has('montage--disabled')": {
                    "<-": "!enabled"
                }
            });
        }
    },

    hasTemplate: {
        value: false
    },

    acceptsActiveTarget: {
        get: function () {
            var shouldBeginEditing = this.callDelegateMethod("shouldBeginEditing", this);
            return (shouldBeginEditing !== false);
        }
    },

    delegate: {
        value: null
    },

    enabled: {
        value: true
    },

    _placeholderValue: {
        value: null
    },

    placeholderValue: {
        set: function (value) {
            this._placeholderValue = value;
            this.needsDraw = true;
        },
        get: function () {
            return this._placeholderValue;
        }
    },

    _value: {
        value: null
    },

    value: {
        set: function (value) {
            if (value !== this._value) {
                if (!this.hasFocus || this.callDelegateMethod("shouldAcceptValue", this, value)) {
                    this._value = value;
                    this.needsDraw = true;
                }
            }
        },
        get: function () {
            return this._value;
        }
    },

    _hasFocus: {
        value: false
    },

    hasFocus: {
        set: function (value) {
            this._hasFocus = value;
        },
        get: function () {
            return this._hasFocus;
        }
    },

    _keyComposer: {
        value: null
    },

    handleKeyPress: {
        value: function (evt) {
            if (!this.enabled || evt.keyComposer !== this._keyComposer) {
                return;
            }

            this.dispatchActionEvent();
        }
    },

    prepareForActivationEvents: {
        value: function () {
            this._keyComposer.addEventListener("keyPress", this, false);
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                this.element.addEventListener("input", this, false);
                this.element.addEventListener("change", this, false);
            }
        }
    },

    draw: {
        value: function () {
            var value = this.value;
            if (value === null ||  typeof value === "undefined") {
                this.element.value = "";
            } else if ( typeof value === "boolean" ||  typeof value === "object" ||  typeof value === "number") {
                this.element.value = value.toString();
            } else {
                this.element.value = value;
            }
            if (this.placeholderValue != null) {
                this.element.setAttribute("placeholder", this.placeholderValue);
            }
        }
    },

    handleChange: {
        value: function () {
            this._updateValueFromDom();
        }
    },

    handleInput: {
        value: function (event) {
            this._updateValueFromDom();
        }
    },

    willBecomeActiveTarget: {
        value: function (event) {
            this.hasFocus = true;
            this.callDelegateMethod("didBeginEditing", this);
        }
    },

    surrendersActiveTarget: {
        value: function (event) {
            var shouldEnd = this.callDelegateMethod("shouldEndEditing", this);
            if (shouldEnd === false) {
                return false;
            } else {
                this.hasFocus = false;
                this.callDelegateMethod("didEndEditing", this);
            }
            return true;
        }
    },

    _updateValueFromDom: {
        value: function () {
            if (this._value !== this.element.value) {
                this._value = this.element.value;
                this.dispatchOwnPropertyChange("value", this._value);
                this.callDelegateMethod("didChange", this);
            }
        }
    }

});

