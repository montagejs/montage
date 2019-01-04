var Component = require("../component").Component;

/**
 * ```html
 * <div data-montage-id="scroller" style="height: 400px; width: 500px;">
 *     <p>A large paragraph...</p>;
 *     <img src="..." alt="...">;
 *     <p>;Another large paragraph...</p>;
 * </div>
 * ```
 *
 * @class Scroller
 * @classdesc
 */
var Scroller = exports.Scroller = Component.specialize(/** @lends Scroller# */ {

    enterDocument: {
        value: function (firstTime) {
            if (firstTime && !Scroller.transformCssProperty) {
                var style = this.element.style;

                if(typeof style.webkitTransform !== "undefined") {
                    Scroller.transformCssProperty = "webkitTransform";
                } else if(typeof style.MozTransform !== "undefined") {
                    Scroller.transformCssProperty = "MozTransform";
                } else if(typeof style.msTransform !== "undefined") {
                    Scroller.transformCssProperty = "msTransform";
                } else {
                    Scroller.transformCssProperty = "transform";
                }
            }
        }
    },

    _scrollX: {
        value: 0
    },
    /**
        Scroll distance from the left
        @type Number
        @default 0
    */
    scrollX: {
        get: function () {
            return this._scrollX;
        },
        set: function (value) {
            if (this._scrollX !== value) {
                this._scrollX = value;
                this.needsDraw = true;
            }
        }
    },

    _scrollY: {
        value: 0
    },
    /**
        Scroll distance from the top
        @type Number
        @default 0
    */
    scrollY: {
        get: function () {
            return this._scrollY;
        },
        set: function (value) {
            if (this._scrollY !== value) {
                this._scrollY = value;
                this.needsDraw = true;
            }
        }
    },

    _maxTranslateX: {
        value: 0
    },

    _maxTranslateY: {
        value: 0
    },

    _axis: {
        value: "auto"
    },
    /**
        Which axis scrolling is restricted to.

        Can be "vertical", "horizontal" or "auto".
        @type {String}
        @default "auto"
    */
    axis: {
        get: function () {
            return this._axis;
        },
        set: function (value) {
            this._axis = value;
            this.needsDraw = true;
        }
    },

    _displayScrollbars: {
        value: "auto"
    },
    /**
        Which axis to display scrollbars for.

        Can be "vertical", "horizontal", "both", "auto" or "none"
        @type {String}
        @default "auto"
    */
    displayScrollbars: {
        get: function () {
            return this._displayScrollbars;
        },
        set: function (value) {
            switch (value) {
                case "vertical":
                case "horizontal":
                case "both":
                case "auto":
                    this._displayScrollbars = value;
                    break;
                default:
                    this._displayScrollbars = "none";
                    break;
            }
            this.needsDraw = true;
        }
    },

    _hasMomentum: {
        value: true
    },
    /**
        Whether to keep translating after the user has releases their cursor/finger.
        @type {Boolean}
        @default true
    */
    hasMomentum: {
        get: function () {
            return this._hasMomentum;
        },
        set: function (value) {
            this._hasMomentum = value;
        }
    },

    _content: {
        value: null
    },

    _scrollBars: {
        value: null
    },

    _translateComposerAxis: {
        value: null
    },

    handleTranslateStart: {
        value: function(event) {
            this._scrollBars.opacity = 0.5;
        }
    },

    handleTranslateEnd: {
        value: function(event) {
            this._scrollBars.opacity = 0;
        }
    },

    canDraw: {
        value: function() {
            this.needsDraw = true;
            return Component.prototype.canDraw.apply(this, arguments);
        }
    },

    willDraw: {
        value: function () {
            this._left = this._element.offsetLeft;
            this._top = this._element.offsetTop;
            this._width = this._element.offsetWidth;
            this._height = this._element.offsetHeight;

            // BUG: Firefox doesn't seem to properly calculate the scrollWidth
            var maxTranslateX = this._content.scrollWidth - this._width;
            if (maxTranslateX < 0) {
                this._maxTranslateX = 0;
            } else {
                this._maxTranslateX = maxTranslateX;
            }
            var maxTranslateY = this._content.offsetHeight - this._height;
            if (maxTranslateY < 0) {
                this._maxTranslateY = 0;
            } else {
                this._maxTranslateY = maxTranslateY;
            }
            var delegateValue = this.callDelegateMethod("didSetMaxScroll", {x: this._maxTranslateX, y: this._maxTranslateY});
            if (delegateValue) {
                this._maxTranslateX = delegateValue.x;
                this._maxTranslateY = delegateValue.y;
            }

            this.scrollX = Math.min(this._scrollX, this._maxTranslateX);
            this.scrollY = Math.min(this._scrollY, this._maxTranslateY);

            switch (this._displayScrollbars) {
                case "horizontal":
                    this._scrollBars.displayHorizontal = true;
                    this._scrollBars.displayVertical = false;

                    this._translateComposerAxis = "horizontal";

                    break;
                case "vertical":
                    this._scrollBars.displayHorizontal = false;
                    this._scrollBars.displayVertical = true;

                    this._translateComposerAxis = "vertical";

                    break;
                case "both":
                    this._scrollBars.displayHorizontal = true;
                    this._scrollBars.displayVertical = true;

                    this._translateComposerAxis = "both";

                    break;
                case "auto":
                    // Only display the scroll bars if we can scroll in that direction
                    this._scrollBars.displayHorizontal = !!this._maxTranslateX;
                    this._scrollBars.displayVertical = !!this._maxTranslateY;

                    if (this._scrollBars.displayVertical && this._scrollBars.displayHorizontal) {
                        this._translateComposerAxis = "both";

                    } else if (this._scrollBars.displayVertical) {
                        this._translateComposerAxis = "vertical";

                    } else if (this._scrollBars.displayHorizontal) {
                        this._translateComposerAxis = "horizontal";

                    } else {
                        this._translateComposerAxis = "both"; //default value
                    }
                    break;
                case "none":
                    this._scrollBars.displayHorizontal = false;
                    this._scrollBars.displayVertical = false;
                    this._translateComposerAxis = "both"; //default value
                    break;
            }
            if (this._scrollBars.displayHorizontal) {
                if (this._content.scrollWidth) {
                    this._scrollBars.horizontalLength = this._width / this._content.scrollWidth;
                    this._scrollBars.horizontalScroll = this._scrollX / this._content.scrollWidth;
                } else {
                    this._scrollBars.horizontalLength = 1;
                    this._scrollBars.horizontalScroll = 0;
                }
            }
            if (this._scrollBars.displayVertical) {
                if (this._content.offsetHeight) {
                    this._scrollBars.verticalLength = this._height / this._content.offsetHeight;
                    this._scrollBars.verticalScroll = this._scrollY / this._content.offsetHeight;
                } else {
                    this._scrollBars.verticalLength = 1;
                    this._scrollBars.verticalScroll = 0;
                }
            }
        }
    },

    draw: {
        value: function () {
            var str = (-this._scrollX)+"px, "+(-this._scrollY)+"px";
            this._content.style[Scroller.transformCssProperty] = "translate3d(" + str + ", 0)";
        }
    }
}, {
    transformCssProperty: {
        value: null
    }
});
