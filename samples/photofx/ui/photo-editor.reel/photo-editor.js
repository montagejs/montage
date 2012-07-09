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
var Montage = require("montage").Montage;
var Component = require("montage/ui/component").Component;
var dom = require("montage/ui/dom");
var Point = require("montage/core/geometry/point").Point;

var DesaturateEffect = require("core/effect/desaturate-effect").DesaturateEffect;
var InvertEffect = require("core/effect/invert-effect").InvertEffect;
var SepiaEffect = require("core/effect/sepia-effect").SepiaEffect;
var MultiplyEffect = require("core/effect/multiply-effect").MultiplyEffect;

var CORS_TEST_IMAGE = "https://lh5.googleusercontent.com/-M9uCIhQjy3c/TwTSfmO6MlI/AAAAAAAAFcw/BIMvbz3a7Z4/s1/blank.jpg";

exports.PhotoEditor = Montage.create(Component, {

    supportsCrossOriginCanvas: {
        value: null
    },

    didCreate: {
        value: function() {
            this._testCrossOriginCanvas();
        }
    },

    _testCrossOriginCanvas: {
        value: function() {

            var corsImage,
                corsCanvas,
                corsContext,
                self = this;

            corsImage = document.createElement("img");
            corsImage.crossOrigin = "";
            corsImage.src = CORS_TEST_IMAGE;

            corsImage.onload = function() {
                corsCanvas = document.createElement("canvas");
                corsContext = corsCanvas.getContext("2d");
                corsContext.drawImage(corsImage, 0, 0, 1, 1);
                try {
                    corsContext.getImageData(0, 0, 1, 1);
                    self.supportsCrossOriginCanvas = true;
                } catch(e) {
                    if (18 === e.code) {
                        self.supportsCrossOriginCanvas = false;
                    } else {
                        throw e;
                    }
                }
            }
        }
    },

    __image: {
        value: null
    },

    _image: {
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
        value: null
    },

    _toolLayer: {
        value: null
    },

    _pointerIdentifier: {
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

            if (event.button !== 0) {
                return;
            }

            event.preventDefault();
            this._pointerIdentifier = "mouse";
            document.addEventListener("mousemove", this, false);
            document.addEventListener("mouseup", this, false);

            this._pickColor(event.pageX, event.pageY);

            //update rulers
            var canvasPoint = dom.convertPointFromPageToNode(this._canvas, Point.create().init(event.pageX, event.pageY));
            if (this.horizontalRuler) {
                this.horizontalRuler.savedPosition = canvasPoint.x;
            }
            if (this.verticalRuler) {
                this.verticalRuler.savedPosition = canvasPoint.y;
            }

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

            this._pickColor(pickTouch.pageX, pickTouch.pageY);
        }
    },

    handleMouseup: {
        value: function(event) {

            if (event.button !== 0) {
                return;
            }

            this._pointerIdentifier = null;
            document.removeEventListener("mousemove", this, false);
            document.removeEventListener("mouseup", this, false);

            this._pickColor(event.pageX, event.pageY, true);

            if (this.horizontalRuler) {
                this.horizontalRuler.savedPosition = null;
            }
            if (this.verticalRuler) {
                this.verticalRuler.savedPosition = null;
            }

            this.needsDraw = true;
        }
    },

    handleMousemove: {
        value: function(event) {

            if (!this._pointerIdentifier) {
                return;
            }

            this._pickColor(event.pageX, event.pageY);
        }
    },

    handleTouchmove: {
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

            this._pickColor(foundTouch.pageX, foundTouch.pageY);
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
            this._pickColor(foundTouch.pageX, foundTouch.pageY, true);
        }
    },

    _pickColor: {
        value: function(x, y, end) {
            var gridExtent = 20,
                halfGridExtent = 10,
                canvas = this._canvas,
                context = canvas.getContext('2d'),
                canvasPoint = dom.convertPointFromPageToNode(canvas, Point.create().init(x, y)),
                pickedPixel = context.getImageData(canvasPoint.x, canvasPoint.y, 1, 1),
                focusGrid = context.getImageData(canvasPoint.x - halfGridExtent, canvasPoint.y - halfGridExtent, gridExtent, gridExtent),
                colorPickEvent;

            colorPickEvent = document.createEvent("CustomEvent");
            colorPickEvent.initCustomEvent(end ? "colorpickend" : "colorpick", true, true, null);
            //TODO not wrap the color in an array (mobile safari/binding issue) at the time of writing this
            colorPickEvent.color = [pickedPixel.data[0], pickedPixel.data[1], pickedPixel.data[2], pickedPixel.data[3]];
            colorPickEvent.focusGrid = focusGrid;
            colorPickEvent.pageX = x;
            colorPickEvent.pageY = y;
            colorPickEvent.canvasX = canvasPoint.x;
            colorPickEvent.canvasY = canvasPoint.y;

            this.dispatchEvent(colorPickEvent);
        }
    },

    dataAtPoint: {
        value: function(x, y) {

            if (!this.hasImage || !this._canvas || x < 0 || x > this._width || y < 0 || y > this._height) {
                return null;
            }

            var canvas = this._canvas,
                context = canvas.getContext('2d');

            var data = context.getImageData(x, y, 1, 1).data;
            //TODO not wrap the color in an array (mobile safari/binding issue) at the time of writing this
            return [data[0], data[1], data[2], data[3]];
        }
    },

    _photo: {
        value: null
    },

    photo: {
        get: function() {
            return this._photo;
        },
        set: function(value) {

            if (value === this._photo) {
                return;
            }

            this._photo = value;

            if (!this._photo) {
                this.hasImage = false;
                this.needsDraw = true;
            }
        }
    },

    hasImage: {
        value: false
    },

    handleEditorImageLoad: {
        value: function(event) {
            this._imageDirty = true;
            this.hasImage = true;
            this.needsDraw = true;
        }
    },

    _width: {
        value: null
    },

    _height: {
        value: null
    },

    currentColor: {
        value: null
    },

    // TODO Eventually we need to maintain a stack of effects to apply to the image inside the editor
    // I don't want to complicate this for the demo right now though
    _inverted: {
        value: false
    },

    inverted: {
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
        value: false
    },

    desaturated: {
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
        value: false
    },

    sepiaToned: {
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
        value: false
    },

    multiplyEffect: {
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
        value: 1
    },

    multiplyMultiplier: {
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

    horizontalRuler: {
        value: null
    },

    verticalRuler: {
        value: null
    },

    pointMonitorController: {
        value: null
    },

    _isShowingPointMonitors: {
        value: null
    },

    isShowingPointMonitors: {
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
                var imageModifiedEvent = document.createEvent("CustomEvent");
                imageModifiedEvent.initCustomEvent("imagemodified", true, true, {
                    editor: this
                });
                this.dispatchEvent(imageModifiedEvent);

                this._imageDirty = false;
            }
        }
    }

});
