/*global require,exports */

/**
    @module "montage/ui/native/input-range.reel"
*/

var Control = require("ui/control").Control,
    TranslateComposer = require("../../composer/translate-composer").TranslateComposer,
    KeyComposer = require("../../composer/key-composer").KeyComposer,
    Map = global.Map ? global.Map : require("collections/map"),
    WeakMap = require("collections/weak-map");
;

/**
 * Wraps the a &lt;input type="range"> element with binding support for the element's standard attributes.
   @class module:"montage/ui/native/input-range.reel".InputRange
   @extends module:montage/ui/text-input.TextInput
 */
var Slider = exports.Slider = Control.specialize({
    /**
     * @private
     */
    constructor: {
        value: function Slider() {
            Control.constructor.call(this); // super
            //this is so that when we read properties from the dom they are not overwritten
            this._propertyNamesUsed = {};
            this._values = [0];

            this._isThumbElementTranslating = new WeakMap();
            this._percentageValues = new Array();
            this._previousPercentageValues = new Array();
            this._thumbElementOffset = new WeakMap();

            this.addOwnPropertyChangeListener("_sliderMagnitude", this);
            this.addOwnPropertyChangeListener("_min", this);
            this.addOwnPropertyChangeListener("_max", this);
            this.addOwnPropertyChangeListener("_value", this);
            this.addOwnPropertyChangeListener("values", this);
            this.addOwnPropertyChangeListener("_step", this);
            this.addOwnPropertyChangeListener("axis", this);

            //this._values.addRangeChangeListener(this, "values");
            // this._values.addRangeChangeListener(this);
            this.addRangeAtPathChangeListener("_values",this);

        }
    },

    handleValuesRangeChange: {
        value: function (plus, minus, index) {
            this.needsDraw = true;
        }
    },
    handleRangeChange: {
        value: function (plus, minus, index) {
            this.handlePropertyChange(plus[0], "values", this);
            //this.needsDraw = true;
        }
    },

    /**
     * @private
     */
    _orientation: {value: "horizontal"},

    /**
     * Slider's orientation is horizontal by default,
     * can be overridden by setting this property,
     * isn't auto-responsive due to inability to react to parent container dimension changes.
     *
     * @property {String} orientation
     */
    orientation: {
        get: function () {
            return this._orientation;
        },
        set: function (orientation) {
            if (this._orientation !== orientation) {
                this._orientation = orientation;
                this.needsDraw = true;
            }
        }
    },

    thumbElement: {
        value: void 0,
    },
    _spacer: {
        value: void 0,
    },
    thumbElements: {
        value: void 0,
    },
    trackElements: {
        value: void 0,
    },
    _values: {
        value: void 0,
    },
    values: {
        get: function() {
            return this._values;
        },
        set: function (values) {
            if (this._values !== values) {
                this._values = values;
                this.needsDraw = true;
            }
        }
    },
    _percentageValues: {
        value: void 0,
    },
    _previousPercentageValues: {
        value: void 0,
    },
    _translateComposers: {
        value: void 0,
    },
    _spacerMarginEnd: {
        value: void 0,
    },
    enterDocument: {
        value: function (firstTime) {
            this.super(firstTime);

            if (firstTime) {

                if(this.hasStandardElement) {
                    this.element.addEventListener('input', this);
                    this.element.addEventListener('change', this);

                    // read initial values from the input type=range
                    var used = this._propertyNamesUsed;
                    // if (!used._min) {
                    //     this.min = this.element.getAttribute('min') || this._min;
                    // }
                    // if (!used._max) {
                    //     this.max = this.element.getAttribute('max') || this._max;
                    // }
                    // if (!used._step) {
                    //     this.step = this.element.getAttribute('step') || this._step;
                    // }

                    if (!used._value) {
                        this.value = this.element.getAttribute('value') || this._value;
                    }
                    delete this._propertyNamesUsed;

                }
                else {
                    var isHorizontal = (this.orientation === "horizontal");

                    this.thumbElements = [];
                    this.trackElements = [];
                    var ownerDocument = this._element.ownerDocument,
                        fragment = ownerDocument.createDocumentFragment(),
                        spacer = this._spacer = this._element.firstElementChild,
                        dimensionLength = this._dimensionLength,
                        i=0, iThumbElement, offset = 0, iDimension = 0, iThumbWrapper, iTrackElement;

                    while((iThumbElement = spacer.firstElementChild)) {
                        if(!iThumbElement.classList.contains("montage-Slider--thumb"))
                            iThumbElement.classList.add("montage-Slider--thumb");

                        iThumbWrapper = ownerDocument.createElement("div");
                        iThumbWrapper.className = "montage-Slider--thumbWrapper";

                        iTrackElement = ownerDocument.createElement("div");
                        iTrackElement.className = "montage-Slider--track";


                        iDimension = isHorizontal ? iThumbElement.clientWidth : iThumbElement.clientHeight;
                        //If the thumb has no size, or if it's horizontak and occupy the whole width, we're stepping in
                        if(iDimension == 0 || (isHorizontal && iDimension === spacer.clientWidth)) {
                            iThumbElement.classList.add("montage-Slider-thumb--default");
                        }

                        iThumbElement.parentNode.removeChild(iThumbElement);
                        iThumbWrapper.appendChild(iThumbElement);
                        fragment.appendChild(iTrackElement);
                        fragment.appendChild(iThumbWrapper);
                        this.trackElements.push(iTrackElement);
                        this.thumbElements.push(iThumbWrapper);
                    }

                    //Last track element:
                    iTrackElement = ownerDocument.createElement("div");
                    iTrackElement.className = "montage-Slider--track";
                    fragment.appendChild(iTrackElement);
                    this.trackElements.push(iTrackElement);

                    spacer.appendChild(fragment);

                    i = 0;
                    while((iThumbWrapper = this.thumbElements[i++])) {
                        iThumbElement = iThumbWrapper.firstChild;
                        iDimension = isHorizontal ? iThumbElement.clientWidth : iThumbElement.clientHeight;
                        //If the thumb has no size, or if it's horizontak and occupy the whole width, we're stepping in

                        /* marginLeft / marginTop must be the width of all previous thumbs */
                        if(isHorizontal) {
                            iThumbWrapper.style.marginLeft = offset + "px";
                        }
                        else {
                            iThumbWrapper.style.marginTop = offset + "px";
                        }

                        offset += iDimension;
                        this._thumbElementOffset.set(iThumbElement,offset);
                        console.log(iThumbElement," offset is ",offset);
                    }

                    // this._thumbWidth = offset;
                    if(isHorizontal) {
                        spacer.style.marginRight = (this._spacerMarginEnd = offset) + "px";
                    }
                    else {
                        spacer.style.marginBottom = (this._spacerMarginEnd = offset) + "px";
                    }
                }

                // check for transform support. This should really be central and soon not needed anymore
                if("webkitTransform" in this.element.style) {
                    this._transform = "webkitTransform";
                } else if("MozTransform" in this.element.style) {
                    this._transform = "MozTransform";
                } else if("oTransform" in this.element.style) {
                    this._transform = "oTransform";
                } else {
                    this._transform = "transform";
                }

                this.element.setAttribute("role", "slider");
                this.element.tabIndex = "-1";

            }
        }
    },

    // @todo: Without prepareForActivationEvents, the _translateComposer does not work
    prepareForActivationEvents: {
        value: function () {
            this.super();

            if(!this.hasStandardElement) {

                var thumbElements = this.thumbElements;
                if(thumbElements && thumbElements.length > 0) {

                    if(!this._startTranslateValues) this._startTranslateValues = new Array(thumbElements.length);
                    if(!this._startValues) this._startValues = new Array(thumbElements.length);


                    this._translateComposers = new Map();

                    for(var i=0, iThumbElement, iTranslateComposer;(iThumbElement = thumbElements[i]);i++) {

                        //Setting up our TranslateComposer
                        iTranslateComposer = new TranslateComposer();
                        this._translateComposers.set(iTranslateComposer,i);
                        iTranslateComposer.identifier = "thumb-"+i;
                        iTranslateComposer.axis = this.orientation;
                        iTranslateComposer.hasMomentum = false;

                        this.addComposerForElement(iTranslateComposer, iThumbElement);
                        iTranslateComposer.addEventListener('translateStart', this, false);
                        iTranslateComposer.addEventListener('translate', this, false);
                        iTranslateComposer.addEventListener('translateEnd', this, false);
                    }

                    this._upKeyComposer = KeyComposer.createKey(this, "up", "increase");
                    this._downKeyComposer = KeyComposer.createKey(this, "down", "decrease");
                    this._rightKeyComposer = KeyComposer.createKey(this, "right", "increase");
                    this._leftKeyComposer = KeyComposer.createKey(this, "left", "decrease");

                    this._upKeyComposer.addEventListener("keyPress", this, false);
                    this._downKeyComposer.addEventListener("keyPress", this, false);
                    this._leftKeyComposer.addEventListener("keyPress", this, false);
                    this._rightKeyComposer.addEventListener("keyPress", this, false);

                }
            }
        }
    },

    _previousPercentage: {
        value: null
    },
    _dimensionLength : {
        get: function() {
            var computedStyle = window.getComputedStyle(this._element);
            return (this.orientation === "vertical")
            ? (
                this._spacer.clientHeight -
                parseFloat(computedStyle.getPropertyValue("padding-top")) -
                parseFloat(computedStyle.getPropertyValue("padding-bottom"))
            )
            : (
            this._spacer.clientWidth -
            parseFloat(computedStyle.getPropertyValue("padding-left")) -
            parseFloat(computedStyle.getPropertyValue("padding-right"))
            );
        }
    },
    _drawThumbElement: {
        value: function (thumbElement, index, isVertical, sliderMagnitude,previousThumbElement, length, cumulatedThumbSize) {
            var percent = this._percentageValues[index], position, positionString, trackElement = this.trackElements[index];

            if(isVertical) {
                if (this._isThumbElementTranslating.get(thumbElement)) {
                    position = (this._percentageValues[index] - this._previousPercentageValues[index]) * sliderMagnitude * 0.01;
                    positionString = "translate3d(0,";
                    positionString += position;
                    positionString += "px,0)";
                    thumbElement.style[this._transform] = positionString;
                } else {
                    thumbElement.style.top = (this._percentageValues[index]) + "%";
                    delete thumbElement.style.top;
                    thumbElement.style[this._transform] = "translate3d(0,0,0)";
                    this._previousPercentageValues[index] = this._percentageValues[index];
                }

                var trackElementLeftPercent = index === 0 ? 0 : this._percentageValues[index-1],
                    height = index ? percent-this._percentageValues[index-1] : percent;

                trackElement.style.top = trackElementLeftPercent+"%";
                trackElement.style.marginTop = cumulatedThumbSize+"px";

                trackElement.style.height = height+"%";

                //Last track part if at the end
                if((index+1) === length) {
                    trackElement = this.trackElements[index+1];
                    //We need the size of user-land element.
                    trackElement.style.top = percent+"%";
                    trackElement.style.marginTop = (cumulatedThumbSize + thumbElement.firstChild.clientHeight)+"px";
                    trackElement.style.height = 100-percent+"%";
                }

            }
            else {

                if (this._isThumbElementTranslating.get(thumbElement)) {
                    position = (this._percentageValues[index] - this._previousPercentageValues[index]) * sliderMagnitude * 0.01;

                    positionString = "translate3d(";
                    positionString += position;
                    positionString += "px,0,0)";
                    thumbElement.style[this._transform] = positionString;
                } else {
                    thumbElement.style.left = percent+"%";
                    delete thumbElement.style.top;
                    thumbElement.style[this._transform] = "translate3d(0,0,0)";
                    this._previousPercentageValues[index] = this._percentageValues[index];
                }

                var trackElementLeftPercent = index === 0 ? 0 : this._percentageValues[index-1],
                    width = index ? percent-this._percentageValues[index-1] : percent;

                trackElement.style.left = trackElementLeftPercent+"%";
                trackElement.style.marginLeft = cumulatedThumbSize+"px";

                trackElement.style.width = width+"%";

                //Last track part if at the end
                if((index+1) === length) {
                    trackElement = this.trackElements[index+1];
                    //We need the size of user-land element.
                    trackElement.style.left = percent+"%";
                    trackElement.style.marginLeft = (cumulatedThumbSize + thumbElement.firstChild.clientWidth)+"px";
                    trackElement.style.width = 100-percent+"%";
                }

            }

        }
    },
    draw: {
        value: function () {
            if(!this.hasStandardElement) {
                //console.log("this._values is ", this._values);
                var isVertical = (this.orientation === "vertical"),
                    sliderMagnitude = isVertical ? this._spacer.clientHeight: this._spacer.clientWidth;

                for(var i=0, iThumbElement, previousThumbElement = null, countI = this.thumbElements.length, cumulatedThumbSize = 0;(iThumbElement = this.thumbElements[i]);i++) {
                    this._drawThumbElement(iThumbElement,i,isVertical,sliderMagnitude,previousThumbElement, countI, cumulatedThumbSize);
                    cumulatedThumbSize += isVertical ? iThumbElement.firstChild.clientHeight : iThumbElement.firstChild.clientWidth;
                    previousThumbElement = iThumbElement;
                }
                this.element.setAttribute("aria-valuemax", this.max);
                this.element.setAttribute("aria-valuemin", this.min);
                this.element.setAttribute("aria-valuenow", this.value);
                this.element.setAttribute("aria-orientation", this.orientation);
            }
            else {
                if (this._value != this.element.value) {
                    this.element.value = (this._value == null ? '' : this._value);
                }
                this.element.setAttribute("max", this.max);
                this.element.setAttribute("min", this.min);
            }
        }
    },

    // Event Handlers

    acceptsActiveTarget: {
        value: true
    },

    _isThumbElementTranslating: {
        value: void 0
    },
    _startTranslateValues: {
        value: void 0
    },
    _startValues: {
        value: void 0
    },
    handleTranslateStart: {
        value: function (e) {
            this.active = true;
            var index = this._translateComposers.get(e.target);
            this._currentThumbIndex = index;
            if(this.orientation === "vertical") {
                this._startTranslateValues[index] = e.translateY;
            } else {
                this._startTranslateValues[index]= e.translateX;
            }
            this._startBoundingClientRect = e.target.element.clientX;
            this._startValues[index] = this.values[index];
        }
    },

    handleTranslate: {
        value: function (event) {
            var index = this._translateComposers.get(event.target),
                sliderMagnitude = this._dimensionLength,
                translate;
                //sliderMagnitude = this._calculateSliderMagnitude();
            this._currentThumbIndex = index;
            if(this.orientation === "vertical") {
                //this.value = this._startValues[index] + ((this._startTranslateValues[index] - event.translateY) / this._sliderMagnitude) * (this._max - this._min);
                translate = event.translateY;
            } else {
                translate = event.translateX;
            }
                // var max = this.values[index+1] || this._max,
                //     min = this.values[index-1] || this._min,
                //     diff = event.translateX - this._startTranslateValues[index];
                //
                // if(diff < min) diff = min;
                // else if(diff > max) diff = max;
                var max = this._max,
                    min = this._min,
                    value;
                value = this._startValues[index] + ((translate - this._startTranslateValues[index]) / sliderMagnitude) * (max - min);
                max = this.values[index+1];
                max = (typeof max === "number" ? max : this._max);
                min = this.values[index-1];
                min = (typeof min === "number" ? min : this._min);
                if(value <= min) value = min;
                else if(value > max) value = max;
                this.value = value;
                // console.log("this._startValues[index] is ",this._startValues[index], "event.translateX is ",event.translateX," this._startTranslateValues[index] is ",this._startTranslateValues[index],", sliderMagnitude is ",sliderMagnitude);
                // console.log("this.value = ",this.value, "min is ",min," max is ",max);

            this._isThumbElementTranslating.set(event.target.element,true)
        }
    },

    handleTranslateEnd: {
        value: function (e) {
            this.active = false;
            this._isThumbElementTranslating.set(e.target.element,false)

        }
    },

    _increase: {
        value: function () {
            var stepBase = (typeof this.min == "number") ? this.min : 0;
            var value = this.value - stepBase;
            var step =  this.step | (this.max-this.min)/100;
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
            var step =  this.step | (this.max-this.min)/100;
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
        value: function (event) {
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
            return !this.active;
            //return false;
        }
    },

    // Properties

    _min: {
        value: 0
    },

    _max: {
        value: 100
    },

    _step: {
        value: "any"
    },

    // min: {
    //     get: function () {
    //         return this._min;
    //     },
    //     set: function (value) {
    //         if (! isNaN(value = parseFloat(value))) {
    //             if (this._min !== value) {
    //                 this._min = value;
    //             }
    //         }
    //     }
    // },
    //
    // max: {
    //     get: function () {
    //         return this._max;
    //     },
    //     set: function (value) {
    //         if (! isNaN(value = parseFloat(value))) {
    //             if (this._max !== value) {
    //                 this._max = value;
    //             }
    //         }
    //     }
    // },

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

    _value: {
        get: function () {
            return this.values[this._currentThumbIndex];
        },
        set: function (value) {
            // this.values[this._currentThumbIndex] = value;
            this.values.set(this._currentThumbIndex, value)
        }
    },
/*

Should introduce a validate method

*/
    value: {
        get: function () {
            return this._value;
        },
        set: function (value) {
            if (! isNaN(value = parseFloat(value))) {
                if (value > this._max) {
                    value = this._max;
                } else if (value < this._min) {
                    value = this._min;
                }

                if (this._value !== value) {
                    Object.getOwnPropertyDescriptor(Control.prototype, "value").set.call(this,value);
                }
            }
        }
    },

    /**
     * Enables or disables the Button from user input. When this property is
     * set to `false`, the "disabled" CSS style is applied to the button's DOM
     * element during the next draw cycle. When set to `true` the "disabled"
     * CSS class is removed from the element's class list.
     * @type {boolean}
     */
    enabled: {
        value: true
    },

    axis: {
        value: null
    },

    // Machinery
    _currentThumbIndex:  {
        value: 0
    },
    thumbElement: {
        get: function() {
            return this.thumbElements[0];
        }
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

    _percentageValue: {
        value: null
    },


    handleAxisChange: {
        value: function () {
            if (this._translateComposer) {
                this._translateComposer.axis = this.orientation;
            }
            if(this.orientation === "vertical") {
                this.classList.add("montage-Slider--vertical");
                this.classList.remove("montage-Slider--horizontal");
            } else {
                this.classList.remove("montage-Slider--vertical");
                this.classList.add("montage-Slider--horizontal");
            }
        }
    },

    _propertyRegex: {
        value: /_sliderMagnitude|_min|_max|_value|_values|values|_step/
    },

    handlePropertyChange: {
        value: function (changeValue, key, object) {
            if(key.match(this._propertyRegex) !== null) {
                if(this._propertyNamesUsed) {
                    this._propertyNamesUsed[key] = true;
                }
                var MIN = this._min,
                    MAX = this._max,
                    RANGE = this._max - this._min,
                    valueOverriden = false;
                for(var i=0, values = this._values, countI = values.length, value, min, max;i<countI;i++) {
                    value = values[i];
                    max = values[i+1] || MAX;
                    min = values[i-1] || MIN;

                    //adjust the value
                    if (value <= min) {
                        //first the simple case
                        value = min;
                    } else {
                        var magnitude = value - min;
                        var remainder = magnitude % this._step;
                        if (remainder) {
                            //if we have a remainder then we need to adjust the value
                            // Inspired by http://www.w3.org/html/wg/drafts/html/master/forms.html#range-state-(type=range)
                            // if we are in the middle of two stepped value then go for the larger one.
                            var roundup = (remainder >= this._step * 0.5) && ((value - remainder) + this._step <= max);
                            if (roundup) {
                                value = (value - remainder) + this._step;
                            } else {
                                value = value - remainder;
                            }
                        }

                    }

                    //otherwise don't adjust the value just check it's within  min and max
                    if (value > max) {
                        value = max;
                    }

                    values[i] = value;
                    if(i === this._currentThumbIndex) {
                        this._value = value;
                    }

                    if(valueOverriden) {
                        values[i] = value;
                    }

                    this._percentageValues[i] = ((value - MIN) * 100) / RANGE;
                }
                this.needsDraw = true;
            }
        }
    },
    handleInput: {
        enumerable: false,
        value: function() {
            if (this.converter) {
                if (this.converter.allowPartialConversion === true && this.updateOnInput === true) {
                    this.takeValueFromElement();
                }
            } else {
                this.takeValueFromElement();
            }
        }
    },
/**
    Description TODO
    @function
    @param {Event Handler} event TODO
    */
    handleChange: {
        enumerable: false,
        value: function(event) {
            this.takeValueFromElement();
            //this.dispatchActionEvent();
            // this.hasFocus = false;
        }
    }


});

Slider.addAttributes( /** @lends module:"montage/ui/native/input-range.reel".InputRange# */ {
/**
    The maximum value displayed but the input control.
    @type {number}
    @default null
*/
    max: {
        dataType: 'number',
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

/**
    The minimum value displayed but the input control.
    @type {number}
    @default null
*/
    min: {
        dataType: 'number',
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

/**
    The amount the number changes with each step. The step size can be a number, or the string 'any'.
    @type {number|string}
    @default null
*/
    step: null // number or 'any'
});
