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

// Consider proposal at https://rniwa.com/editing/undomanager.html
/**
    @module montage/core/undo-manager
*/

var Montage = require("montage").Montage;

/**
    @class module:montage/core/undo-manager.UndoManager
    @extends module:montage/core/core.Montage
*/
var UndoManager = exports.UndoManager = Montage.create(Montage, /** @lends module:montage/core/undo-manager.UndoManager# */ {

    enabled: {
        value: true
    },

    _maxUndoCount: {
        enumerable: false,
        value: null
    },

/**
    Maximum number of undos.
*/
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

/**
    The undo stack.
*/
    undoStack: {
        get: function() {
            if (!this._undoStack) {
                this._undoStack = [];
            }
            return this._undoStack
        }
    },

/**
    The redo stack.
*/
    redoStack: {
        value: [],
        distinct: true
    },

/**
    Adds a new item to the undo stack.
    @param {string} label A label to associate with the undo item.
    @param {function} undoFunction The function to invoke when the item is popped from the undo stack.
    @param {object} context The context in which the undo function should be invoked.
    @function
*/
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

/**
    Removes all items from the undo stack.
    @function
*/

    clearUndo: {
        value: function() {
            this.undoStack.splice(0, this.undoStack.length);
        }
    },

/**
    Removes all items from the redo stack.
    @function
*/

    clearRedo: {
        value: function() {
            this.redoStack.splice(0, this.redoStack.length);
        }
    },

/**
    Returns `true` if the UndoManager is in the middle of an undo operation, otherwise returns `false`.
*/
    isUndoing: {
        dependencies: ["undoEntry"],
        get: function() {
            return !!this.undoEntry;
        }
    },

/**
    Returns `true` if the UndoManager is in the middle of an redo operation, otherwise returns `false`.
*/
    isRedoing: {
        dependencies: ["redoEntry"],
        get: function() {
            return !!this.redoEntry;
        }
    },

/**
    The current undo item being operated on.
*/
    undoEntry: {
        enumerable: false,
        value: null
    },

/**
    The current redo item being operated on.
*/
    redoEntry: {
        enumerable: false,
        value: null
    },

/**
    Removes the last item in the undo stack and invokes its undo function.
    @function
*/
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

/**
    Removes the last item in the undo stack and invokes its undo function.
    @function
*/
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

/**
    Returns true if the undo stack contains any items, otherwise returns false.
*/
    canUndo: {
        dependencies: ["undoStack.count()"],
        get: function() {
            return !!this.undoStack.length;
        }
    },

/**
    Returns true if the redo stack contains any items, otherwise returns false.
*/
    canRedo: {
        dependencies: ["redoStack.count()"],
        get: function() {
            return !!this.redoStack.length;
        }
    },

/**
    Contains the label of the last item added to the undo stack, preceded by "Undo" (for example, "Undo Item Removal"). If the item does not have a label, then the string "Undo" is returned.
*/

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

/**
    Contains the label of the last item added to the redo stack, preceded by "Redo" (for example, "Redo Item Removal"). If the item does not have a label, then the string "Redo" is returned.
*/
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
