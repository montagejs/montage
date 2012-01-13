/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
	@module "montage/ui/slider.reel"
    @requires montage/core/core
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    dom = require("ui/dom"),
    Point = require("core/geometry/point").Point;

/**
 @class module:"montage/ui/slider.reel".Slider
 @extends module:montage/ui/component.Component
 */
exports.Slider = Montage.create(Component,/** @lends module:"montage/ui/slider.reel".Slider# */ {
    // Extra elements for rendering
/**
  Description TODO
  @private
*/
    _bghl: {
        enumerable: false,
        value: null
    },
/**
  Description TODO
  @private
*/
    _handlerbg: {
        enumerable: false,
        value: null
    },
/**
  Description TODO
  @private
*/
    _bg: {
        enumerable: false,
        value: null
    },
/**
  Description TODO
  @private
*/
    _handler: {
        enumerable: false,
        value: null
    },
/**
  Description TODO
  @private
*/
    _line: {
        enumerable: false,
        value: null
    },
/**
  Description TODO
  @private
*/
    _scale: {
        enumerable: false,
        value: null
    },
/**
  Description TODO
  @private
*/
    _line2: {
        enumerable: false,
        value: null
    },
/**
  Description TODO
  @private
*/
    _handler2: {
        enumerable: false,
        value: null
    },
/**
  Description TODO
  @private
*/
    _handler3: {
        enumerable: false,
        value: null
    },
/**
  Description TODO
  @private
*/
    _handler4: {
        enumerable: false,
        value: null
    },
/**
  Description TODO
  @private
*/
    _handlerDragArea: {
        enumerable: false,
        value: null
    },
    // Slider properties
/**
  Description TODO
  @private
*/
    _isDragging: {
        enumerable: true,
        value: null
    },
/**
  Description TODO
  @private
*/
    _cursorPosition: {
        enumerable: false,
        value: null
    },
/**
  Description TODO
  @private
*/
    _width: {
        enumerable: false,
        value: 0
    },
/**
  Description TODO
  @private
*/
    _minValue: {
        enumerable: false,
        value: 0
    },
/**
  Description TODO
  @private
*/
    _hasTapBarToScroll: {
        enumerable: false,
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
/**
  Description TODO
  @private
*/
    _hasClickBarToScroll: {
        enumerable: false,
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
            if (this._hasClickBarToScroll) {
                this.element.addEventListener("mousedown", this, false);
            } else {
                this.element.removeEventListener("mousedown", this, false);
            }
        }
    },
/**
        Description TODO
        @type {Function}
        @default {Number} 0
    */
    minValue: {
        serializable: true,
        get: function () {
            return this._minValue;
        },
        set: function (value) {
            if (value !== this._minValue) {
                this._minValue = value;
                this._valueRange = null;
                this.needsDraw = true;
            }
        }
    },
/**
  Description TODO
  @private
*/
    _maxValue: {
        enumerable: false,
        value: 100
    },

/**
        Description TODO
        @type {Function}
        @default {Number} 100
    */
    maxValue: {
        serializable: true,
        get: function () {
            return this._maxValue;
        },
        set: function (value) {
            if (value !== this._maxValue) {
                this._maxValue = value;
                this._valueRange = null;
                this.needsDraw = true;
            }
        }
    },
/**
  Description TODO
  @private
*/
    _valueRange: {
        enumerable: false,
        value: undefined
    },
 /**
        Description TODO
        @type {Function}
        @default undefined
    */
    valueRange: {
        enumerable: false,
        get: function () {
            if (!this._valueRange) {
                this._valueRange = this._maxValue - this._minValue;
            }
            return this._valueRange;
        }
    },
/**
  Description TODO
  @private
*/
    _value: {
        enumerable: false,
        value: 0
    },
/**
  Description TODO
  @private
*/
    _observedPointer: {
        enumerable: false,
        value: null
    },
/**
        Description TODO
        @type {Function}
        @default {Number} 0
    */
    value: {
        enumerable: true,
        serializable: true,
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
                if (value !== this._value) {
                    this._value = parseFloat(value);
                    this.needsDraw = true;
                }
            }
        }
    },
/**
  Description TODO
  @private
*/
    _pressed: {
        enumerable: false,
        value: false
    },
/**
  Description TODO
  @private
*/
    _scrollTo: {
        enumerable: false,
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
/**
    Description TODO
    @function
    @param {String} pointer TODO
    @param {Component} demandingComponent TODO
    @returns {Boolean} false
    */
    surrenderPointer: {
        value: function(pointer, demandingComponent) {
            return false;
        }
    },
/**
  Description TODO
  @private
*/
    _observePointer: {
        value: function(pointer) {
            this.eventManager.claimPointer(pointer, this);
            this._observedPointer = pointer;

            var interactionStartEvent = document.createEvent("CustomEvent");
            interactionStartEvent.initCustomEvent("montageinteractionstart", true, true, null);
            this.dispatchEvent(interactionStartEvent);
        }
    },
/**
  Description TODO
  @private
*/
    _releaseInterest: {
        value: function() {
            this.eventManager.forfeitPointer(this._observedPointer, this);
            this._observedPointer = null;

            var interactionEndEvent = document.createEvent("CustomEvent");
            interactionEndEvent.initCustomEvent("montageinteractionend", true, true, null);
            this.dispatchEvent(interactionEndEvent);
        }
    },
/**
    Description TODO
    @function
    */
    prepareForActivationEvents: {
        enumerable: false,
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
/**
    Description TODO
    @function
    */
    willDraw: {
        enumerable: false,
        value: function () {
            this._width = this.element.offsetWidth - 55;
            if (this._scrollTo !== null) {
                this.value = this._minValue + (this._scrollTo / this._width);
                this._scrollTo = null;
            }
        }
    },
/**
    Description TODO
    @function
    */
    draw: {
        value: function() {

            /*
             ~~ is vastly faster then Math.floor

             http://jsperf.com/math-floor-vs-math-round-vs-parseint/8
             */
            this._handlerbg.style.webkitTransform =
                this._handler.style.webkitTransform =
                    this._handler2.style.webkitTransform =
                        this._handler3.style.webkitTransform =
                            this._handler4.style.webkitTransform =
                                this._line.style.webkitTransform =
                                    this._line2.style.webkitTransform =
                                        this._handlerDragArea.style.webkitTransform = "translate3d(" + (~~(((this.value - this._minValue) * this._width) / this.valueRange) * 100 / this._width) + "%, 0, 0)";

            if (this._pressedStart) {
                this.element.classList.add("pressed");
                this._handlerbg.firstChild.style.webkitTransition =
                    this._handler.firstChild.style.webkitTransition =
                        this._handler2.firstChild.style.webkitTransition =
                            this._handler3.firstChild.style.webkitTransition =
                                this._handler4.firstChild.style.webkitTransition = "150ms all";
            } else if (this._pressedEnd) {
                this.element.classList.remove("pressed");
            }
        }
    }
});
