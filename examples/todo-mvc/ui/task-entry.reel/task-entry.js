/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;var Component = require("montage/ui/component").Component;

exports.TaskEntry = Montage.create(Component, {

    _task: {
        value: null
    },

    task: {
        get: function() {
            return this._task;
        },
        set: function(value) {

            if (this._task === value) {
                return;
            }

            if (this._task) {
                this._task.removePropertyChangeListener("completed", this, false);
            }

            this._task = value;
            this.needsDraw = true;

            if (this.task) {
                this._task.addPropertyChangeListener("completed", this, false);
            }
        }
    },

    completedCheckbox: {
        value: null,
        serializable: true
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

    handleChange: {
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
