/**
 * @module ui/rating-bar.reel
 * @requires montage/ui/component
 */
var Component = require("ui/component").Component,
    RatingBarItem = require("ui/rating-bar.reel/rating-bar-item.reel").RatingBarItem,

    DEFAULT_ITEM_NUMBER = 5;

/**
 * @class RatingBar
 * @extends Component
 */
exports.RatingBar = Component.specialize(/** @lends RatingBar# */ {


    /**
     * The rating value.
     *
     * @type {number}
     * @default 0
     */
    value: {
        set: function(value) {
            // Make sure the rating value is set during the deserialization
            // when the component is in read only mode.
            if (!isNaN(value) && (!this.readOnly|| this.isDeserializing)) {
                value = +value;

                // Don't check if the new value is different from the older one
                // in order to be able to set it again from the UI.
                if (value >= 0) {
                    this._value = value > this._itemCount ? this._itemCount : value;
                    this.needsDraw = true;
                }
            }
        },
        get: function() {
            return this._value;
        }
    },


    _value: {
        value: 0
    },


    /**
     * The number of "item".
     *
     * @type {number}
     * @default 5
     */
    itemCount: {
        set: function(itemCount) {
            if (!isNaN(itemCount)) {
                itemCount = ~~itemCount;

                if (itemCount > 0 && this._itemCount !== itemCount) {
                    this._itemCount = itemCount;
                    this._value = 0; // reset the rating value.
                    this.needsDraw = true;
                }
            }
        },
        get: function() {
            return this._itemCount;
        }
    },


    _itemCount: {
        value: DEFAULT_ITEM_NUMBER
    },


    /**
     * The user cannot modify the rating value whether its value is set to true.
     *
     * @type {Boolean}
     * @default false
     */
    readOnly: {
        set: function(readOnly) {
            readOnly = !!readOnly;

            if (this._readOnly !== readOnly) {
                this._readOnly = readOnly;

                if (this._readOnly) {
                    this.classList.add("readOnly");
                    this._preventRating();
                } else {
                    this.classList.remove("readOnly");
                    this._permitRating();
                }
            }
        },
        get: function() {
            return this._readOnly;
        }
    },


    _readOnly: {
        value: false
    },


    /**
     * Allows to fill the items with a precision.
     *
     * Examples:
     *
     * 1: RatingBarItems will be filled one after one.
     * 0.5: RatingBarItems will be half-filled.
     * 0: RatingBarItems will be filled with the smallest precision.
     *
     * @type {number}
     * @default 1
     * @private
     */


    step: {
        set: function (step) {
            if (!isNaN(step)) {
                step = +step;

                if (step >= 0 && step <= 1 && this._step !== step) {
                    this._step = step;
                    this.needsDraw = true;
                }
            }
        },
        get: function () {
            return this._step;
        }
    },


    _step: {
        value: 1
    },


    /**
     * Indicates whether the Rating-Bar Component is "rating".
     *
     * @type {Boolean}
     * @default false
     * @private
     */
    _isRating: {
        value: false
    },


    _offsetWidth: {
        value: null
    },


    _offsetLeft: {
        value: null
    },


    _ratingValue: {
        value: null
    },


    _ratingBarItems: {
        value: null
    },


    /**
     * Keeps the unique ID of a Touch Event, that identify the point of contact with the touch surface
     * that has triggered the rating mechanism.
     *
     * @type {Number}
     * @default null
     * @private
     */
    _observedPointer: {
        value: null
    },


    enterDocument: {
        value: function () {
            if (!this._readOnly) {
                // Event listeners are not added in prepareForActivationEvent,
                // because when mouse pointers are listening on movements.
                this._permitRating();
            }
        }
    },


    exitDocument: {
        value: function () {
            if (!this._readOnly) {
                this._preventRating();

                if (this._isRating) {
                    this._removeEventListeners();
                }
            }
        }
    },


    /**
     * Privates Functions.
     *
     */


    _permitRating: {
        value: function () {
            if (window.Touch) { /** IOS - Android **/
            this._element.addEventListener("touchstart", this);

            } else if (window.PointerEvent) { /** Windows Phone - IE 11 **/
            this._element.addEventListener("pointerenter", this);

            } else { /** Mouse events **/
            this._element.addEventListener("mouseenter", this);
            }
        }
    },


    _preventRating: {
        value: function () {
            if (window.Touch) {
                this._element.removeEventListener("touchstart", this);

            } else if (window.PointerEvent) {
                this._element.removeEventListener("pointerenter", this);

            } else {
                this._element.removeEventListener("mouseenter", this);
            }
        }
    },


    _addEventListeners: {
        value: function () {
            if (window.Touch) {
                this._element.addEventListener("touchmove", this);
                this._element.addEventListener("touchcancel", this);
                this._element.addEventListener("touchend", this);

            } else if (window.PointerEvent) {
                this._element.addEventListener("pointermove", this);
                this._element.addEventListener("pointercancel", this);
                this._element.addEventListener("pointerleave", this);
                this._element.addEventListener("pointerup", this);

            } else {
                this._element.addEventListener("mousemove", this);
                this._element.addEventListener("mouseleave", this);
                this._element.addEventListener("click", this);
            }
        }
    },


    _removeEventListeners: {
        value: function () {
            if (window.Touch) {
                this._element.removeEventListener("touchmove", this);
                this._element.removeEventListener("touchcancel", this);
                this._element.removeEventListener("touchend", this);

            } else if (window.PointerEvent) {
                this._element.removeEventListener("pointermove", this);
                this._element.removeEventListener("pointercancel", this);
                this._element.removeEventListener("pointerleave", this);
                this._element.removeEventListener("pointerup", this);

            } else {
                this._element.removeEventListener("mousemove", this);
                this._element.removeEventListener("mouseleave", this);
                this._element.removeEventListener("click", this);
            }
        }
    },


    /**
     * Converts the position of the current pointer to a valid rate.
     *
     * @function
     * @private
     * @param {number} positionX - relative X coordinate within a RatingBarItem Component.
     * @param {number} itemWidth - width of a RatingBarItem Component.
     * @return {number} the rating value computed with the X coordinate,
     * or will return 0 whether the X coordinate is outside of the RatingBar Component.
     *
     */
    _convertPositionToValue: {
        value: function (positionX, itemWidth) {
            var precision = 0,
                result = 0;

            if (this._step > 0) {
                precision = 1 / this._step;
            }

            if (positionX >= 0 && positionX <= itemWidth) {
                result = positionX / itemWidth;
            }

            return precision > 0 ? Math.ceil(result * precision) / precision : result;
        }
    },


    /**
     * Handlers functions.
     *
     */


    _handleRatingStart: {
        value: function () {
            this._isRating = true;
            this._addEventListeners();
        }
    },


    handleMouseenter: {
        value: function (event) {
            if (event.target === this._element) {
                this._handleRatingStart();
            }
        }
    },


    handlePointerenter: {
        value: function (event) {
            if (event.target === this._element && this._observedPointer === null) {
                this._observedPointer = event.pointerId;
                this._handleRatingStart();
                this._handleRating(event.target.component, event.clientX);
            }
        }
    },


    handleTouchstart: {
        value: function (event) {
            if (event.targetTouches && event.targetTouches.length === 1) {
                this._observedPointer = event.targetTouches[0].identifier;
                this._handleRatingStart();

                if (event.target) {
                    this._handleRating(event.target.component, event.targetTouches[0].clientX);
                }
            }
        }
    },


    _handleRating: {
        value: function (ratingBarItem, positionX) {
            if (ratingBarItem instanceof RatingBarItem) {
                // Finds relative X position within a BarItemComponent
                var relativePositionX = ratingBarItem.getRelativePositionX(positionX, true),
                    newValue = ratingBarItem.index;

                /*
                 * When the position is outside a svg element, that doesn't mean we are really "outside" (padding, margin).
                 * So, that means we could have already reached 100% of the svg element. (right side)
                 */
                if (relativePositionX === -1 && positionX > (ratingBarItem._svgOffsetWidth + ratingBarItem._svgOffsetLeft)) {
                    newValue++;
                } else {
                    newValue += this._convertPositionToValue(relativePositionX, ratingBarItem._svgOffsetWidth);
                }

                if (newValue > 0 && this._ratingValue !== newValue) {
                    this._ratingValue = newValue;
                    this.needsDraw = true;
                }
            }
        }
    },


    handleMousemove: {
        value: function (event) {
            if (event.clientX && event.target) {
                this._handleRating(event.target.component, event.clientX);

                // When an user with a mouse pointer has set the rating value,
                // but he's still within the RatingBar Component.
                // todo: needs discussion
                if (!this._isRating) {
                    this._isRating = true;
                }
            }
        }
    },


    handlePointermove: {
        value: function (event) {
            if (event.clientX && event.pointerId === this._observedPointer && event.target) {
                this._handleRating(event.target.component, event.clientX);
            }
        }
    },


    handleTouchmove: {
        value: function (event) {
            if (event.changedTouches) {
                var i = 0, len = event.changedTouches.length;

                while (i < len && event.changedTouches[i].identifier !== this._observedPointer) {
                    i++;
                }

                if (i < len) {
                    event.preventDefault();

                    var clientX = event.changedTouches[i].clientX,
                        barItemComponent = this._findRatingBarItemComponentAtPosition(clientX);

                    if (barItemComponent) {
                        this._handleRating(barItemComponent, clientX);
                    }
                }
            }
        }
    },


    _findRatingBarItemComponentAtPosition: {
        value: function (x) {
            var items = this._ratingBarItems.iterations,
                iteration,
                tmpItem,
                item;

            if (items) {
                for (var i = 0, length = items.length; i < length; i++) {
                    iteration = items[i];

                    if (iteration && iteration._childComponents) {
                        tmpItem = iteration._childComponents[0];

                        if (tmpItem.getRelativePositionX(x) >= 0) {
                            item = tmpItem;
                            break;
                        }
                    }
                }
            }

            return item;
        }
    },


    _handleRatingCancel: {
        value: function () {
            this._ratingValue = 0;
            this._isRating = false;
            this._removeEventListeners();

            this.needsDraw = true;
        }
    },


    handleTouchcancel: {
        value: function () {
            this._handleRatingCancel();
        }
    },


    handlePointercancel: {
        value: function (event) {
            if (event.pointerId === this._observedPointer) {
                this._handleRatingCancel();
                this._observedPointer = null;
            }
        }
    },


    handleMouseleave: {
        value: function (event) {
            if (this._element === event.target) {
                this._handleRatingCancel();
            }
        }
    },


    handlePointerleave: {
        value: function (event) {
            if (event.pointerId === this._observedPointer) {
                this._handleRatingCancel();
                this._observedPointer = null;
            }
        }
    },


    _handleRatingEnd: {
        value: function () {
            if (this._isRating) {
                this._isRating = false;
                this.value = this._ratingValue;
            }
        }
    },


    handleClick: {
        value: function () {
            this._handleRatingEnd();
        }
    },


    handlePointerup: {
        value: function (event) {
            if (event.pointerId === this._observedPointer) {
                this._handleRatingEnd();
                this._removeEventListeners();
                this._observedPointer = null;
            }
        }
    },


    handleTouchend: {
        value: function (event) {
            if (event.changedTouches) {
                var i = 0, len = event.changedTouches.length;

                while (i < len && event.changedTouches[i].identifier !== this._observedPointer) {
                    i++;
                }

                if (i < len) {
                    this._handleRatingEnd();
                    this._removeEventListeners();
                }
            }
        }
    },


    /**
     * Draw cycle functions.
     *
     */


    willDraw: {
        value: function () {
            this._offsetWidth = this._element.offsetWidth;
            this._offsetLeft = this._element.offsetLeft;
        }
    },


    draw: {
        value: function () {
            var rate = this._isRating ? this._ratingValue : this._value,
                items = this._ratingBarItems.iterations,
                iteration,
                item;

            if (items) {
                for (var i = 0, length = items.length; i < length; i++) {
                    iteration = items[i];

                    if (iteration && iteration._childComponents) {
                        item = iteration._childComponents[0];

                        if (rate > 0) {
                            item.isActive = this._isRating;
                            item.value = --rate > 0 ? 1 : rate + 1;
                        } else {
                            item.isActive = item.value = 0;
                        }
                    }
                }
            }
        }
    }


});
