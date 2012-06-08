/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

// Consider proposal at https://rniwa.com/editing/undomanager.html

var Montage = require("montage").Montage;

var UndoManager = exports.UndoManager = Montage.create(Montage, {

    enabled: {
        value: true
    },

    _maxUndoCount: {
        enumerable: false,
        value: null
    },

    maxUndoCount: {
        get: function() {
            return this._maxUndoCount;
        },
        set: function(value) {
            if (value === this._maxUndoCount) {
                return;
            }

            this._maxUndoCount = value;

            if (this._maxUndoCount != null) {
                this._trimStacks();
            }
        }

    },

    _trimStacks: {
        enumerable: false,
        value: function() {

            var undoRemoveCount = this._maxUndoCount - this.undoStack.length,
                redoRemoveCount = this._maxUndoCount - this.redoStack.length;

            if (undoRemoveCount > 0) {
                this.undoStack.splice(0, undoRemoveCount);
            }

            if (redoRemoveCount > 0) {
                this.redoStack.splice(0, redoRemoveCount);
            }
        }
    },

    _undoStack: {
        enumerable: false,
        value: null
    },

    undoStack: {
        get: function() {
            if (!this._undoStack) {
                this._undoStack = [];
            }
            return this._undoStack
        }
    },

    redoStack: {
        value: [],
        distinct: true
    },

    add: {
        value: function(label, undoFunction, context) {

            if (0 === this._maxUndoCount) {
                return;
            }

            var undoEntry = {
                label: label,
                undoFunction: undoFunction,
                context: context,
                args: Array.prototype.slice.call(arguments, 3)
            };

            // seeing as you can only ever add one entry at a time to either stack, we should never need to make room
            // for more than a single entry at this point; there's no need for an expensive trim
            if (this.isUndoing) {

                // preserve the label of the current action being undone to be the name of the redo
                undoEntry.label = this.undoEntry.label;

                if (this.redoStack.length === this._maxUndoCount) {
                    this.redoStack.shift();
                }

                this.redoStack.push(undoEntry);
            } else {

                if (this.undoStack.length === this._maxUndoCount) {
                    this.undoStack.shift();
                }

                this.undoStack.push(undoEntry);

                if (!this.isRedoing && this.redoStack.length > 0) {
                    this.clearRedo();
                }
            }
        }
    },

    clearUndo: {
        value: function() {
            this.undoStack.splice(0, this.undoStack.length);
        }
    },

    clearRedo: {
        value: function() {
            this.redoStack.splice(0, this.redoStack.length);
        }
    },

    isUndoing: {
        dependencies: ["undoEntry"],
        get: function() {
            return !!this.undoEntry;
        }
    },

    isRedoing: {
        dependencies: ["redoEntry"],
        get: function() {
            return !!this.redoEntry;
        }
    },

    undoEntry: {
        enumerable: false,
        value: null
    },

    redoEntry: {
        enumerable: false,
        value: null
    },

    undo: {
        value: function() {

            if (this.isUndoing || this.isRedoing) {
                throw "UndoManager cannot initiate an undo or redo while undoing.";
            }

            if (this.undoStack.length === 0) {
                return;
            }

            var entry = this.undoEntry = this.undoStack.pop();
            entry.undoFunction.apply(entry.context, entry.args);
            this.undoEntry = null;
        }
    },

    redo: {
        value: function() {
            if (this.isUndoing || this.isRedoing) {
                throw "UndoManager cannot initiate an undo or redo while redoing.";
            }

            if (this.redoStack.length === 0) {
                return;
            }

            var entry = this.redoEntry = this.redoStack.pop();
            entry.undoFunction.apply(entry.context, entry.args);
            this.redoEntry = null;
        }
    },

    canUndo: {
        dependencies: ["undoStack.count()"],
        get: function() {
            return !!this.undoStack.length;
        }
    },

    canRedo: {
        dependencies: ["redoStack.count()"],
        get: function() {
            return !!this.redoStack.length;
        }
    },

    undoLabel: {
        dependencies: ["undoStack.count()"],
        get: function() {
            var undoCount = this.undoStack.length,
                label;

            if (undoCount) {
                label = this.undoStack[undoCount - 1].label;
            }

            return label ? "Undo " + label : "Undo";
        },
        set: function(value) {
            var undoCount = this.redoStack.length;
            if (undoCount) {
                this.undoStack[undoCount - 1].label = value;
            }
        }
    },

    redoLabel: {
        dependencies: ["redoStack.count()"],
        get: function() {
            var redoCount = this.redoStack.length,
                label;

            if (redoCount) {
                label = this.redoStack[redoCount - 1].label
            }

            return label ? "Redo " + label : "Redo";
        },
        set: function(value) {
            var redoCount = this.redoStack.length;
            if (redoCount) {
                this.redoStack[redoCount - 1].label = value;
            }
        }
    }

});

var _defaultUndoManager = null;
Montage.defineProperty(exports, "defaultUndoManager", {
    get: function() {
        if (!_defaultUndoManager) {
            _defaultUndoManager = UndoManager.create();
        }
        return _defaultUndoManager;
    }
});
