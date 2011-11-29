/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
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
