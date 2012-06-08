/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
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
        value: null,
        serializable: true
    },

    _canvas: {
        value: null,
        serializable: true
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
