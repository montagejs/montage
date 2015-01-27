/**
 * @module ui/star.reel
 * @requires montage/ui/component
 */
var Component = require("ui/component").Component;

/**
 * @class RatingBarItem
 * @extends Component
 */
exports.RatingBarItem = Component.specialize(/** @lends RatingBarItem# */ {


    templateDidLoad:{
        value: function () {
            // At this time just contain the "data-arg" svg.
            this._svgElement = this._element.querySelector("svg");

            if (!this._svgElement) {
                throw new Error("RatingBar Component requires a SVG element");
            }
        }
    },


    _svgElement: {
        value: null
    },


    linearGradient: {
        value: null
    },


    index: {
        value: null
    },


    _value: {
        value: 0
    },


    value: {
        set: function (value) {
            if (!isNaN(value)) {
                value = +value;

                if (value >= 0 && value <= 1 && this._value !== value) {
                    this._value = value;
                    this.needsDraw = true;
                }
            }
        },
        get: function () {
            return this._value;
        }
    },


    _isActive: {
        value: false
    },


    isActive: {
        set: function (active) {
            active = !!active;

            if (this._isActive !== active) {
                this._isActive = active;
                this.needsDraw = true;
            }
        },
        get: function () {
            return this._isActive;
        }
    },

    
    // private


    _offsetWidth: {
        value: null
    },


    _offsetLeft: {
        value: null
    },


    _svgOffsetWidth: {
        value: null
    },


    _svgOffsetLeft: {
        value: null
    },


    /**
     * Finds relative x coordinate to the star element or the svg element
     *
     * @function
     * @param {number} x - x coordinate.
     */
    getRelativePositionX: {
        value: function (x, relativeSvgElement) {
            var startPositionX,
                elementWidth,
                endPositionX;

            if (relativeSvgElement) {
                startPositionX = this._svgOffsetLeft;
                endPositionX = this._svgOffsetLeft + this._svgOffsetWidth;
                elementWidth = this._svgOffsetWidth;
            } else {
                startPositionX = this._offsetLeft;
                endPositionX = this._offsetLeft + this._offsetWidth;
                elementWidth = this._offsetWidth;
            }

            if (x >= startPositionX && x <= endPositionX) {
                if (x < endPositionX) {
                    return x - startPositionX;
                }

                return elementWidth;
            }

            return -1;
        }
    },


    willDraw: {
        value: function () {
            this._offsetWidth = this._element.offsetWidth;
            this._offsetLeft = this._element.offsetLeft;

            this._svgOffsetWidth = this._svgElement.offsetWidth;
            this._svgOffsetLeft = this._svgElement.offsetLeft;
        }
    },


    draw: {
        value: function () {
            if (!this._svgElement.classList.contains('BarRatingItem-svg')) {
                this._svgElement.classList.add('BarRatingItem-svg');
                this._svgElement.style.fill = "url('#" + this.linearGradient.uuid + "')";
            }

            if (this._value > 0) {
                if (this._isActive) {
                    this._element.classList.add("active");
                    this._element.classList.remove("value");
                } else {
                    this._element.classList.add("value");
                    this._element.classList.remove("active");
                }
            } else {
                this._element.classList.remove("active");
                this._element.classList.remove("value");
            }

            this.linearGradient.firstStopOffset = this._value * 100;
        }
    }

});
