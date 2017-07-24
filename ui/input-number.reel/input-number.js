/**
    @module "montage/ui/input-number.reel"
    @requires montage/ui/component
    @requires montage/ui/text-input
*/

var TextInput = require("ui/text-input").TextInput,
    KeyComposer = require("../../composer/key-composer").KeyComposer;

/**
 * Wraps the a &lt;input type="date"> element with binding support for the element's standard attributes.
   @class module:"montage/ui/input-number.reel".InputNumber
   @extends module:montage/ui/text-input.TextInput
 */
var InputNumber = exports.InputNumber = TextInput.specialize({

    constructor: {
        value: function () {
            this._propertyNamesUsed = {};
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {

                this._upKeyComposer = KeyComposer.createKey(this, "up", "increase");
                this._downKeyComposer = KeyComposer.createKey(this, "down", "decrease");
                this._rightKeyComposer = KeyComposer.createKey(this, "right", "increase");
                this._leftKeyComposer = KeyComposer.createKey(this, "left", "decrease");
                
                if(!this.hasStandardElement){
              
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

                    this._InputNumberInputComponent.addEventListener("action", this, false);
                    this._InputNumberMinusComponent.addEventListener("action", this, false);
                    this._InputNumberPlusComponent.addEventListener("action", this, false);

                    this._InputNumberInputComponent.delegate = this;

                    // needs to be fixed for pointer handling
                    this.element.addEventListener("mousedown", this, false);
                }   
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

    _value: {
        value: 0
    },

    _min: {
        value: "any"
    },

    _max: {
        value: "any"
    },

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
            if(this._InputNumberInputComponent && this._value !==  this._InputNumberInputComponent.value) {
                this._InputNumberInputComponent.value = this._value;
            }
        }
    },

    _activeValueChange: {
        value: false
    }

});
