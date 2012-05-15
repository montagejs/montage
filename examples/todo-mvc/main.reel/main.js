/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    Task = require("task").Task,
    Serializer = require("montage/core/serializer").Serializer,
    Deserializer = require("montage/core/deserializer").Deserializer,
    ChangeEventConstructor = require("montage/core/event/mutable-event")._Change,
    LOCAL_STORAGE_KEY = "montage_todo_mvc_tasks";

exports.Main = Montage.create(Component, {

    templateDidLoad: {
        value: function() {
            if (localStorage) {
                var tasksSerialization = localStorage.getItem(LOCAL_STORAGE_KEY);

                if (tasksSerialization) {
                    var deserializer = Deserializer.create(),
                        self = this;
                    try {
                        deserializer.initWithStringAndRequire(tasksSerialization, require).deserializeObject(function(tasks) {
                            self.tasks = tasks;
                        }, require);
                    } catch(e) {
                        console.error("Could not load saved tasks.");
                        console.debug("Could not deserialize", tasksSerialization);
                        console.log(e.stack);
                    }
                }
            }
        }
    },

    tasks: {
        enumerable: false,
        distinct: true,
        value: []
    },

    unfinishedTasks: {
        dependencies: ["tasks.completed"],
        enumerable: false,
        get: function() {

            if (this.tasks) {
                return this.tasks.filter(function(element) {
                    return !element.completedDate;
                });
            }
        }
    },

    tasksController: {
        enumerable: false,
        value: null
    },

    taskForm: {
        enumerable: false,
        value: null
    },

    _markAllCompleteForm: {
        enumerable: false,
        value: false
    },

    markAllCompleteForm: {
        enumerable: false,
        get: function() {
            return this._markAllCompleteForm;
        },
        set: function(value) {
            this._markAllCompleteForm = value;
            this._markAllCompleteForm.identifier = "markAllComplete";
        }
    },

    taskNoteField: {
        enumerable: false,
        value: null
    },

    prepareForDraw: {
        value: function() {
            if (window.Touch) {
                this.element.classList.add("touch");
            }

            this.element.classList.remove("loading");

            this.taskForm.addEventListener("submit", this, false);
            this.markAllCompleteForm.addEventListener("submit", this, false);

            // TODO not observe every possible key we care to trigger a save on
            var self = this,
                saveCallback = function() {
                    self.save();
                };

            this.addPropertyChangeListener("tasks.completedDate", saveCallback, false);
            this.addPropertyChangeListener("tasks.note", saveCallback, false);
        }
    },

    handleSubmit: {
        value: function(event) {
            event.preventDefault();

            var note = this.taskNoteField.value;

            if (!note || note.match(/^\s+$/)) {
                // Ignore null or completely blank entries
                return;
            }

            this.tasksController.addObjects(Task.create().initWithNote(note));

            this.taskNoteField.value = null;
        }
    },

    handleMarkAllCompleteSubmit: {
        value: function(event) {
            event.preventDefault();

            var i,
                iTask,
                allCompleted;

            allCompleted = this.tasks.every(function(element) {
                return element.completed;
            });

            for (i = 0; (iTask = this.tasks[i]); i++) {
                iTask.completed = !allCompleted;
            }

        }
    },

    _saveTimeout: {
        enumerable: false,
        value: null
    },

    save: {
        value: function() {
            if (localStorage) {

                if (this._saveTimeout) {
                    clearTimeout(this._saveTimeout);
                    this._saveTimeout = null;
                }

                // TODO this would be replaced with a formal system for this eventually, just delaying it to
                // not slow down rendering etc.

                var tasks = this.tasks;

                setTimeout(function() {
                    var serializer = Serializer.create().initWithRequire(require);
                    localStorage.setItem(LOCAL_STORAGE_KEY, serializer.serializeObject(tasks));
                }, 50)
            }
        }
    }

});
