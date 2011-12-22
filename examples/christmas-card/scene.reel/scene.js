/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;
var Component = require("montage/ui/component").Component;

exports.Scene = Montage.create(Component, {

    _isSnowing: {
        enumerable: false,
        value: true
    },

    isSnowing: {
        get: function () {
            return this._isSnowing;
        },
        set: function (value) {
            this._isSnowing = value;
        }
    },

    _isCardOpen: {
        enumerable: false,
        value: false
    },

    _pointerX: {
        enumerable: false,
        value: 0
    },

    _pointerY: {
        enumerable: false,
        value: 0
    },

    _originX: {
        enumerable: false,
        value: 0
    },

    _originY: {
        enumerable: false,
        value: 0
    },

    handleMousemove: {
        enumerable: false,
        value: function (event) {
            this._pointerX = event.pageX;
            this._pointerY = event.pageY;
            if (this._hasRotation) {
                this.needsDraw = true;
            }
        }
    },

    handleOpenCardAction: {
        enumerable: false,
        value: function () {
            if (!this._isCardOpen) {
                this._isCardOpen = true;
                this.needsDraw = true;
                this._element.addEventListener("webkitTransitionEnd", this, false);
                this.isSnowing = false;
            }
        }
    },

    handleCloseCardAction: {
        enumerable: false,
        value: function () {
            if ((this._isCardOpen)&&(this._hasRotation)) {
                this._isCardOpen = false;
                this._hasRotation = false;
                this.needsDraw = true;
                this._element.addEventListener("webkitTransitionEnd", this, false);
            }
        }
    },

    _hasRotation: {
        enumerable: false,
        value: false
    },

    handleWebkitTransitionEnd: {
        enumerable: false,
        value: function () {
            if (!this._isCardOpen) {
                this.isSnowing = true;
            } else {
                this._hasRotation = true;
                this._originX = this._pointerX;
                this._originY = this._pointerY;
            }
            this._element.removeEventListener("webkitTransitionEnd", this, false);
        }
    },

    prepareForDraw: {
        enumerable: false,
        value: function () {
            if (!window.Touch) {
                document.addEventListener("mousemove", this, false);
            }
        }
    },

    _width: {
        enumerable: false,
        value: 0
    },
    
    _height: {
        enumerable: false,
        value: 0
    },
    
    willDraw: {
        enumerable: false,
        value: function () {
            this._width = this._element.parentNode.parentNode.offsetWidth;
            this._height = this._element.parentNode.parentNode.offsetHeight;
        }
    },
    
    draw: {
        enumerable: false,
        value: function () {
            var tmp;
            
            if (this._isCardOpen) {
                if (!this._hasRotation) {
                    this._element.classList.add("openCard");
                    this._element.style.webkitTransition = "1s all";
                    this.ballLeft.style.webkitTransition = "1s all";
                    this.ballRight.style.webkitTransition = "1s all";
                    this._element.style.webkitTransform = "rotate3d(1,0,0,50deg) rotateX(0) rotateZ(0) translate3d(0,-10px,-250px)";
                    this.ballLeft.style.webkitTransform = "translate3d(0, 0, 71px) rotateX(0) rotateZ(0) rotate3d(1,0,0,-50deg)";
                    this.ballRight.style.webkitTransform = "translate3d(0, 0, 71px) rotateX(0) rotateZ(0) rotate3d(1,0,0,-50deg)";
                } else {
                    this._element.style.webkitTransition = "none";
                    this.ballLeft.style.webkitTransition = "none";
                    this.ballRight.style.webkitTransition = "none";
                    tmp = " rotateX("+((this._pointerY-this._originY)/(this._height*-1.9))+"rad) rotateZ("+((this._pointerX-this._originX)/(this._width*-2.5))+"rad) ";                    
                    this._element.style.webkitTransform = "rotate3d(1,0,0,50deg)"+tmp+"translate3d(0,-10px,-250px)";
                    tmp = " rotateX("+((this._pointerY-this._originY)/(this._height*1.9))+"rad) rotateZ("+((this._pointerX-this._originX)/(this._width*2.5))+"rad) ";
                    this.ballLeft.style.webkitTransform = "translate3d(0, 0, 71px)"+tmp+"rotate3d(1,0,0,-50deg)";
                    this.ballRight.style.webkitTransform = "translate3d(0, 0, 71px)"+tmp+"rotate3d(1,0,0,-50deg)";
                }
            } else {
                this._element.classList.remove("openCard");
                this._element.style.webkitTransition = "1s all";
                this.ballLeft.style.webkitTransition = "1s all";
                this.ballRight.style.webkitTransition = "1s all";
                this._element.style.webkitTransform = "rotate3d(1,0,0,0) rotateX(0) rotateZ(0) translate3d(0,0,0)";
                this.ballLeft.style.webkitTransform = "translate3d(0, 0, 71px) rotateX(0) rotateZ(0) rotate3d(1,0,0,0)";
                this.ballRight.style.webkitTransform = "translate3d(0, 0, 71px) rotateX(0) rotateZ(0) rotate3d(1,0,0,0)";
            }
        }
    }

});