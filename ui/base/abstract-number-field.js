/*global require, exports, document, Error*/
var Montage = require("montage").Montage,
    AbstractControl = require("ui/base/abstract-control").AbstractControl,
    KeyComposer = require("composer/key-composer").KeyComposer,
    Dict = require("collections/dict");

var CLASS_PREFIX = "montage-NumberField";

/**
 * @class AbstractNumberField
 * @extends AbstractControl
 */
var AbstractNumberField = exports.AbstractNumberField = AbstractControl.specialize(
    /* @lends AbstractNumberField# */
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

    prepareForActivationEvents: {
        value: function() {
            // Due to a current issue with how the key manager works we need
            // to listen on both the component and the key composer.
            // The key composer dispatches the event on the activeTarget
            // (the component), and we need to listen on the key composer so
            // that the listeners are installed.
            this.addEventListener("keyPress", this, false);
            this._upKeyComposer.addEventListener("keyPress", null, false);
            this._downKeyComposer.addEventListener("keyPress", null, false);
            this._leftKeyComposer.addEventListener("keyPress", null, false);
            this._rightKeyComposer.addEventListener("keyPress", null, false);
        }
    },

    draw: {
        value: function() {
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
     */
    handlePlusAction: {
        value: function () {
            var stepBase = (typeof this.min === "number") ? this.min : 0;
            var value = this.value - stepBase;
            if (value % this.step) {
                if (value < 0) {
                    value -= value % this.step;
                } else {
                    value += this.step - (value % this.step);
                }
            } else {
                value += this.step;
            }
            this.value = value + stepBase;
        }
    },

    /**
     * Handle decrement-button action
     */
    handleMinusAction: {
        value: function () {
            var stepBase = (typeof this.min === "number") ? this.min : 0;
            var value = this.value - stepBase;
            if (value % this.step) {
                if (value > 0) {
                    value -= value % this.step;
                } else {
                    value -= this.step + (value % this.step);
                }
            } else {
                value -= this.step;
            }
            this.value = value + stepBase;
        }
    },

    handleKeyPress: {
        value: function(event) {
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
        value: function(event) {
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
            }
        }
    },

    _valuePattern: {
        value: /[^0-9\.]+/g
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
            // this could be removed if the textfield allowed a formatter
            if (typeof value === "string") {
                value = value.replace(/[^0-9\.]+/g, "");
            }
            if (! isNaN(value = parseFloat(value))) {
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
    }

});
