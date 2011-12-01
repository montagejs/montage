/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;var Component = require("montage/ui/component").Component;

exports.TaskEntry = Montage.create(Component, {
    hasTemplate: {value: true},

    _task: {
        enumerable: false,
        value: null
    },

    task: {
        enumerable: false,
        get: function() {
            return this._task;
        },
        set: function(value) {

            if (this._task === value) {
                return;
            }

            if (this._task) {
                this._task.removeEventListener("change@completed", this, false);
            }

            this._task = value;
            this.needsDraw = true;

            if (this.task) {
                this._task.addEventListener("change@completed", this, false);
            }
        }
    },

    completedCheckbox: {
        enumerable: false,
        value: null
    },

    prepareForDraw: {
        value: function() {
            this.completedCheckbox.identifier = "completedCheckbox";
            this.completedCheckbox.addEventListener("change", this, false);
        }
    },

    handleCompletedCheckboxChange: {
        value: function() {
            this.task.completed = !!this.completedCheckbox.checked;
        }
    },

    handleEvent: {
        value: function() {
            this.needsDraw = true;
        }
    },

    draw: {
        value: function() {
            if (this.task && this.task.completed) {
                this.completedCheckbox.checked = true;
                this.element.classList.add("completed");
            } else {
                this.completedCheckbox.checked = false;
                this.completedCheckbox.removeAttribute("checked");
                this.element.classList.remove("completed");
            }
        }
    }

});
