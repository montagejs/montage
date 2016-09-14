/*global require,exports */

/**
    @module "montage/ui/native/input-range.reel"
*/

var Control = require("ui/control").Control,
    TranslateComposer = require("../../composer/translate-composer").TranslateComposer,
    KeyComposer = require("../../composer/key-composer").KeyComposer,
    Map = require("collections/map"),
    WeakMap = require("collections/weak-map"),
    MONTAGE_SLIDER_THUMB_CLASS = "montage-Slider--thumb";

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
            this._values = [50];

            this._isThumbElementTranslating = new WeakMap();
            this._percentageValues = new Array();
            this._previousPercentageValues = new Array();

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
    thumbWrappers: {
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
            return this._values || (this._values = [50]);
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

                    this.thumbWrappers= [];
                    this.thumbElements = [];
                    this.trackElements = [];
                    var ownerDocument = this._element.ownerDocument,
                        fragment = ownerDocument.createDocumentFragment(),
                        spacer = this._spacer = this._element.firstElementChild,
                        dimensionLength = this._dimensionLength,
                        i=0, iThumbElement, offset = 0, iDimension = 0, iThumbWrapper, iTrackElement, iThumbElementWithClass;

                    while((iThumbElement = spacer.firstElementChild)) {
                        //If iThumbElement has no childElement, it got to be the thumb
                        if(!iThumbElement.firstElementChild) {
                            //If it doesn't have the required flag MONTAGE-SLIDER-THUMB-CLASS
                            //We'll gladly fix it, but that's as far as we can go
                            if(!iThumbElement.classList.contains(MONTAGE_SLIDER_THUMB_CLASS)) {
                                iThumbElement.classList.add(MONTAGE_SLIDER_THUMB_CLASS);
                            }
                            iThumbElementWithClass = iThumbElement;
                        }
                        else {
                            iThumbElementWithClass = iThumbElement.getElementsByClassName(MONTAGE_SLIDER_THUMB_CLASS)[0];
                            if(!iThumbElementWithClass) {
                                throw new Error("Slider couldn't identify a thumb element with "+MONTAGE_SLIDER_THUMB_CLASS+" class");
                            }
                        }

                        iThumbWrapper = ownerDocument.createElement("div");
                        iThumbWrapper.className = "montage-Slider--thumbWrapper";

                        iTrackElement = ownerDocument.createElement("div");
                        iTrackElement.className = "montage-Slider--track";
                        iTrackElement.setAttribute("data-montage-index",i);

                        iDimension = isHorizontal ? iThumbElementWithClass.offsetWidth : iThumbElementWithClass.offsetHeight;
                        //If the thumb has no size, or if it's horizontak and occupy the whole width, we're stepping in
                        if(iDimension == 0 || (isHorizontal && iDimension === spacer.offsetWidth)) {
                            iThumbElementWithClass.classList.add("montage-Slider-thumb--default");
                        }

                        iThumbElement.parentNode.removeChild(iThumbElement);
                        iThumbWrapper.appendChild(iThumbElement);
                        fragment.appendChild(iTrackElement);
                        fragment.appendChild(iThumbWrapper);
                        this.trackElements.push(iTrackElement);
                        this.thumbWrappers.push(iThumbWrapper);
                        this.thumbElements.push(iThumbElementWithClass);

                        i++;
                    }

                    //Last track element:
                    iTrackElement = ownerDocument.createElement("div");
                    iTrackElement.className = "montage-Slider--track";
                    fragment.appendChild(iTrackElement);
                    this.trackElements.push(iTrackElement);

                    spacer.appendChild(fragment);

                    i = 0;
                    while((iThumbWrapper = this.thumbWrappers[i])) {
                        iThumbElement = this.thumbElements[i];

                        iDimension = isHorizontal ? iThumbElement.offsetWidth : iThumbElement.offsetHeight;
                        // //If the thumb has no size, or if it's horizontak and occupy the whole width, we're stepping in
                        // if(iDimension == 0 || (isHorizontal && iDimension === spacer.offsetWidth)) {
                        //     iThumbElement.classList.add("montage-Slider-thumb--default");
                        // }

                        /* marginLeft / marginTop must be the width of all previous thumbs */
                        if(isHorizontal) {
                            iThumbWrapper.style.marginLeft = offset + "px";
                        }
                        else {
                            iThumbWrapper.style.marginTop = offset + "px";
                        }

                        offset += iDimension;
                        i++;
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

                //Loosk like this should be 0. And when there are multiple thumbs then it should be -1 and each thumb should have a tabIndex of 0
                this.element.tabIndex = "-1";

            }
        }
    },

    // @todo: Without prepareForActivationEvents, the _translateComposer does not work
    prepareForActivationEvents: {
        value: function () {
            this.super();

            if(!this.hasStandardElement) {

                var thumbWrappers = this.thumbWrappers;
                if(thumbWrappers && thumbWrappers.length > 0) {

                    if(!this._startTranslateValues) this._startTranslateValues = new Array(thumbWrappers.length);
                    if(!this._startValues) this._startValues = new Array(thumbWrappers.length);


                    this._translateComposers = new Map();

                    for(var i=0, iThumbElement, iTranslateComposer;(iThumbElement = thumbWrappers[i]);i++) {

                        //Setting up our TranslateComposer
                        iTranslateComposer = new TranslateComposer();
                        this._translateComposers.set(iTranslateComposer,i);
                        iTranslateComposer.identifier = "thumb-"+i;
                        iTranslateComposer.axis = this.orientation;
                        iTranslateComposer.hasMomentum = false;

                        this.addComposerForElement(iTranslateComposer, iThumbElement.firstChild);
                        iTranslateComposer.addEventListener('translateStart', this, false);
                        iTranslateComposer.addEventListener('translate', this, false);
                        iTranslateComposer.addEventListener('translateEnd', this, false);
                    }

                    //We're missing pageUp and pageDown that would bring slider to max/min
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
            return (this.orientation === this._VERTICAL)
            ? (
                this._spacer.offsetHeight -
                parseFloat(computedStyle.getPropertyValue("padding-top")) -
                parseFloat(computedStyle.getPropertyValue("padding-bottom"))
            )
            : (
            this._spacer.offsetWidth -
            parseFloat(computedStyle.getPropertyValue("padding-left")) -
            parseFloat(computedStyle.getPropertyValue("padding-right"))
            );
        }
    },
    _VERTICAL: {
        value: "vertical"
    },
    _PERCENT_UNIT: {
        value: "%"
    },
    _PIXEL_UNIT: {
        value: "px"
    },
    _TRANSLATE_RESET: {
        value: "translate3d(0,0,0)"
    },
    _TRANSLATE_VERTICAL_PREFIX: {
        value: "translate3d(0,"
    },
    _TRANSLATE_VERTICAL_SUFFIX: {
        value: "px,0)"
    },
    _TRANSLATE_HORIZONTAL_PREFIX: {
        value: "translate3d("
    },
    _TRANSLATE_HORIZONTAL_SUFFIX: {
        value: "px,0,0)"
    },
    _drawThumbElement: {
        value: function (thumbElementWrapper, thumbElement, index, isVertical, sliderMagnitude, length, cumulatedThumbSize, thumbElementOffsetSize) {
            var percent = this._percentageValueAt(index), position, positionString, trackElement = this.trackElements[index];

            if(isVertical) {
                if (this._isThumbElementTranslating.get(thumbElementWrapper)) {
                    position = (this._percentageValueAt(index) - this._previousPercentageValues[index]) * sliderMagnitude * 0.01;
                    positionString = this._TRANSLATE_VERTICAL_PREFIX;
                    positionString += position;
                    positionString += this._TRANSLATE_VERTICAL_SUFFIX;
                    thumbElementWrapper.style[this._transform] = positionString;
                } else {
                    thumbElementWrapper.style.top = percent + this._PERCENT_UNIT;
                    delete thumbElementWrapper.style.left;
                    thumbElementWrapper.style[this._transform] = this._TRANSLATE_RESET;
                    this._previousPercentageValues[index] = this._percentageValueAt(index);
                }

                var trackElemenTopPercent = index === 0 ? 0 : this._percentageValueAt(index-1),
                    height = index ? percent-this._percentageValueAt(index-1) : percent;

                trackElement.style.top = trackElemenTopPercent+this._PERCENT_UNIT;
                trackElement.style.marginTop = cumulatedThumbSize+this._PIXEL_UNIT;

                trackElement.style.height = height+this._PERCENT_UNIT;

                //Last track part if at the end
                if((index+1) === length) {
                    trackElement = this.trackElements[index+1];
                    //We need the size of user-land element.
                    trackElement.style.top = percent+this._PERCENT_UNIT;
                    trackElement.style.marginTop = (cumulatedThumbSize + thumbElementOffsetSize)+this._PIXEL_UNIT;
                    trackElement.style.height = 100-percent+this._PERCENT_UNIT;
                }

            }
            else {

                if (this._isThumbElementTranslating.get(thumbElementWrapper)) {
                    position = (this._percentageValueAt(index) - this._previousPercentageValues[index]) * sliderMagnitude * 0.01;

                    positionString = this._TRANSLATE_HORIZONTAL_PREFIX;
                    positionString += position;
                    positionString += this._TRANSLATE_HORIZONTAL_SUFFIX;
                    thumbElementWrapper.style[this._transform] = positionString;
                } else {
                    thumbElementWrapper.style.left = percent+this._PERCENT_UNIT;
                    delete thumbElementWrapper.style.top;
                    thumbElementWrapper.style[this._transform] = this._TRANSLATE_RESET;
                    this._previousPercentageValues[index] = this._percentageValueAt(index);
                }

                var trackElementLeftPercent = index === 0 ? 0 : this._percentageValueAt(index-1),
                    width = index ? percent-this._percentageValueAt(index-1) : percent;

                trackElement.style.left = trackElementLeftPercent+this._PERCENT_UNIT;
                trackElement.style.marginLeft = cumulatedThumbSize+this._PIXEL_UNIT;

                trackElement.style.width = width+this._PERCENT_UNIT;

                //Last track part if at the end
                if((index+1) === length) {
                    trackElement = this.trackElements[index+1];
                    //We need the size of user-land element.
                    trackElement.style.left = percent+this._PERCENT_UNIT;
                    trackElement.style.marginLeft = (cumulatedThumbSize + thumbElementOffsetSize)+this._PIXEL_UNIT;
                    trackElement.style.width = 100-percent+this._PERCENT_UNIT;
                }

            }

        }
    },
    draw: {
        value: function () {
            var value = this.value;

            if(!this.hasStandardElement) {
                //console.log("this._values is ", this._values);
                var isVertical = (this.orientation === this._VERTICAL),
                    sliderMagnitude = isVertical ? this._spacer.offsetHeight: this._spacer.offsetWidth;

                for(var i=0, iThumbElementWrapper, iThumbElement, iThumbElementOffsetSize, countI = this.thumbWrappers.length, cumulatedThumbSize = 0;(iThumbElementWrapper = this.thumbWrappers[i]);i++) {
                    iThumbElement = this.thumbElements[i];
                    iThumbElementOffsetSize = isVertical ? iThumbElement.offsetHeight : iThumbElement.offsetWidth;
                    this._drawThumbElement(iThumbElementWrapper,iThumbElement, i,isVertical,sliderMagnitude, countI, cumulatedThumbSize, iThumbElementOffsetSize);
                    cumulatedThumbSize += iThumbElementOffsetSize;
                }
                this.element.setAttribute("aria-valuemax", this.max);
                this.element.setAttribute("aria-valuemin", this.min);
                this.element.setAttribute("aria-valuenow", value);
                this.element.setAttribute("aria-orientation", this.orientation);
            }
            else {
                if (value != this.element.value) {
                    this.element.value = (value == null ? '' : value);
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
            if(this.orientation === this._VERTICAL) {
                this._startTranslateValues[index] = e.translateY;
            } else {
                this._startTranslateValues[index]= e.translateX;
            }
            this._startValues[index] = this.values[index]||0;
        }
    },

    handleTranslate: {
        value: function (event) {
            var index = this._translateComposers.get(event.target),
                sliderMagnitude = this._dimensionLength,
                translate;
                //sliderMagnitude = this._calculateSliderMagnitude();
            this._currentThumbIndex = index;
            if(this.orientation === this._VERTICAL) {
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
            //TODO: active should only be false when none of the thumbs are being interacted with.
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
        value: "any" //???
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
            this.values.set(this._currentThumbIndex, value)
        }
    },
/*

Should introduce a validate method

*/
    value: {
        get: function () {
            if (this._value > this._max) {
                return this._max;
            } else if (this._value < this._min) {
                return this._min;
            }
            
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

    /* this should be renamed orientation */
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

    /* Axis should be renamed orientation and a setter should be put in place for  
        backward compatibility
    */

    handleAxisChange: {
        value: function () {
            //TODO: this should handle all the thumb's translate composer
            if (this._translateComposer) {
                this._translateComposer.axis = this.orientation;
            }
            if(this.orientation === this._VERTICAL) {
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
                for(var i=0, values = this.values, countI = values.length, value, min, max;i<countI;i++) {
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

    _percentageValueAt: {
        value: function (index) {
            var value = this._percentageValues[index];
            return value > 100 ? 100 : (value < 0 ? 0 : value);
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
    }

});
