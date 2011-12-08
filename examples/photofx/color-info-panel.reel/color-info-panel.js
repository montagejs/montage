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
            document.application.addEventListener("colorpickend", this, false);
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
                    self.pickColor(selectedObject, self._deferredCanvasX, self._deferredCanvasY, self._deferredColor, false);

                    self._colorPickTimeout = null;
                }, 100);
            }
        }
    },

    handleColorpickend: {
        value: function(event) {
            clearTimeout(this._colorPickTimeout);
            this._colorPickTimeout = null;

            var selectedObject = this.pointMonitorController.getProperty("selectedObjects.0");
            this.pickColor(selectedObject, event.canvasX, event.canvasY, event.color, true);
        }
    },

    _undoColorPickInfo: {
        enumerable: false,
        value: null
    },

    pickColor: {
        value: function(monitor, x, y, color, undoable) {

            // Store the coordinates of the monitor right now, before we pick a color, regardless of whether
            // we want to commit the picked color or not
            if (!this._undoColorPickInfo) {
                this._undoColorPickInfo = {x: monitor.x, y: monitor.y};
            }

            monitor.x = x;
            monitor.y = y;

            if (!color && (null != x || null != y)) {
                color = this.editor.dataAtPoint(x, y);
            }
            monitor.color = color;

            // if the color pick is intended to be undoable, add the inverse to the stack
            if (undoable) {
                var originalX = this._undoColorPickInfo.x,
                    originalY = this._undoColorPickInfo.y;

                // Don't bother undoing a color pick that really wasn't a change
                if (originalX !== x || originalY !== y) {

                    // If the new x and y were null, this pickColor cleared a marker, label it as such
                    var undoLabel = (null == x || null == y) ? "clear color marker" : "set color marker"
                    document.application.undoManager.add(undoLabel, this.pickColor, this, monitor, originalX, originalY, null, true);
                }

                this._undoColorPickInfo = null;
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
