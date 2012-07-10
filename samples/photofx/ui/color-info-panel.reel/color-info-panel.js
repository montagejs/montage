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
var ArrayController = require("montage/ui/controller/array-controller").ArrayController;
var PointMonitor = require("core/point-monitor").PointMonitor;
var undoManager = require("montage/core/undo-manager").defaultUndoManager;

exports.ColorInfoPanel = Montage.create(Component, {

    didCreate: {
        value: function() {

            this.pointMonitorController = ArrayController.create();
            this.pointMonitorController.content = [];
            this.pointMonitorController.objectPrototype = PointMonitor;

            for (var i = 0; i < 2; i++) {
                this.pointMonitorController.add();
            }

            this.pointMonitorController.selectedIndexes = [0];
            this.pointMonitorController.selectObjectsOnAddition = true;
        }
    },

    _editor: {
        enumerable: false,
        value: null
    },

    editor: {
        get: function() {
            return this._editor;
        },
        set: function(value) {

            var oldEditor = this._editor;

            if (value === oldEditor) {
                return;
            }

            if (oldEditor) {
                oldEditor.pointMonitorController = null;
                oldEditor.removeEventListener("colorpick", this, false);
                oldEditor.removeEventListener("colorpickend", this, false);
                oldEditor.removeEventListener("imagemodified", this, false);
            }

            this._editor = value;

            if (value) {
                value.pointMonitorController = this.pointMonitorController;
                value.addEventListener("colorpick", this, false);
                value.addEventListener("colorpickend", this, false);
                value.addEventListener("imagemodified", this, false);
            }
        }
    },

    handleColorpick: {
        value: function(event) {
            // a color was picked, update the color for the current selected color picker
            var selectedObject = this.pointMonitorController.getProperty("selectedObjects.0");
            if (selectedObject) {
                this.pickColor(selectedObject, event.canvasX, event.canvasY, event.color, false);
            }
        }
    },

    handleColorpickend: {
        value: function(event) {
            var selectedObject = this.pointMonitorController.getProperty("selectedObjects.0");
            if (selectedObject) {
                this.pickColor(selectedObject, event.canvasX, event.canvasY, event.color, true);
            }
        }
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
                    var undoLabel = (null == x || null == y) ? "clear color marker" : "set color marker";
                    undoManager.add(undoLabel, this.pickColor, this, monitor, originalX, originalY, null, true);
                }

                this._undoColorPickInfo = null;
            }

        }
    },

    handleImagemodified: {
        value: function(evt) {
            var pointMonitors = this.getProperty("pointMonitorController.organizedObjects"),
                editor = evt.detail.editor,
                i,
                iPointMonitor;


            if (!pointMonitors || editor !== this._editor) {
                return;
            }

            for (i = 0; (iPointMonitor = pointMonitors[i]); i++) {
                if (null != iPointMonitor.x && null != iPointMonitor.y) {
                    iPointMonitor.color = editor.dataAtPoint(iPointMonitor.x, iPointMonitor.y);
                }
            }

        }
    },

    handleAddMonitorButtonAction: {
        value: function() {
            this.addPointMonitors();
        }
    },

    handleRemoveMonitorButtonAction: {
        value: function() {
            this.removePointMonitors();
        }
    },

    addPointMonitors: {
        value: function(monitors) {

            var pointMonitors = this.pointMonitorController;

            //Don't shift selection when undoing
            if (undoManager.isUndoing) {
                pointMonitors.selectObjectsOnAddition = false;
            }

            if (monitors) {
                pointMonitors.addObjects.apply(pointMonitors, monitors);
            } else {
                pointMonitors.add();
            }

            // TODO account for multiple addition undoing
            // don't assume it's the last one (or that it appears in organizedObjects at all)
            undoManager.add("add color marker", this.removePointMonitors, this, [pointMonitors.organizedObjects.length - 1]);

            if (undoManager.isUndoing) {
                pointMonitors.selectObjectsOnAddition = true;
            }
        }
    },

    removePointMonitors: {
        value: function(indexes) {

            var removedMonitors;

            if (indexes) {
                removedMonitors = this.pointMonitorController.removeObjectsAtIndexes(indexes);
            } else {

                var selectedIndex = this.pointMonitorController.selectedIndexes[0],
                    objectCount;

                removedMonitors = this.pointMonitorController.remove();

                objectCount = this.pointMonitorController.organizedObjects.length;

               if (!this.pointMonitorController.selectedIndexes.length && objectCount > selectedIndex) {
                   this.pointMonitorController.selectedIndexes = [selectedIndex];
               } else {
                   this.pointMonitorController.selectedIndexes = [selectedIndex - 1];
               }

            }

            if (removedMonitors && removedMonitors.length > 0) {
                undoManager.add("remove color marker", this.addPointMonitors, this, removedMonitors);
            }

        }
    }

});
