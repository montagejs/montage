/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

var Montage = require("montage").Montage,
    Component = require("ui/component").Component;

exports.Scroller = Montage.create(Component, {

    _scrollX: {
        value: 0
    },

    scrollX: {
        get: function () {
            return this._scrollX;
        },
        set: function (value) {
            this._scrollX = value;
            this.needsDraw = true;
        },
        serializable: true
    },

    _scrollY: {
        value: 0
    },

    scrollY: {
        get: function () {
            return this._scrollY;
        },
        set: function (value) {
            this._scrollY = value;
            this.needsDraw = true;
        },
        serializable: true
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

    axis: {
        get: function () {
            return this._axis;
        },
        set: function (value) {
            this._axis = value;
            this.needsDraw = true;
        },
        serializable: true
    },

    _displayScrollbars: {
        value: "auto"
    },

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
        },
        serializable: true
    },

    _hasMomentum: {
        value: true
    },

    hasMomentum: {
        get: function () {
            return this._hasMomentum;
        },
        set: function (value) {
            this._hasMomentum = value;
        },
        serializable: true
    },

    _content: {
        value: null,
        serializable: true
    },

    _scrollBars: {
        value: null,
        serializable: true
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
            this._content.style.webkitTransform="translate3d("+(-this._scrollX)+"px, "+(-this._scrollY)+"px, 0)";
        }
    }
});
