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

exports.PhotoInfoPanel = Montage.create(Component, {

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
            this._photoChanged = true;
            this.needsDraw = true;
        }
    },

    _dragProxy: {
        value: null
    },

    _canvas: {
        value: null
    },

    _modifiedCanvas: {
        value: null
    },

    handleImagemodified: {
        value: function(evt) {
            this._modifiedCanvas = evt.detail.editor._canvas;
            this.needsDraw = true;
        }
    },

    prepareForDraw: {
        value: function() {
            this.element.addEventListener("mouseover", this, false);
            document.application.addEventListener("imagemodified", this, false);
        }
    },

    handleMouseover: {
        value: function() {
            if (this.photo) {
                this._prepareDownload();
            }
        }
    },

    willDraw: {
        value: function() {
            if (this._modifiedCanvas) {
                this._canvasWidth = this._modifiedCanvas.offsetWidth;
                this._canvasHeight = this._modifiedCanvas.offsetHeight;
            }
        }
    },

    _prepareDownload: {
        value: function() {
            // TODO move this to the draw loop too
            this._dragProxy.setAttribute("src", this._canvas.toDataURL());
        }
    },

    draw: {
        value: function() {
            if (this._modifiedCanvas) {
                var originalContext = this._modifiedCanvas.getContext("2d"),
                    originalData = originalContext.getImageData(0, 0, this._canvasWidth, this._canvasHeight);

                this._canvas.width = this._canvasWidth;
                this._canvas.height = this._canvasHeight;

                var thumbnailContext = this._canvas.getContext("2d");
                    thumbnailContext.putImageData(originalData, 0, 0);
                this._modifiedCanvas = null;
            }

            if (this._photoChanged) {
                if (this.photo) {
                    this._dragProxy.setAttribute("alt", this.photo.title);
                } else {
                    this._dragProxy.removeAttribute("src");
                }
                this._photoChanged = false;
            }

        }
    }

});
