/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;
var Component = require("montage/ui/component").Component;
var dom = require("montage/ui/dom");
var Point = require("montage/core/geometry/point").Point;
var PointMonitor = require("point-monitor").PointMonitor;
var Effect = require("effect/effect").Effect;

var DesaturateEffect = require("effect/desaturate-effect").DesaturateEffect;
var InvertEffect = require("effect/invert-effect").InvertEffect;
var SepiaEffect = require("effect/sepia-effect").SepiaEffect;
var MultiplyEffect = require("effect/multiply-effect").MultiplyEffect;

exports.PhotoEditor = Montage.create(Component, {

    __image: {
        enumerable: false,
        value: null
    },

    _image: {
        enumerable: false,
        get: function() {
            return this.__image;
        },
        set: function(value) {

            if (this.__image === value) {
                return;
            }

            if (this.__image) {
                this.__image.element.removeEventListener("load", this, false);
            }

            this.__image = value;
            this.__image.element.identifier = "editorImage";

            if (this.__image) {
                this.__image.element.addEventListener("load", this, false);
            }

        }
    },

    _canvas: {
        enumerable: false,
        value: null
    },

    _pointerIdentifier: {
        enumerable: false,
        value: null
    },

    prepareForActivationEvents: {
        value: function() {
            if (window.Touch) {
                this._canvas.addEventListener("touchstart", this, false);
            } else {
                this._canvas.addEventListener("mousedown", this, false);
            }
        }
    },

    handleMousedown: {
        value: function(event) {
            event.preventDefault();
            this._pointerIdentifier = "mouse";
            this._canvas.addEventListener("mousemove", this, false);
            document.addEventListener("mouseup", this, false);

            this._pickColor(event.clientX, event.clientY);

            this.needsDraw = true;
        }
    },

    handleTouchstart: {
        value: function(event) {

            if (this._pointerIdentifier) {
                return;
            }

            event.preventDefault();

            var pickTouch = event.changedTouches[0];
            this._pointerIdentifier = pickTouch.identifier;
            this._canvas.addEventListener("touchmove", this, false);
            document.addEventListener("touchend", this, false);
            document.addEventListener("touchcancel", this, false);

            this._pickColor(pickTouch.clientX, pickTouch.clientY);
        }
    },

    handleMouseup: {
        value: function() {
            this._pointerIdentifier = null;
            this._canvas.removeEventListener("mousemove", this, false);
            document.removeEventListener("mouseup", this, false);

            var colorPickEvent = document.createEvent("CustomEvent");
            colorPickEvent.initCustomEvent("colorpickend", true, true, null);
            document.application.dispatchEvent(colorPickEvent);

            this.needsDraw = true;
        }
    },

    handleMousemove: {
        enumerable: false,
        value: function(event) {

            if (!this._pointerIdentifier) {
                return;
            }

            this._pickColor(event.clientX, event.clientY);
        }
    },

    handleTouchmove: {
        enumerable: false,
        value: function(event) {

            var i = 0,
                iTouch,
                foundTouch = null

            for(; (iTouch = event.changedTouches[i]); i++) {
                if (iTouch.identifier === this._pointerIdentifier) {
                    foundTouch = iTouch;
                    break;
                }
            }

            if (!foundTouch) {
                return;
            }

            this._pickColor(foundTouch.clientX, foundTouch.clientY);
        }
    },

    handleTouchend: {
        value: function() {
            var i = 0,
                iTouch,
                foundTouch = null

            for(; (iTouch = event.changedTouches[i]); i++) {
                if (iTouch.identifier === this._pointerIdentifier) {
                    foundTouch = iTouch;
                    break;
                }
            }

            if (!foundTouch) {
                return;
            }

            this._pointerIdentifier = null;
            var colorPickEvent = document.createEvent("CustomEvent");
            colorPickEvent.initCustomEvent("colorpickend", true, true, null);
            document.application.dispatchEvent(colorPickEvent);
        }
    },

    _pickColor: {
        value: function(x, y) {
            var gridExtent = 20,
                halfGridExtent = 10,
                canvas = this._canvas,
                context = canvas.getContext('2d'),
                canvasPoint = dom.convertPointFromPageToNode(canvas, Point.create().init(x, y)),
                pickedPixel = context.getImageData(canvasPoint.x, canvasPoint.y, 1, 1),
                focusGrid = context.getImageData(canvasPoint.x - halfGridExtent, canvasPoint.y - halfGridExtent, gridExtent, gridExtent),
                colorPickEvent;

            colorPickEvent = document.createEvent("CustomEvent");
            colorPickEvent.initCustomEvent("colorpick", true, true, null);
            colorPickEvent.color = pickedPixel.data;
            colorPickEvent.focusGrid = focusGrid;
            colorPickEvent.clientX = x;
            colorPickEvent.clientY = y;
            colorPickEvent.canvasX = canvasPoint.x;
            colorPickEvent.canvasY = canvasPoint.y;

            document.application.dispatchEvent(colorPickEvent);
        }
    },

    dataAtPoint: {
        value: function(x, y) {

            if (!this.hasImage || !this._canvas || x < 0 || x > this._width || y < 0 || y > this._height) {
                return null;
            }

            var canvas = this._canvas,
                context = canvas.getContext('2d');

            return context.getImageData(x, y, 1, 1).data;
        }
    },

    _src: {
        enumerable: false,
        value: null
    },

    src: {
        enumerable: false,
        get: function() {
            return this._src;
        },
        set: function(value) {

            if (value === this._src) {
                return;
            }

            this._src = value;

            if (!this._src) {
                this.hasImage = false;
                this.needsDraw = true;
            }
        }
    },

    hasImage: {
        value: false
    },

    handleEditorImageLoad: {
        enumerable: false,
        value: function(event) {
            this._imageDirty = true;
            this.hasImage = true;
            this.needsDraw = true;
        }
    },

    _width: {
        enumerable: false,
        value: null
    },

    _height: {
        enumerable: false,
        value: null
    },

    currentColor: {
        enumerable: false,
        value: null
    },

    // TODO Eventually we need to maintain a stack of effects to apply to the image inside the editor
    // I don't want to complicate this for the demo right now though
    _inverted: {
        enumerable: false,
        value: false
    },

    inverted: {
        enumerable: false,
        get: function() {
            return this._inverted;
        },
        set: function(value) {

            if (value === this._inverted) {
                return;
            }

            this._inverted = value;
            this._imageDirty = true;
            this.needsDraw = true;
        }
    },

    _desaturated: {
        enumerable: false,
        value: false
    },

    desaturated: {
        enumerable: false,
        get: function() {
            return this._desaturated;
        },
        set: function(value) {

            if (value === this._desaturated) {
                return;
            }

            this._desaturated = value;
            this._imageDirty = true;
            this.needsDraw = true;
        }
    },

    _sepiaToned: {
        enumerable: false,
        value: false
    },

    sepiaToned: {
        enumerable: false,
        get: function() {
            return this._sepiaToned;
        },
        set: function(value) {

            if (value === this._sepiaToned) {
                return;
            }

            this._sepiaToned = value;
            this._imageDirty = true;
            this.needsDraw = true;
        }
    },

    _multiplyEffect: {
        enumerable: false,
        value: false
    },

    multiplyEffect: {
        enumerable: false,
        get: function() {
            return this._multiplyEffect;
        },
        set: function(value) {

            if (value === this._multiplyEffect) {
                return;
            }

            this._multiplyEffect = value;
            this._imageDirty = true;
            this.needsDraw = true;
        }
    },

    _multiplyMultiplier: {
        enumerable: false,
        value: 1
    },

    multiplyMultiplier: {
        enumerable: false,
        get: function() {
            return this._multiplyMultiplier;
        },
        set: function(value) {

            if (value === this._multiplyMultiplier) {
                return;
            }

            this._multiplyMultiplier = value;

            if (this.multiplyEffect) {
                this._imageDirty = true;
                this.needsDraw = true;
            }
        }
    },

    prepareForDraw: {
        value: function() {

            // Allow cross origin image loading
            this._image.element.crossOrigin = '';

            // TODO this is a workaround for a problem with our deserialization in iOS concerning
            // canvas elements. Debugging points to some issue with adoptNode. Either way,
            // if we don't do this it takes two draw cycles to actually get the canvas rendering.
            var newCanvas = this._canvas.cloneNode(true);
            this._canvas.parentNode.replaceChild(newCanvas, this._canvas);
            this._canvas = newCanvas;
        }
    },

    pointMonitorController: {
        enumerable: false,
        value: null
    },

    _pointMonitors: {
        enumerable: false,
        value: null
    },

    pointMonitors: {
        enumerable: false,
        get: function() {
            if (!this._pointMonitors) {
                this._pointMonitors = [PointMonitor.create(), PointMonitor.create(), PointMonitor.create(), PointMonitor.create()];
            }

            return this._pointMonitors;
        }
    },

    _isShowingPointMonitors: {
        enumerable: false,
        value: null
    },

    isShowingPointMonitors: {
        enumerable: false,
        get: function() {
            return this._isShowingPointMonitors;
        },
        set: function(value) {
            if (value === this._isShowingPointMonitors) {
                return;
            }

            this._isShowingPointMonitors = value;
            this.needsDraw = true;
        }
    },

    willDraw: {
        value: function() {
            this._width = this._image.element.offsetWidth;
            this._height = this._image.element.offsetHeight;
        }
    },

    draw: {
        value: function() {
            // Don't draw unless we have something to actually draw
            if (!this._width || !this._height) {
                return;
            }

            var width = this._width,
                height = this._height,
                canvas,
                image,
                context;


            this._toolLayer.style.width = width + "px";
            this._toolLayer.style.height = height + "px";

            if (this._isShowingPointMonitors) {
                this.element.classList.add("isShowingPointMonitors");
            } else {
                this.element.classList.remove("isShowingPointMonitors");
            }

            if (this._pointerIdentifier) {
                this.element.classList.add("pickingColor");
            } else {
                this.element.classList.remove("pickingColor");
            }

            if (this.hasImage) {
                this.element.classList.add("hasImage");
            } else {
                this.element.classList.remove("hasImage");
            }

            // Only do expensive drawing if the canvas data is dirty
            if (!this._imageDirty) {
                return;
            }

            canvas = this._canvas;
            image = this._image.element;
            context;

            canvas.width = width;
            canvas.height = height;

            context = canvas.getContext('2d');
            context.drawImage(image, 0, 0);

            var imgd = context.getImageData(0, 0, width, height),
                pixels = imgd.data,
                pixelCount = pixels.length;

            if (this.inverted) {
                InvertEffect.applyEffect(pixels, pixelCount);
            }

            if (this.desaturated) {
                DesaturateEffect.applyEffect(pixels, pixelCount);
            }

            if (this.sepiaToned) {
                SepiaEffect.applyEffect(pixels, pixelCount);
            }

            if (this.multiplyEffect) {
                MultiplyEffect.applyEffect(pixels, pixelCount, this.multiplyMultiplier);
            }

            context.putImageData(imgd, 0, 0);
        }
    },

    didDraw: {
        value: function() {
            if (this._imageDirty) {

                var context,
                    imageData;

                if (this.hasImage) {
                    context = this._canvas.getContext('2d');
                    imageData = context.getImageData(0, 0, this._width, this._height);
                } else {
                    imageData = null;
                }

                var imageModifiedEvent = document.createEvent("CustomEvent");
                imageModifiedEvent.initCustomEvent("imagemodified", true, true, {
                    editor: this
                });
                document.application.dispatchEvent(imageModifiedEvent);

                this._imageDirty = false;
            }
        }
    }

});
