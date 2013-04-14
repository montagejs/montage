/*global require, exports, window*/

/**
 @module montage/ui/base/abstract-button.reel
 @requires montage/core/core
 @requires montage/ui/component
 @requires montage/ui/native-control
 @requires montage/composer/press-composer
 */
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    TranslateComposer = require("composer/translate-composer").TranslateComposer,
    Dict = require("collections/dict");

/**
 * @class AbstractInputRange
 * @extends Component
 * @fires action
 * @fires hold
 */
var AbstractInputRange = exports.AbstractInputRange = Montage.create(Component, /** @lends AbstractInputRange# */ {

    // Lifecycle

    /**
     * @private
     */
    create: {
        value: function () {
            if (this === AbstractInputRange) {
                throw new Error("AbstractInputRange cannot be instantiated.");
            } else {
                return Component.create.apply(this, arguments);
            }
        }
    },

    /**
     * @private
     */
    didCreate: {
        value: function () {
            this.addOwnPropertyChangeListener("_sliderWidth", this);
            this.addOwnPropertyChangeListener("_min", this);
            this.addOwnPropertyChangeListener("_max", this);
            this.addOwnPropertyChangeListener("_value", this);
            this.addOwnPropertyChangeListener("_step", this);

            this.defineBinding("enabled ", {"<->": "!disabled", source: this});
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                this._translateComposer = TranslateComposer.create();
                this._translateComposer.axis = "horizontal";
                this._translateComposer.hasMomentum = false;
                this.addComposerForElement(this._translateComposer, this._handleElement);

                // check for transform support
                if("webkitTransform" in this.element.style) {
                    this._transform = "webkitTransform";
                } else if("MozTransform" in this.element.style) {
                    this._transform = "MozTransform";
                } else if("oTransform" in this.element.style) {
                    this._transform = "oTransform";
                } else {
                    this._transform = "transform";
                }
                // read initial values from the input type=range
                this.min = this.element.getAttribute('min') || this.min;
                this.max = this.element.getAttribute('max') || this.max;
                this.step = this.element.getAttribute('step') || this.step;
                this.value = this.element.getAttribute('value') || this.value;
            }
        }
    },

    // @todo: Without prepareForActivationEvents, the _translateComposer does not work
    prepareForActivationEvents: {
        value: function () {
            this._translateComposer.addEventListener('translateStart', this, false);
            this._translateComposer.addEventListener('translate', this, false);
            this._translateComposer.addEventListener('translateEnd', this, false);
        }
    },

    willDraw: {
        value: function () {
            this._sliderWidth = this._thumbSliderElement.offsetWidth;
        }
    },

    draw: {
        value: function () {
            this._thumbSliderElement.style[this._transform] = "translateX(" + this._valuePercentage + "%)";
        }
    },

    // Event Handlers

    handleTranslateStart: {
        value: function (e) {
            this._startTranslate = e.translateX;
            this._startValue = this.value;
        }
    },

    handleTranslate: {
        value: function (event) {
            this.value = this._startValue + ((event.translateX - this._startTranslate) / this._sliderWidth) * (this._max - this._min);

        }
    },

    handleTranslateEnd: {
        value: function (e) {
        }
    },

    surrenderPointer: {
        value: function (pointer, composer) {
            // If the user is sliding us then we do not want anyone using
            // the pointer
            return false;
        }
    },

    // Properties

    _value: {
        value: 50
    },

    _min: {
        value: 0
    },

    _max: {
        value: 100
    },

    _step: {
        value: "any"
    },

    _disabled: {
        value: false
    },

    min: {
        get: function () {
            return this._min;
        },
        set: function (value) {
            if (! isNaN(value = parseFloat(value))) {
                if (this._min !== value) {
                    this._min = value;
                }
            }
        }
    },

    max: {
        get: function () {
            return this._max;
        },
        set: function (value) {
            if (! isNaN(value = parseFloat(value))) {
                if (this._max !== value) {
                    this._max = value;
                }
            }
        }
    },

    step: {
        get: function () {
            return this._step;
        },
        set: function (value) {
            if (! isNaN(value = parseFloat(value)) && value >= 0) {
                if (this._step !== value) {
                    this._step = value;
                }
            }
        }
    },

    value: {
        get: function () {
            return this._value;
        },
        set: function (value) {
            if (! isNaN(value = parseFloat(value))) {
                if (this._value !== value) {
                    this._value = value;
                }
            }
        }
    },

    /**
     * Enables or disables the Button from user input. When this property is set to ```false```,
     * the "disabled" CSS style is applied to the button's DOM element during the next draw cycle. When set to
     * ```true``` the "disabled" CSS class is removed from the element's class list.
     * @type {boolean}
     */
    enabled: {
        value: true
    },

    disabled: {
        get: function () {
            return this._disabled;
        },
        set: function (value) {
            this._disabled = value;
            this.needsDraw = true;
        }
    },

    // Machinery

    _inputRangeThumbElement: {
        value: null
    },

    _thumbSliderElement: {
        value: null
    },

    _translateComposer: {
        value: null
    },

    _transform: {
        value: null
    },

    _transition: {
        value: null
    },

    _sliderWidth: {
        value: null
    },

    _startTranslate: {
        value: null
    },

    _startValue: {
        value: null
    },

    _valuePercentage: {
        value: null
    },

    handlePropertyChange: {
        value: function(changeValue, key, object) {
            if(key.match(/_sliderWidth|_min|_max|_value|_step/) !== null) {

                //adjust the value
                if (this.value <= this.min) {
                    //first the simple case
                    this.value = this.min;
                } else {
                    var magnitude = this.value - this.min;
                    var remainder = magnitude % this.step;
                    if (remainder) {
                        //if we have a remainder then we need to adjust the value
                        // Inspired by http://www.w3.org/html/wg/drafts/html/master/forms.html#range-state-(type=range)
                        // if we are in the middle of two stepped value then go for the larger one.
                        var roundup = (remainder >= this.step * 0.5) && ((this.value - remainder) + this.step <= this.max);
                        if (roundup) {
                            this.value = (this.value - remainder) + this.step;
                        } else {
                            this.value = this.value - remainder;
                        }
                    }

                }

                //otherwise don't adjust the value just check it's within  min and max
                 if (this.value > this.max) {
                    this.value = this.max;
                }

                // ~~ is vastly faster then Math.floor
                // http://jsperf.com/math-floor-vs-math-round-vs-parseint/8
                this._valuePercentage = (~~(((this.value - this._min) * this._sliderWidth) / (this._max - this._min)) * 100 / this._sliderWidth);
                this.needsDraw = true;
            }
        }
    }
});
