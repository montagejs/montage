/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

exports.TaskListControls = Montage.create(Component, {

    didCreate: {
        value: function() {
            Object.defineBinding(this, "completedValues", { boundObject:this, boundObjectPropertyPath: "tasksController.organizedObjects.completed"});
        }
    },

    _completedValues: {
        value: null
    },

    completedValues: {
        get: function() {
            return this._completedValues;
        },
        set: function(values) {
            this._completedValues = values;
            if (values) {
                this.anyCompleted = values.some(function(value) {return value;});
            }
        }
    },

    anyCompleted: {
        value: null
    },

    prepareForDraw: {
        value: function() {

            if (this.clearCompletedForm) {
                this.clearCompletedForm.addEventListener("submit", this, false);
            }

        }
    },

    tasksController: {
        value: null
    },

    clearCompletedForm: {
        value: null,
        serializable: true
    },

    handleSubmit: {
        value: function(event) {
            event.preventDefault();


            var completedTasks = this.tasksController.organizedObjects.filter(function(value) {
                return value.completed;
            });

            this.tasksController.removeObjects.apply(this.tasksController, completedTasks);
        }
    }

});
