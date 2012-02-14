/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

var Montage = require("montage").Montage,
    Component = require("ui/component").Component;

var ScrollBars = exports.ScrollBars = Montage.create(Component, {

    // Scroll and length are defined in a [0..1] range

    _verticalScroll: {
        enumerable: false,
        value: 0
    },

    _horizontalScroll: {
        enumerable: false,
        value: 0
    },

    _verticalLength: {
        enumerable: false,
        value: 0
    },

    _horizontalLength: {
        enumerable: false,
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
        enumerable: false,
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
        enumerable: false,
        value: false
    },

    _displayVertical: {
        enumerable: false,
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
        enumerable: false,
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

    _hasResizedHorizontal: {
        enumerable: false,
        value: false
    },

    _hasResizedVertical: {
        enumerable: false,
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
                    this._right.style.webkitTransform = "translate3d(" + (size - this._offsetWidth + 9) + "px,0,0)";
                    this._left.style.webkitTransform = this._rightClip.style.webkitTransform = "translate3d(" + (pos+2) + "px,0,0)";
                    this._left.style.webkitTransition = this._right.style.webkitTransition = "none";
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
                    this._bottom.style.webkitTransform = "translate3d(0," + (size - this._offsetHeight + 9) + "px,0)";
                    this._top.style.webkitTransform = this._bottomClip.style.webkitTransform = "translate3d(0," + (pos+2) + "px,0)";
                    this._top.style.webkitTransition = this._bottom.style.webkitTransition = "none";
                    this._top.style.opacity = this._bottom.style.opacity = this._opacity;
                }
            } else {
                if (this._displayHorizontal) {
                    this._left.style.webkitTransition = this._right.style.webkitTransition = "300ms opacity";
                    this._left.style.opacity = this._right.style.opacity = 0;
                }
                if (this._displayVertical) {
                    this._top.style.webkitTransition = this._bottom.style.webkitTransition = "300ms opacity";
                    this._top.style.opacity = this._bottom.style.opacity = 0;
                }
            }
        }
    }
});
