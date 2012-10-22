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

/**
    @module "montage/ui/scroll-bars.reel"
*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component;

var ScrollBars = exports.ScrollBars = Montage.create(Component, {

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
                    var rtranslate = (size - this._offsetWidth + 9) + "px,0px",
                        ltranslate = (pos+2) + "px,0px";
                    this._right.style.webkitTransform = "translate3d(" + rtranslate + ",0)";
                    this._right.style.MozTransform = "translate(" + rtranslate + ")";
                    this._right.style.transform = "translate(" + rtranslate + ")";
                    this._left.style.webkitTransform = this._rightClip.style.webkitTransform = "translate3d(" + ltranslate + ",0)";
                    this._left.style.MozTransform = this._rightClip.style.MozTransform = "translate(" + ltranslate + ")";
                    this._left.style.transform = this._rightClip.style.transform = "translate(" + ltranslate + ")";
                    this._left.style.webkitTransition = this._right.style.webkitTransition = "none";
                    this._left.style.MozTransition = this._right.style.MozTransition = "none";
                    this._left.style.transition = this._right.style.transition = "none";
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
                    var btranslate = "0px," + (size - this._offsetHeight + 9) + "px",
                        ttranslate = "0px," + (pos+2) + "px";
                    this._bottom.style.webkitTransform = "translate3d(" + btranslate + ",0)";
                    this._bottom.style.MozTransform = "translate(" + btranslate + ")";
                    this._bottom.style.transform = "translate(" + btranslate + ")";
                    this._top.style.webkitTransform = this._bottomClip.style.webkitTransform = "translate3d(" + ttranslate + ",0)";
                    this._top.style.MozTransform = this._bottomClip.style.MozTransform = "translate(" + ttranslate + ")";
                    this._top.style.transform = this._bottomClip.style.transform = "translate(" + ttranslate + ")";
                    this._top.style.webkitTransition = this._bottom.style.webkitTransition = "none";
                    this._top.style.MozTransition = this._bottom.style.MozTransition = "none";
                    this._top.style.transition = this._bottom.style.transition = "none";
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
