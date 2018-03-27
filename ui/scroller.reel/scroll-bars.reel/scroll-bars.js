var Component = require("../../component").Component;

/**
 * @class ScrollBars
 * @classdesc
 */
var ScrollBars = exports.ScrollBars = Component.specialize(/** @lends ScrollBars# */ {

    enterDocument: {
        value: function (firstTime) {
            if (firstTime && !ScrollBars.transformCssProperty) {
                var style = this.element.style;
                //Todo duplicate codes (scrollers.js), we should maybe add some cache to Component

                if(typeof style.webkitTransform !== "undefined") {
                    ScrollBars.transformCssProperty = "webkitTransform";
                } else if(typeof style.MozTransform !== "undefined") {
                    ScrollBars.transformCssProperty = "MozTransform";
                } else if(typeof style.msTransform !== "undefined") {
                    ScrollBars.transformCssProperty = "msTransform";
                } else {
                    ScrollBars.transformCssProperty = "transform";
                }

                if(typeof style.webkitTransition !== "undefined") {
                    ScrollBars.transitionCssProperty = "webkitTransition";
                } else if(typeof style.MozTransition !== "undefined") {
                    ScrollBars.transitionCssProperty = "MozTransition";
                } else if(typeof style.msTransition !== "undefined") {
                    ScrollBars.transitionCssProperty = "msTransition";
                } else {
                    ScrollBars.transitionCssProperty = "transition";
                }
            }
        }
    },

    // Scroll and length are defined in a [0..1] range

    _verticalScroll: {
        value: 0
    },

    _horizontalScroll: {
        value: 0
    },

    _verticalLength: {
        value: 0
    },

    _horizontalLength: {
        value: 0
    },

    verticalScroll: {
        get: function () {
            return this._verticalScroll;
        },
        set: function (value) {
            this._verticalScroll = value;
            this.needsDraw = true;
        }
    },

    horizontalScroll: {
        get: function () {
            return this._horizontalScroll;
        },
        set: function (value) {
            this._horizontalScroll = value;
            this.needsDraw = true;
        }
    },

    verticalLength: {
        get: function () {
            return this._verticalLength;
        },
        set: function (value) {
            this._verticalLength = value;
            this.needsDraw = true;
        }
    },

    horizontalLength: {
        get: function () {
            return this._horizontalLength;
        },
        set: function (value) {
            this._horizontalLength = value;
            this.needsDraw = true;
        }
    },

    _opacity: {
        value: 0
    },

    opacity: {
        get: function () {
            return this._opacity;
        },
        set: function (value) {
            this._opacity = value;
            this.needsDraw = true;
        }
    },

    _isDisplayUpdated: {
        value: false
    },

    _displayVertical: {
        value: false
    },

    displayVertical: {
        get: function () {
            return this._displayVertical;
        },
        set: function (value) {
            if (this._displayVertical !== value) {
                this._displayVertical = value;
                this._isDisplayUpdated = true;
                this.needsDraw = true;
            }
        }
    },

    _displayHorizontal: {
        value: false
    },

    displayHorizontal: {
        get: function () {
            return this._displayHorizontal;
        },
        set: function (value) {
            if (this._displayHorizontal !== value) {
                this._displayHorizontal = value;
                this._isDisplayUpdated = true;
                this.needsDraw = true;
            }
        }
    },

    _top: {
        value: false
    },

    _bottomClip: {
        value: false
    },

    _bottom: {
        value: false
    },

    _left: {
         value: false
     },

    _rightClip: {
        value: false
    },

    _right: {
        value: false
    },

    _hasResizedHorizontal: {
        value: false
    },

    _hasResizedVertical: {
        value: false
    },

    willDraw: {
        value: function () {
            if (this._offsetWidth !== this._element.offsetWidth) {
                this._offsetWidth = this._element.offsetWidth;
                this._hasResizedHorizontal = true;
            }
            if (this._offsetHeight !== this._element.offsetHeight) {
                this._offsetHeight = this._element.offsetHeight;
                this._hasResizedVertical = true;
            }
        }
    },

    draw: {
        value: function () {
            var size,
                pos,
                range,
                max;

            if (this._isDisplayUpdated) {
                var displayVertical = this._displayVertical ? "block" : "none",
                    displayHorizontal = this._displayHorizontal ? "block" : "none";

                this._top.style.display = this._bottomClip.style.display = displayVertical;
                this._left.style.display = this._rightClip.style.display = displayHorizontal;
                this._isDisplayUpdated = false;
            }
            if (this._hasResizedHorizontal && this._displayHorizontal) {
                this._rightClip.style.width = this._right.style.width = (this._offsetWidth - 4) + "px";
                this._rightClip.style.clip = "rect(-1px," + (this._offsetWidth - 3) + "px,6px,3px)";
                this._hasResizedHorizontal = false;
            }
            if (this._hasResizedVertical && this._displayVertical) {
                this._bottomClip.style.height = this._bottom.style.height = (this._offsetHeight - 4) + "px";
                this._bottomClip.style.clip = "rect(3px,6px," + (this._offsetHeight - 3) + "px,-1px)";
                this._hasResizedVertical = false;
            }
            if (this._opacity) {
                if (this._displayHorizontal) {
                    range = this._offsetWidth - 9 - (this._displayVertical ? 6 : 0);
                    size = Math.floor(range * this._horizontalLength);
                    max = range - size;
                    if (1 - this._horizontalLength) {
                        pos = Math.floor((max * this._horizontalScroll) / (1 - this._horizontalLength));
                    } else {
                        pos = 0;
                    }
                    if (pos < 0) {
                        size += pos;
                        if (size < 0) {
                            size = 0;
                        }
                        pos = 0;
                    }
                    if (pos > max) {
                        size += Math.floor(max - pos);
                        if (size < 0) {
                            size = 0;
                        }
                        pos = range - size;
                    }
                    var rtranslate = (size - this._offsetWidth + 9) + "px,0",
                        ltranslate = (pos+2) + "px,0";

                    this._right.style[ScrollBars.transformCssProperty] = "translate3d(" + rtranslate + ",0)";

                    this._left.style[ScrollBars.transformCssProperty] =
                        this._rightClip.style[ScrollBars.transformCssProperty] = "translate3d(" + ltranslate + ",0)";

                    this._left.style[ScrollBars.transitionCssProperty] =
                        this._right.style[ScrollBars.transitionCssProperty] = "none";

                    this._left.style.opacity = this._right.style.opacity = this._opacity;
                }

                if (this._displayVertical) {
                    range = this._offsetHeight - 9 - (this._displayHorizontal ? 6 : 0);
                    size = Math.floor(range * this._verticalLength);
                    max = range - size;
                    if (1 - this._verticalLength) {
                        pos = Math.floor((max * this._verticalScroll) / (1 - this._verticalLength));
                    } else {
                        pos = 0;
                    }
                    if (pos < 0) {
                        size += pos;
                        if (size < 0) {
                            size = 0;
                        }
                        pos = 0;
                    }
                    if (pos > max) {
                        size += Math.floor(max - pos);
                        if (size < 0) {
                            size = 0;
                        }
                        pos = range - size;
                    }
                    var btranslate = "0," + (size - this._offsetHeight + 9) + "px",
                        ttranslate = "0," + (pos+2) + "px";

                    this._bottom.style[ScrollBars.transformCssProperty] = "translate3d(" + btranslate + ",0)";

                    this._top.style[ScrollBars.transformCssProperty] =
                        this._bottomClip.style[ScrollBars.transformCssProperty] = "translate3d(" + ttranslate + ",0)";

                    this._top.style[ScrollBars.transitionCssProperty] =
                        this._bottom.style[ScrollBars.transitionCssProperty] = "none";

                    this._top.style.opacity = this._bottom.style.opacity = this._opacity;
                }
            } else {
                if (this._displayHorizontal) {
                    this._left.style[ScrollBars.transitionCssProperty] =
                        this._right.style[ScrollBars.transitionCssProperty] = "300ms opacity";

                    this._left.style.opacity = this._right.style.opacity = 0;
                }
                if (this._displayVertical) {
                    this._top.style[ScrollBars.transitionCssProperty] =
                        this._bottom.style[ScrollBars.transitionCssProperty] = "300ms opacity";

                    this._top.style.opacity = this._bottom.style.opacity = 0;
                }
            }
        }
    }
}, {
    // cache

    transformCssProperty: {
        value: null
    },

    transitionCssProperty: {
        value: null
    }

});
