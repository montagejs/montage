/*global require, exports, window*/

/**
 @module montage/ui/base/abstract-slider.reel
 @requires montage/core/core
 @requires montage/ui/component
 @requires montage/ui/native-control
 @requires montage/composer/press-composer
 */
var AbstractControl = require("ui/base/abstract-control").AbstractControl,
    TranslateComposer = require("composer/translate-composer").TranslateComposer,
    KeyComposer = require("composer/key-composer").KeyComposer,
    Dict = require("collections/dict");

/**
 * @class AbstractSlider
 * @extends AbstractControl
 */
var AbstractSlider = exports.AbstractSlider = AbstractControl.specialize( /** @lends AbstractSlider# */ {

    // Lifecycle

    /**
     * @private
     */
    constructor: {
        value: function AbstractSlider() {
            if (this.constructor === AbstractSlider) {
                throw new Error("AbstractSlider cannot be instantiated.");
            }
            AbstractControl.constructor.call(this); // super
            //this is so that when we read properties from the dom they are not overwritten
            this._propertyNamesUsed = {};
            this.addOwnPropertyChangeListener("_sliderMagnitude", this);
            this.addOwnPropertyChangeListener("_min", this);
            this.addOwnPropertyChangeListener("_max", this);
            this.addOwnPropertyChangeListener("_value", this);
            this.addOwnPropertyChangeListener("_step", this);
            this.addOwnPropertyChangeListener("axis", this);
            this.axis = "horizontal";

            this.defineBinding( "classList.has('montage--disabled')", { "<-": "!enabled" });
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                this._translateComposer = new TranslateComposer();
                this._translateComposer.identifier = "thumb";
                this._translateComposer.axis = this.axis;
                this._translateComposer.hasMomentum = false;
                this.addComposerForElement(this._translateComposer, this._sliderThumbTrackElement);

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
                var used = this._propertyNamesUsed;
                if (!used._min) {
                    this.min = this.element.getAttribute('min') || this._min;
                }
                if (!used._max) {
                    this.max = this.element.getAttribute('max') || this._max;
                }
                if (!used._step) {
                    this.step = this.element.getAttribute('step') || this._step;
                }
                if (!used._value) {
                    this.value = this.element.getAttribute('value') || this._value;
                }
                delete this._propertyNamesUsed;

                this.element.setAttribute("role", "slider");
                this.element.tabIndex = "-1";

                this._upKeyComposer = KeyComposer.createKey(this, "up", "increase");
                this._downKeyComposer = KeyComposer.createKey(this, "down", "decrease");
                this._rightKeyComposer = KeyComposer.createKey(this, "right", "increase");
                this._leftKeyComposer = KeyComposer.createKey(this, "left", "decrease");
            }
        }
    },

    // @todo: Without prepareForActivationEvents, the _translateComposer does not work
    prepareForActivationEvents: {
        value: function () {
            this._translateComposer.addEventListener('translateStart', this, false);
            this._translateComposer.addEventListener('translate', this, false);
            this._translateComposer.addEventListener('translateEnd', this, false);

            // needs to be fixed for pointer handling
            this._sliderThumbTrackElement.addEventListener("touchstart", this, false);
            document.addEventListener("touchend", this, false);
            this._sliderThumbTrackElement.addEventListener("mousedown", this, false);
            document.addEventListener("mouseup", this, false);

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

    willDraw: {
        value: function () {

            this._sliderMagnitude = this._calculateSliderMagnitude();
        }
    },


    draw: {
        value: function () {
            if(this.axis === "vertical") {
                this._sliderThumbTrackElement.style[this._transform] = "translateY(" + this._valuePercentage + "%)";
            } else {
                this._sliderThumbTrackElement.style[this._transform] = "translateX(" + this._valuePercentage + "%)";
            }
            this.element.setAttribute("aria-valuemax", this.max);
            this.element.setAttribute("aria-valuemin", this.min);
            this.element.setAttribute("aria-valuenow", this.value);
        }
    },

    // Event Handlers

    acceptsActiveTarget: {
        value: true
    },

    handleTouchstart: {
        value: function (e) {
            this.classList.add("montage-Slider--active");
            this.element.focus();
        }
    },

    handleTouchend: {
        value: function (e) {
            this.classList.remove("montage-Slider--active");
        }
    },

    handleMousedown: {
        value: function (e) {
            var self = this;
            this.classList.add("montage-Slider--active");
            this.element.focus();
        }
    },

    handleMouseup: {
        value: function (e) {
            this.classList.remove("montage-Slider--active");
        }
    },

    handleThumbTranslateStart: {
        value: function (e) {
            if(this.axis === "vertical") {
                this._startTranslate = e.translateY;
            } else {
                this._startTranslate = e.translateX;
            }
            this._startValue = this.value;
        }
    },

    handleThumbTranslate: {
        value: function (event) {
            if(this.axis === "vertical") {
                this.value = this._startValue + ((this._startTranslate - event.translateY) / this._sliderMagnitude) * (this._max - this._min);
            } else {
                this.value = this._startValue + ((event.translateX - this._startTranslate) / this._sliderMagnitude) * (this._max - this._min);
            }

        }
    },

    handleThumbTranslateEnd: {
        value: function (e) {
            this.classList.remove("montage-Slider--active");
        }
    },

    _increase: {
        value: function () {
            var stepBase = (typeof this.min == "number") ? this.min : 0;
            var value = this.value - stepBase;
            var step =  this.step | (this.max-this.min)/100
            if (value % step) {
                if (value < 0) {
                    value -= value % step;
                } else {
                    value += step - (value % step);
                }
            } else {
                value += step;
            }
            this.value = value + stepBase;
        }
    },

    _decrease: {
        value: function () {
            var stepBase = (typeof this.min == "number") ? this.min : 0;
            var value = this.value - stepBase;
            var step =  this.step | (this.max-this.min)/100
            if (value % step) {
                if (value > 0) {
                    value -= value % step;
                } else {
                    value -= step + (value % step);
                }
            } else {
                value -= step;
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
                this._increase();
            } else if (event.identifier === "decrease") {
                this._decrease();
            }

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

    axis: {
        value: null
    },

    // Machinery

    _sliderThumbElement: {
        value: null
    },

    _sliderThumbTrackElement: {
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

    _sliderMagnitude: {
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

    _calculateSliderMagnitude: {
        value: function() {
            if(this.axis === "vertical") {
                return this._sliderThumbTrackElement.offsetHeight;
            } else {
                return this._sliderThumbTrackElement.offsetWidth;
            }
        }
    },

    handleAxisChange: {
        value: function() {
            if (this._translateComposer) {
                this._translateComposer.axis = this.axis;
            }
            if(this.axis === "vertical") {
                this.classList.add("montage-Slider--vertical");
                this.classList.remove("montage-Slider--horizontal");
            } else {
                this.classList.remove("montage-Slider--vertical");
                this.classList.add("montage-Slider--horizontal");
            }
        }
    },

    _propertyRegex: {
        value: /_sliderMagnitude|_min|_max|_value|_step/
    },

    handlePropertyChange: {
        value: function(changeValue, key, object) {
            if(key.match(this._propertyRegex) !== null) {
                if(this._propertyNamesUsed) {
                    this._propertyNamesUsed[key] = true;
                }
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
                this._valuePercentage = (~~(((this.value - this._min) * this._sliderMagnitude) / (this._max - this._min)) * 100 / this._sliderMagnitude);
                this.needsDraw = true;
            }
        }
    }
});
