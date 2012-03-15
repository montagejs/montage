/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

var Montage = require("montage").Montage,
    Component = require("ui/component").Component;

exports.Scroller = Montage.create(Component, {

    _scrollX: {
        enumerable: false,
        value: 0
    },

    scrollX: {
        get: function () {
            return this._scrollX;
        },
        set: function (value) {
            this._scrollX = value;
            this.needsDraw = true;
        }
    },

    _scrollY: {
        enumerable: false,
        value: 0
    },

    scrollY: {
        get: function () {
            return this._scrollY;
        },
        set: function (value) {
            this._scrollY = value;
            this.needsDraw = true;
        }
    },

    _maxTranslateX: {
        value: 0
    },

    _maxTranslateY: {
        value: 0
    },

    _axis: {
        enumerable: false,
        value: "auto"
    },

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
        enumerable: false,
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
        }
    },

    _hasMomentum: {
        enumerable: false,
        value: true
    },

    hasMomentum: {
        get: function () {
            return this._hasMomentum;
        },
        set: function (value) {
            this._hasMomentum = value;
        }
    },

    _hasBouncing: {
        enumerable: false,
        value: true
    },

    hasBouncing: {
        get: function () {
            return this._hasBouncing;
        },
        set: function (value) {
            this._hasBouncing = value;
        }
    },

    _momentumDuration: {
        enumerable: false,
        value: 650
    },

    momentumDuration: {
        get: function () {
            return this._momentumDuration;
        },
        set: function (value) {
            this._momentumDuration = isNaN(parseInt(value, 10)) ? 1 : parseInt(value, 10);
            if (this._momentumDuration < 1) {
                this._momentumDuration = 1;
            }
        }
    },

    _bouncingDuration: {
        enumerable: false,
        value: 750
    },

    bouncingDuration: {
        get: function () {
            return this._bouncingDuration;
        },
        set: function (value) {
            this._bouncingDuration = isNaN(parseInt(value, 10)) ? 1 : parseInt(value, 10);
            if (this._bouncingDuration < 1) {
                this._bouncingDuration = 1;
            }
        }
    },

    _content: {
        enumerable: false,
        value: null
    },

    templateDidLoad: {
        value: function () {
            var orphanedFragment = document.createDocumentFragment(),
                children = this.element.childNodes;


            while (children.length > 0) {
                // As the nodes are appended to item.fragment they are removed
                // from item.element, so always use index 0.
                orphanedFragment.appendChild(children[0]);
            }
            this._content.appendChild(orphanedFragment);
        }
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

    willDraw: {
        enumerable: false,
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
        enumerable: false,
        value: function () {
            this._content.style.webkitTransform="translate3d("+(-this._scrollX)+"px, "+(-this._scrollY)+"px, 0)";
        }
    }
});
