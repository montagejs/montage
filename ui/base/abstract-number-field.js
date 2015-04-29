/*global require, exports, document, Error*/
var AbstractControl = require("./abstract-control").AbstractControl,
    KeyComposer = require("../../composer/key-composer").KeyComposer;

var CLASS_PREFIX = "montage-NumberField";

/**
 * @class AbstractNumberField
 * @extends AbstractControl
 */
var AbstractNumberField = exports.AbstractNumberField = AbstractControl.specialize(
/** @lends AbstractNumberField# */
{

    // Lifecycle

    constructor: {
        value: function AbstractNumberField() {
            if (this.constructor === AbstractNumberField) {
                throw new Error("AbstractNumberField cannot be instantiated.");
            }
            AbstractControl.constructor.call(this); // super
            this._propertyNamesUsed = {};
            this.defineBinding( "classList.has('montage--disabled')", { "<-": "!enabled" });
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {

                // read initial values from the input type=range
                var used = this._propertyNamesUsed;
                if (!used.min) {
                    this.min = this.element.getAttribute('min') || this._min;
                }
                if (!used.max) {
                    this.max = this.element.getAttribute('max') || this._max;
                }
                if (!used.step) {
                    this.step = this.element.getAttribute('step') || this._step;
                }
                if (!used.value) {
                    this.value = this.element.getAttribute('value') || this._value;
                }
                delete this._propertyNamesUsed;

                this._numberFieldTextFieldComponent.addEventListener("action", this, false);
                this._numberFieldMinusComponent.addEventListener("action", this, false);
                this._numberFieldPlusComponent.addEventListener("action", this, false);

                this._numberFieldTextFieldComponent.delegate = this;

                // needs to be fixed for pointer handling
                this.element.addEventListener("mousedown", this, false);

                this.element.tabIndex = "-1";

                this._upKeyComposer = KeyComposer.createKey(this, "up", "increase");
                this._downKeyComposer = KeyComposer.createKey(this, "down", "decrease");
                this._rightKeyComposer = KeyComposer.createKey(this, "right", "increase");
                this._leftKeyComposer = KeyComposer.createKey(this, "left", "decrease");
            }
        }
    },

    textFieldShouldBeginEditing: {
        value: function () {
            return this.enabled;
        }
    },

    textFieldDidChange: {
        value: function () {
        }
    },

    textFieldDidEndEditing: {
        value: function () {
            this.value = this._numberFieldTextFieldComponent.value;
        }
    },

    textFieldShouldAcceptValue: {
        value: function (textField, value) {
            if (this._activeValueChange === true) {
                return true;
            }
        }
    },


    prepareForActivationEvents: {
        value: function () {
            this._upKeyComposer.addEventListener("keyPress", this, false);
            this._downKeyComposer.addEventListener("keyPress", this, false);
            this._leftKeyComposer.addEventListener("keyPress", this, false);
            this._rightKeyComposer.addEventListener("keyPress", this, false);
        }
    },

    draw: {
        value: function () {
            this.element.setAttribute("aria-valuemax", this.max);
            this.element.setAttribute("aria-valuemin", this.min);
            this.element.setAttribute("aria-valuenow", this.value);
        }
    },


    // Event Handlers


    acceptsActiveTarget: {
        value: true
    },

    handleMousedown: {
        value: function () {
            this.element.focus();
        }
    },

    /**
     * Handle increment-button action
     * @private
     */
    handlePlusAction: {
        value: function () {
            this._activeValueChange = true;
            var step = this.step * this._stepDecimal;
            var stepBase = (typeof this.min === "number") ? this.min * this._stepDecimal : 0;
            var value = (this.value * this._stepDecimal) - stepBase;
            if (value % step) {
                if (value < 0) {
                    value -= value % step;
                } else {
                    value += step - (value % step);
                }
            } else {
                value += step;
            }
            this.value = (value + stepBase) / this._stepDecimal;
            this._activeValueChange = false;
        }
    },

    /**
     * Handle decrement-button action
     * @private
     */
    handleMinusAction: {
        value: function () {
            this._activeValueChange = true;
            var step = this.step * this._stepDecimal;
            var stepBase = (typeof this.min === "number") ? this.min * this._stepDecimal : 0;
            var value = (this.value * this._stepDecimal) - stepBase;
            if (value % step) {
                if (value > 0) {
                    value -= value % step;
                } else {
                    value -= step + (value % step);
                }
            } else {
                value -= step;
            }
            this.value = (value + stepBase) / this._stepDecimal;
            this._activeValueChange = false;
        }
    },

    handleKeyPress: {
        value: function (event) {
            if (!this.enabled) {
                return;
            }
            if(event.identifier === "increase") {
                this.handlePlusAction();
            } else if (event.identifier === "decrease") {
                this.handleMinusAction();
            }
        }
    },

    handleAction: {
        value: function (event) {
            if (event.target === this._numberFieldTextFieldComponent ||
                event.target === this._numberFieldMinusComponent ||
                event.target === this._numberFieldPlusComponent) {
                event.stopPropagation();
                this.dispatchActionEvent();
            }
        }
    },

    // Properties

    _value: {
        value: 0
    },

    _required: {
        value: false
    },

    _min: {
        value: "any"
    },

    _max: {
        value: "any"
    },

    _step: {
        value: 1
    },

    /**
     * The maximum value allowed in the InputNumber. Can be any number or the string "any".
     * @type {number|string}
     * @default "any"
     */
    min: {
        get: function () {
            return this._min;
        },
        set: function (value) {
            if (value !== "any" && isNaN(value = parseFloat(value))) {
                return false;
            }
            if (this._min !== value) {
                if (this._propertyNamesUsed) {
                    this._propertyNamesUsed.min = true;
                }
                this._min = value;
                this.needsDraw = true;
                if (typeof value === "number" && this.value < value) {
                    this.value = value;
                }
            }
        }
    },

    /**
     * The maximum value allowed in the InputNumber. Can be any number or the string "any".
     * @type {number|string}
     * @default "any"
     */
    max: {

        get: function () {
            return this._max;
        },
        set: function (value) {
            if (value !== "any" && isNaN(value = parseFloat(value))) {
                return false;
            }
            if (this._max !== value) {
                if (this._propertyNamesUsed) {
                    this._propertyNamesUsed.max = true;
                }
                this._max = value;
                this.needsDraw = true;
                if (typeof value === "number" && this.value > value) {
                    this.value = value;
                }
            }
        }
    },

    _stepDecimal: {
        value: 1
    },

    /**
     * The amount the value changes when using the plus/minus buttons. Can be any positive number.
     * @type {number}
     * @default 1
     */
    step: {
        get: function () {
            return this._step;
        },
        set: function (value) {
            if (isNaN(value = parseFloat(value)) || value <= 0) {
                return false;
            }
            if (this._step !== value) {
                if (this._propertyNamesUsed) {
                    this._propertyNamesUsed.step = true;
                }
                this._step = value;
                var decimalPart = String(value).match(/\.(\d+)$/);
                if (decimalPart) {
                    this._stepDecimal = Math.pow(10, decimalPart[1].length);
                } else {
                    this._stepDecimal = 1;
                }
            }
        }
    },

    /**
     * The value of the InputNumber
     * @type {number}
     * @default 0
     */
    value: {
        get: function () {
            return this._value;
        },
        set: function (value) {
            if (value == null || typeof value.valueOf === "undefined") {
                this._value = "";
            } else if (! isNaN(value = parseFloat(value))) {
                if (typeof this.min === 'number' && value < this.min) {
                    value = this.min;
                }
                if (typeof this.max === 'number' && value > this.max) {
                    value = this.max;
                }
                if (this._value !== value) {
                    if (this._propertyNamesUsed) {
                        this._propertyNamesUsed.value = true;
                    }
                    this._value = value;
                    this.needsDraw = true;
                }
            }
            if(this._numberFieldTextFieldComponent && this._value !==  this._numberFieldTextFieldComponent.value) {
                this._numberFieldTextFieldComponent.value = this._value;
            }
        }
    },

    /**
     * Wether or not the number field acccepts user input
     * @type {number}
     * @default 0
     */
    enabled: {
        value: true
    },

    // Machinery

    _numberFieldTextFieldComponent: {
        value: null
    },

    _numberFieldMinusComponent: {
        value: null
    },

    _numberFieldPlusComponent: {
        value: null
    },

    _activeValueChange: {
        value: false
    }

});
