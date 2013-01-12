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

var Montage = require("montage").Montage,
    Promise = require("core/promise").Promise,
    WeakMap = require("collections/weak-map");

var UNDO_OPERATION = 0,
    REDO_OPERATION = 1;

/**
    @class module:montage/core/undo-manager.UndoManager
    @extends module:montage/core/core.Montage
*/
var UndoManager = exports.UndoManager = Montage.create(Montage, /** @lends module:montage/core/undo-manager.UndoManager# */ {

    _operationQueue: {
        value: null
    },

    _promiseOperationMap: {
        value: null
    },

    didCreate: {
        value: function () {
            this._operationQueue = [];
            this._promiseOperationMap = new WeakMap();
            this._undoStack = [];
            this._redoStack = [];
        }
    },

    _maxUndoCount: {
        enumerable: false,
        value: null
    },

    /**
        Maximum number of operations allowed in each undo and redo stack
        Setting this lower than the current count of undo/redo operations will remove
        the oldest undos/redos as necessary to meet the new limit.
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

    _undoStack: {
        value: null
    },

    /**
        The current number of stored undoable operations
     */
    undoCount: {
        get: function () {
            return this._undoStack.length;
        }
    },

    _redoStack: {
        value: null
    },

    /**
        The current number of stored redoable operations
     */
    redoCount: {
        get: function () {
            return this._redoStack.length;
        }
    },

    _trimStacks: {
        enumerable: false,
        value: function() {

            var undoRemoveCount = this._undoStack.length - this._maxUndoCount,
                redoRemoveCount = this._redoStack.length - this._maxUndoCount;

            if (undoRemoveCount > 0) {
                this._undoStack.splice(0, undoRemoveCount);
            }

            if (redoRemoveCount > 0) {
                this._redoStack.splice(0, redoRemoveCount);
            }
        }
    },

/**
    Adds a new operation to the either the undo or redo stack as appropriate.
    @param {string} label A label to associate with this undo entry.
    @param {promise} operationPromise A promise for an undoable operation
    @returns a promise for the resolution of the operationPromise
    @function
*/
    add: {
        value: function (label, operationPromise) {

            if (0 === this._maxUndoCount) {
                return Promise.resolve(null);
            }

            var undoEntry = {label: label};

            if (this.isUndoing) {

                // preserve the label of the current action being undone to be the name of the redo
                undoEntry.label = this.undoEntry.label;

                if (this._redoStack.length === this._maxUndoCount) {
                    this._redoStack.shift();
                }

                this._redoStack.push(operationPromise);
            } else {

                if (this._undoStack.length === this._maxUndoCount) {
                    this._undoStack.shift();
                }

                this._undoStack.push(operationPromise);

                if (!this.isRedoing && this._redoStack.length > 0) {
                    this.clearRedo();
                }
            }

            this._promiseOperationMap.set(operationPromise, undoEntry);
            return operationPromise.spread(this._resolveUndoEntry(this, undoEntry));
        }
    },

    _resolveUndoEntry: {
        value: function(undoManager, entry) {

            return function (label, undoFunction, context) {

                entry.label = label;
                entry.undoFunction = undoFunction;
                entry.context = context;
                entry.args = Array.prototype.slice.call(arguments, 3);

                undoManager._flushOperationQueue();
            };
        }
    },

    _flushOperationQueue: {
        value: function () {

            var opQueue = this._operationQueue,
                opCount = opQueue.length,
                i,
                completedPromises = [],
                completedCount,
                promise,
                entry,
                opMap = this._promiseOperationMap;

            if (0 === opCount) {
                return;
            }

            for (i = opCount - 1; i >= 0; i--) {
                promise = opQueue[i];
                entry = this._promiseOperationMap.get(promise);

                if (typeof entry.undoFunction === "function") {
                    this._performOperation(entry);
                    completedPromises.push(promise);
                } else {
                    break;
                }
            }

            completedCount = completedPromises.length;

            if (completedCount > 0) {
                // remove the performed operations
                opQueue.splice(opCount - completedCount, completedCount);

                completedPromises.forEach(function (opPromise) {
                    opMap.delete(opPromise);
                });
            }

        }
    },

    _performOperation: {
        value: function (entry) {

            if (entry.operationType === UNDO_OPERATION) {
                this.undoEntry = entry;
            } else {
                this.redoEntry = entry;
            }

            entry.undoFunction.apply(entry.context, entry.args);

            this.undoEntry = null;
            this.redoEntry = null;

            entry.deferredOperation.resolve(true);
        }
    },

    /**
        Removes all items from the undo stack.
        @function
    */
    clearUndo: {
        value: function() {
            this._undoStack.splice(0, this._undoStack.length);
        }
    },

    /**
        Removes all items from the redo stack.
        @function
    */
    clearRedo: {
        value: function() {
            this._redoStack.splice(0, this._redoStack.length);
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


    undoEntry: {
        enumerable: false,
        value: null
    },

    redoEntry: {
        enumerable: false,
        value: null
    },

    /**
        Schedules the next undo operation for invocation as soon as possible
        @function
     */
    undo: {
        value: function() {

            if (0 === this.undoCount) {
               return Promise.resolve(null);
            }

            return this._scheduleOperation(this._undoStack.pop(), UNDO_OPERATION);
        }
    },

    /**
        Schedules the next redo operation for invocation as soon as possible
        @function
    */
    redo: {
        value: function() {

            if (0 === this.redoCount) {
                return Promise.resolve(null);
            }

            return this._scheduleOperation(this._redoStack.pop(), REDO_OPERATION);
        }
    },

    _scheduleOperation: {
        value: function (operationPromise, operationType) {

            var deferredOperation = Promise.defer(),
                entry = this._promiseOperationMap.get(operationPromise);

            entry.deferredOperation = deferredOperation;
            entry.operationType = operationType;

            this._operationQueue.push(operationPromise);
            this._flushOperationQueue();

            return deferredOperation.promise;
        }
    },

    /**
        Returns true if the undo stack contains any items, otherwise returns false.
    */
    canUndo: {
        dependencies: ["undoStack.count()"],
        get: function() {
            return !!this._undoStack.length;
        }
    },

    /**
        Returns true if the redo stack contains any items, otherwise returns false.
    */
    canRedo: {
        dependencies: ["redoStack.count()"],
        get: function() {
            return !!this._redoStack.length;
        }
    },

    /**
        Contains the label of the last item added to the undo stack, preceded by "Undo" (for example, "Undo Item Removal"). If the item does not have a label, then the string "Undo" is returned.
    */
    undoLabel: {
        // TODO also depend on the actual label property of that object
        dependencies: ["undoStack.count()"],
        get: function() {
            var undoCount = this._undoStack.length,
                label;

            if (undoCount) {
                label = this._promiseOperationMap.get(this._undoStack[undoCount - 1]).label;
            }

            return label ? "Undo " + label : "Undo";
        }
    },

    /**
        Contains the label of the last item added to the redo stack, preceded by "Redo" (for example, "Redo Item Removal"). If the item does not have a label, then the string "Redo" is returned.
    */
    redoLabel: {
        // TODO also depend on the actual label property of that object
        dependencies: ["redoStack.count()"],
        get: function() {
            var redoCount = this._redoStack.length,
                label;

            if (redoCount) {
                label = this._promiseOperationMap.get(this._redoStack[redoCount - 1]).label
            }

            return label ? "Redo " + label : "Redo";
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
