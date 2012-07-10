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

exports.GridMagnifier = Montage.create(Component, {

    _loupe: {
            value: null,
            serializable: true
        },

    _canvas: {
        value: null
    },

    _grid: {
        value: null
    },

    grid: {
        get: function() {
            return this._grid;
        },
        set: function(value) {

            if (value === this._grid) {
                return;
            }

            this._grid = value;

            this.needsDraw = true;
        }
    },

    _width: {
        value: null
    },

    _height: {
        value: null
    },

    _pageCenterX: {
        value: null
    },

    _pageCenterY: {
        value: null
    },

    x: {
        value: null
    },

    y: {
        value: null
    },

    color: {
        value: null
    },

    colorPickerEnabled: {
        value: false
    },

    handleColorpick: {
        value: function(event) {
            this._pageCenterX = event.pageX;
            this._pageCenterY = event.pageY;
            this.x = event.canvasX;
            this.y = event.canvasY;
            // TODO these should trigger draw if changed elsewhere, but that shouldn't happen anyway
            this.grid = event.focusGrid;
            this.color = event.color;

            document.application.addEventListener("colorpickend", this, false);
        }
    },

    handleColorpickend: {
        value: function() {
            document.application.removeEventListener("colorpickend", this, false);
            this._pageCenterX = null;
            this._pageCenterY = null;
            this.grid = null;
        }
    },

    _followPointer: {
        value: false,
        serializable: true
    },

    followPointer: {
        get: function() {
            return this._followPointer;
        },
        set: function(value) {
            if (value === this._followPointer) {
                return;
            }

            this._followPointer = value;
            this.needsDraw = true;
        }
    },

    prepareForDraw: {
        value: function() {
            document.application.addEventListener("colorpick", this, false);

            // TODO this is a workaround for a problem with our deserialization in iOS concerning
            // canvas elements. Debugging points to some issue with adoptNode. Either way,
            // if we don't do this it takes two draw cycles to actually get the canvas rendering.
            var newCanvas = this._canvas.cloneNode(true);
            this._canvas.parentNode.replaceChild(newCanvas, this._canvas);
            this._canvas = newCanvas;

            this._context = this._canvas.getContext("2d");
        }
    },

    willDraw: {
        value: function() {
            this._width = this._loupe.offsetWidth;
            this._height = this._loupe.offsetHeight;
        }
    },

    draw: {
        value: function() {
            // Don't draw unless we have something to actually draw
            if (!this._width || !this._height || !this.grid) {
                this.element.classList.remove("active");
                return;
            }

            this.element.classList.add("active");

            if (this.followPointer) {
                this.element.classList.remove("stationary");
            } else {
                this.element.classList.add("stationary");
            }

            var gridSize = 10,
                translateX = (this._pageCenterX - (this._width/2)) - (gridSize/2),
                translateY = (this._pageCenterY - (this._height/2)) - (gridSize/2),
                relativePoint = dom.convertPointFromPageToNode(this.element.parentNode, Point.create().init(translateX, translateY)),
                gridData = this.grid.data,
                context = this._context,
                x,
                y,
                i = 0,
                rowCount = Math.floor(this._width / gridSize),
                columnCount = Math.floor(this._height / gridSize);

            // Move to the right spot
            if (this.followPointer) {
                this.element.style.webkitTransform = "translate3d(" + relativePoint.x + "px, " + relativePoint.y + "px , 0)";
            } else {
                this.element.style.webkitTransform = "translate3d(0, 0, 0)";
            }

            context.clearRect(0, 0, this._width, this._height);

            // Draw color squares
            // TODO but we may have been given a bigger region than we are showing
            // right now this works fine because we'd hardcoded the grid size

            for (y = 0; y < rowCount; y++) {
                for (x = 0; x < columnCount; x++) {
                    context.fillStyle = "rgba(" + gridData[i] + "," + gridData[i+1] + "," + gridData[i+2] + "," + gridData[i+3] + ")";
                    context.fillRect(x * gridSize, y * gridSize, gridSize, gridSize);
                    i += 4;
                }
            }

            // Draw Grid lines
            context.globalAlpha = 0.1;
            context.globalCompositeOperation = 'xor';
            context.strokeStyle = '#000';
            context.lineWidth   = 1;

            context.beginPath();

            for (x = 0; x <= this._width; x += gridSize) {
                context.moveTo(x, 0);
                context.lineTo(x, this._height);
            }

            for (y = 0; y <= this._height; y += gridSize) {
                context.moveTo(0, y);
                context.lineTo(this._width, y);
            }

            context.stroke();
            context.closePath();
            context.globalAlpha = 1;
            context.globalCompositeOperation = 'source-over';

            // Draw focus rectangle
            context.strokeRect(Math.floor(columnCount/2) * gridSize, Math.floor(rowCount/2)* gridSize, gridSize, gridSize);
        }
    }

});
