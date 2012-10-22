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
    @module "montage/ui/scroller.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component;

/**
    Provides scrolling for the contained elements.

    @class module:"montage/ui/scroller.reel".Scroller
    @extends module:montage/ui/component.Component
    @example
    <caption>HTML needed for the scroller</caption>
&lt;div data-montage-id=&quot;scroller&quot; style=&quot;height: 400px; width: 500px;&quot;&gt;
    &lt;p&gt;A large paragraph...&lt;/p&gt;
    &lt;img src=&quot;...&quot; alt=&quot;...&quot;&gt;
    &lt;p&gt;Another large paragraph...&lt;/p&gt;
&lt;/div&gt;
*/
exports.Scroller = Montage.create(Component, /** @lends module:"montage/ui/scroller.reel".Scroller */ {

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
            return Component.canDraw.apply(this, arguments);
        }
    },

    willDraw: {
        value: function () {
            this._left = this._element.offsetLeft;
            this._top = this._element.offsetTop;
            this._width = this._element.offsetWidth;
            this._height = this._element.offsetHeight;

            // BUG: Firefox doesn't seem to properly calculate the scrollWidth
            this._maxTranslateX = this._content.scrollWidth - this._width;
            if (this._maxTranslateX < 0) {
                this._maxTranslateX = 0;
            }
            this._maxTranslateY = this._content.offsetHeight - this._height;
            if (this._maxTranslateY < 0) {
                this._maxTranslateY = 0;
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
                    break;
                case "vertical":
                    this._scrollBars.displayHorizontal = false;
                    this._scrollBars.displayVertical = true;
                    break;
                case "both":
                    this._scrollBars.displayHorizontal = true;
                    this._scrollBars.displayVertical = true;
                    break;
                case "auto":
                    // Only display the scroll bars if we can scroll in that direction
                    this._scrollBars.displayHorizontal = !!this._maxTranslateX;
                    this._scrollBars.displayVertical = !!this._maxTranslateY;
                    break;
                case "none":
                    this._scrollBars.displayHorizontal = false;
                    this._scrollBars.displayVertical = false;
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
            this._content.style.webkitTransform="translate3d(" + str + ", 0px)";
            this._content.style.MozTransform = "translate(" + str + ")";
            this._content.style.transform = "translate(" + str + ")";
        }
    }
});
