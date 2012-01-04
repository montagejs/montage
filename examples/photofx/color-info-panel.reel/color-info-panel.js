/* <copyright>
Copyright (c) 2012, Motorola Mobility, Inc

All Rights Reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

  - Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
  - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
  - Neither the name of Motorola Mobility nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
</copyright> */
var Montage = require("montage").Montage;
var Component = require("montage/ui/component").Component;

exports.ColorInfoPanel = Montage.create(Component, {

    pointMonitorController: {
        enumerable: false,
        value: null
    },

    prepareForDraw: {
        value: function() {
            document.application.addEventListener("colorpick", this, false);
            document.application.addEventListener("imagemodified", this, false);

            if (this.pointMonitorController && null == this.pointMonitorController.selectedIndexes) {
                this.pointMonitorController.selectedIndexes = [0];
            }
        }
    },

    handleColorpick: {
        value: function(event) {
            // a color was picked, update the color for the current selected color picker
            // also need to update the stored point for that picker

            var self = this;
            this._deferredColor = event.color;
            this._deferredCanvasX = event.canvasX;
            this._deferredCanvasY = event.canvasY;

            // Deferring accepting a color as a bit of a performance optimization to improve magnifier drawing
            if (!this._colorPickTimeout) {
                this._colorPickTimeout = setTimeout(function() {

                    var selectedObject = self.pointMonitorController.getProperty("selectedObjects.0");

                    if (!selectedObject) {
                        // TODO update some non-pointMonitor-backed color picker
                        // self.color = self._deferredColor;
                    } else {
                        selectedObject.color = self._deferredColor;
                        selectedObject.x = self._deferredCanvasX;
                        selectedObject.y = self._deferredCanvasY;
                    }

                    self._colorPickTimeout = null;
                }, 100);
            }
        }
    },

    handleImagemodified: {
        value: function(evt) {
            var pointMonitors = this.getProperty("pointMonitorController.organizedObjects"),
                editor,
                i,
                iPointMonitor;

            if (!pointMonitors) {
                return;
            }

            editor = evt.detail.editor;

            for (i = 0; (iPointMonitor = pointMonitors[i]); i++) {
                if (null != iPointMonitor.x && null != iPointMonitor.y) {
                    iPointMonitor.color = editor.dataAtPoint(iPointMonitor.x, iPointMonitor.y);
                }
            }

        }
    }

});
