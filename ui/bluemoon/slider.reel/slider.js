/* <copyright>
Copyright (c) 2012, Motorola Mobility LLC.
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of Motorola Mobility LLC nor the names of its
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */
/*global WebKitPoint */
/**
    @module "montage/ui/bluemoon/slider.reel"
    @requires montage/core/core
    @requires montage/ui/dom
    @requires montage/ui/component
    @requires montage/core/geometry/point
*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    dom = require("ui/dom"),
    Point = require("core/geometry/point").Point;

/**
 @class module:"montage/ui/bluemoon/slider.reel".Slider
 @extends module:montage/ui/component.Component
 */
exports.Slider = Montage.create(Component,/** @lends module:"montage/ui/bluemoon/slider.reel".Slider# */ {
    // Extra elements for rendering

    _bghl: {
        value: null
    },

    _handlerbg: {
        value: null
    },

    _bg: {
        value: null
    },

    _handler: {
        value: null
    },

    _line: {
        value: null
    },

    _scale: {
        value: null
    },

    _line2: {
        value: null
    },

    _handler2: {
        value: null
    },

    _handler3: {
        value: null
    },

    _handler4: {
        value: null
    },

    _handlerDragArea: {
        value: null
    },
    // Slider properties

    _isDragging: {
        value: null
    },

    _cursorPosition: {
        value: null
    },

    _width: {
        value: 0
    },

    _minValue: {
        value: 0
    },

    _hasTapBarToScroll: {
        value: false
    },

    /**
        Description TODO
        @type {Function}
        @default {Boolean} false
    */
    hasTapBarToScroll: {
        get: function () {
            return this._hasTapBarToScroll;
        },
        set: function (value) {
            this._hasTapBarToScroll = !!value;
        }
    },

    _hasClickBarToScroll: {
        value: true
    },
/**
        Description TODO
        @type {Function}
        @default {Boolean} true
    */
    hasClickBarToScroll: {
        get: function () {
            return this._hasClickBarToScroll;
        },
        set: function (value) {
            this._hasClickBarToScroll = !!value;
        }
    },
/**
        Description TODO
        @type {Function}
        @default {Number} 0
    */
    minValue: {
        get: function () {
            return this._minValue;
        },
        set: function (value) {
            if (value !== this._minValue) {
                if(String.isString(value)) {
                    value = parseFloat(value);
                }
                this._minValue = value;
                this._valueRange = null;
                this.needsDraw = true;
            }
        }
    },

    _maxValue: {
        value: 100
    },

/**
        Description TODO
        @type {Function}
        @default {Number} 100
    */
    maxValue: {
        get: function () {
            return this._maxValue;
        },
        set: function (value) {
            if (value !== this._maxValue) {
                if(String.isString(value)) {
                    value = parseFloat(value);
                }
                this._maxValue = value;
                this._valueRange = null;
                this.needsDraw = true;
            }
        }
    },

    _valueRange: {
        value: null
    },

    /**
        Description TODO
        @type {Function}
        @default null
    */
    valueRange: {
        get: function () {
            if (!this._valueRange) {
                this._valueRange = this._maxValue - this._minValue;
            }
            return this._valueRange;
        }
    },

    _value: {
        value: 0
    },

    _observedPointer: {
        value: null
    },

    /**
        Description TODO
        @type {Function}
        @default {Number} 0
    */
    value: {
        get: function () {
            if (this._value < this._minValue) {
                return this._minValue;
            } else if (this._value > this._maxValue) {
                return this._maxValue;
            }
            return this._value;
        },
        set: function (value) {
            if (!isNaN(value)) {
                if(String.isString(value)) {
                    value = parseFloat(value);
                }
                if (value !== this._value) {
                    this._value = parseFloat(value);
                    this.needsDraw = true;
                }
            }
        }
    },

    step: {
        value: null
    },

    _pressed: {
        value: false
    },

    _scrollTo: {
        value: null
    },

    /**
    Description TODO
    @function
    @param {Event} event TODO
    */
    handleTouchstart: {
        value: function (event) {
            this._pressedEnd = false;
            this._pressedStart = true;
            if (event.target === this._handlerDragArea.firstChild) {

                this._observePointer(event.targetTouches[0].identifier);
                if (this._value < this._minValue) {
                    this._value = this._minValue;
                } else if (this._value > this._maxValue) {
                    this._value = this._maxValue;
                }
                document.addEventListener("touchmove", this, false);
                document.addEventListener("touchend", this, false);
                this._cursorPosition = event.targetTouches[0].clientX;
                event.preventDefault();
                event.stopPropagation();
                this.needsDraw = true;
            } else {
                var zero = new WebKitPoint(0, 0), scale, elemPos;

                this._observePointer(event.targetTouches[0].identifier);
                scale = (dom.convertPointFromNodeToPage(this._scale, zero).x - dom.convertPointFromNodeToPage(this._scale.parentNode, zero).x) / 10000;
                elemPos = dom.convertPointFromNodeToPage(this.element, zero);
                var x = event.targetTouches[0].pageX - Math.ceil(elemPos.x / scale),
                    y = event.targetTouches[0].pageY - Math.ceil(elemPos.y / scale);

                if ((y >= 12) && (y < 45) && (x >= 19) && (x < this._width + 39)) {
                    this._scrollTo = (x - 28) * this.valueRange;
                    document.addEventListener("touchmove", this, false);
                    document.addEventListener("touchend", this, false);
                    this._cursorPosition = event.targetTouches[0].clientX;
                    event.preventDefault();
                    event.stopPropagation();
                    this.needsDraw = true;
                }
            }
        }
    },

    /**
    Description TODO
    @function
    @param {Event} event TODO
    */
    handleTouchmove: {
        value: function (event) {
            var i = 0, changedTouches = event.changedTouches, length = changedTouches.length;

            while ((i < length) && (changedTouches[i].identifier !== this._observedPointer)) {
                i++;
            }
            if (i < length) {
                this.value = this._value + ((changedTouches[i].clientX - this._cursorPosition) * (this.valueRange)) / this._width;
                this._cursorPosition = changedTouches[i].clientX;
                event.preventDefault();
                this.needsDraw = true;
            }
            this._pressedStart = false;
        }
    },

    /**
    Description TODO
    @function
    */
    handleTouchend: {
        value: function () {
            var i = 0, length = event.changedTouches.length;

            while ((i < length) && (event.changedTouches[i].identifier !== this._observedPointer)) {
                i++;
            }
            if (i < length) {
                document.removeEventListener("touchmove", this, false);
                document.removeEventListener("touchend", this, false);
                this._releaseInterest();
                this.needsDraw = true;
                this._pressedStart = false;
                this._pressedEnd = true;
            }
        }
    },

    /**
    Description TODO
    @function
    @param {Event} event TODO
    */
    handleMousedown: {
        value: function (event) {
            if (event.target === this._handlerDragArea.firstChild) {
                if (this._value < this._minValue) {
                    this._value = this._minValue;
                } else if (this._value > this._maxValue) {
                    this._value = this._maxValue;
                }
                this._observePointer("mouse");
                document.addEventListener("mousemove", this, false);
                document.addEventListener("mouseup", this, false);
                this._cursorPosition = event.clientX;
                event.preventDefault();
                event.stopPropagation();
                this._pressedEnd = false;
                this._pressedStart = true;
                this.needsDraw = true;
            } else {
                var zero = Point.create().init(0, 0),
                    scale = (dom.convertPointFromNodeToPage(this._scale, zero).x - dom.convertPointFromNodeToPage(this._scale.parentNode, zero).x) / 10000,
                    elemPos = dom.convertPointFromNodeToPage(this.element, zero);
                var x = event.pageX - Math.ceil(elemPos.x / scale),
                    y = event.pageY - Math.ceil(elemPos.y / scale);


                if ((y >= 12) && (y < 45) && (x >= 19) && (x < this._width + 39)) {
                    this._scrollTo = (x - 28) * this.valueRange;
                    this._observePointer("mouse");
                    document.addEventListener("mousemove", this, false);
                    document.addEventListener("mouseup", this, false);
                    this._cursorPosition = event.clientX;
                    event.preventDefault();
                    event.stopPropagation();
                    this._pressedEnd = false;
                    this._pressedStart = true;
                    this.needsDraw = true;
                }
            }
        }
    },

    /**
    Description TODO
    @function
    @param {Event} event TODO
    */
    handleMousemove: {
        value: function (event) {
            this.value = this._value + ((event.clientX - this._cursorPosition) * (this.valueRange)) / this._width;

            this._cursorPosition = event.clientX;
            event.preventDefault();
            event.stopPropagation();
            this._pressedStart = false;
            this.needsDraw = true;
        }
    },

    /**
    Description TODO
    @function
    */
    handleMouseup: {
        value: function () {
            document.removeEventListener("mousemove", this, false);
            document.removeEventListener("mouseup", this, false);

            this._releaseInterest();

            this.needsDraw = true;
            this._pressedStart = false;
            this._pressedEnd = true;
        }
    },

    surrenderPointer: {
        value: function(pointer, demandingComponent) {
            return false;
        }
    },

    _observePointer: {
        value: function(pointer) {
            this.eventManager.claimPointer(pointer, this);
            this._observedPointer = pointer;

            var interactionStartEvent = document.createEvent("CustomEvent");
            interactionStartEvent.initCustomEvent("montageinteractionstart", true, true, null);
            this.dispatchEvent(interactionStartEvent);
        }
    },

    _releaseInterest: {
        value: function() {
            this.eventManager.forfeitPointer(this._observedPointer, this);
            this._observedPointer = null;

            var interactionEndEvent = document.createEvent("CustomEvent");
            interactionEndEvent.initCustomEvent("montageinteractionend", true, true, null);
            this.dispatchEvent(interactionEndEvent);
        }
    },

    prepareForActivationEvents: {
        value: function() {
            if (window.Touch) {
                this._handlerDragArea.addEventListener("touchstart", this, false);
                if (this._hasTapBarToScroll) {
                    this.element.addEventListener("touchstart", this, false);
                }
            }
            this._handlerDragArea.addEventListener("mousedown", this, false);
            if (this._hasClickBarToScroll) {
                this.element.addEventListener("mousedown", this, false);
            }
        }
    },

    // used in draw() to do the slider animation in diff. browsers
    _transform: { value: null },
    _transition: { value: null },
    prepareForDraw: {
        value: function() {
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
            // check for transition support
            if("webkitTransition" in this.element.style) {
                this._transition = "webkitTransition";
            } else if("MozTransition" in this.element.style ) {
                this._transition = "MozTransition";
            } else if("oTransition" in this.element.style ) {
                this._transition = "oTransition";
            } else {
                this._transition = "transition";
            }
        }
    },

    willDraw: {
        value: function () {
            this._width = this.element.offsetWidth - 55;
            if (this._scrollTo !== null) {
                this.value = this._minValue + (this._scrollTo / this._width);
                this._scrollTo = null;
            }
        }
    },

    draw: {
        value: function() {

            /*
             ~~ is vastly faster then Math.floor

             http://jsperf.com/math-floor-vs-math-round-vs-parseint/8
             */
            var transform = this._transform, transition = this._transition;
            this._handlerbg.style[transform] =
                this._handler.style[transform] =
                    this._handler2.style[transform] =
                        this._handler3.style[transform] =
                            this._handler4.style[transform] =
                                this._line.style[transform] =
                                    this._line2.style[transform] =
                                        this._handlerDragArea.style[transform] = "translate3d(" + (~~(((this.value - this._minValue) * this._width) / this.valueRange) * 100 / this._width) + "%, 0, 0)";

            if (this._pressedStart) {
                this.element.classList.add("pressed");
                this._handlerbg.firstChild.style[transition] =
                    this._handler.firstChild.style[transition] =
                        this._handler2.firstChild.style[transition] =
                            this._handler3.firstChild.style[transition] =
                                this._handler4.firstChild.style[transition] = "150ms all";
            } else if (this._pressedEnd) {
                this.element.classList.remove("pressed");
            }
        }
    }
});
