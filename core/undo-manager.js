// Consider proposal at https://rniwa.com/editing/undomanager.html
/**
 @module montage/core/undo-manager
 */

var Montage = require("montage").Montage,
    Promise = require("core/promise").Promise,
    Map = require("collections/map"),
    List = require("collections/list");

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

var UNDO_OPERATION = 0,
    REDO_OPERATION = 1;

/**
 *    Applications that allow end-user operations can use an UndoManager to record
 *    information on how to undo those operations.
 *
 *    ## Undoable Operations
 *
 *    To make an operation undoable an application simply adds the inverse of that
 *    operation to an UndoManager instance using the ```add``` method:
 *
 *    ```undoManager.register(label, operationPromise)```
 *
 *    This means that every undo-able user operation has to have an inverse
 *    operation available. For example a calculator might provide a ```subtract```
 *    method as the inverse of the ```add``` method.
 *
 *    An simple example would look something like this:
 *
 *```javascript
 *add: {
 *       value: function (number) {
 *           this.undoManager.register("Add", Promise.resolve([this.subtract, this, number]));
 *           var result = this.total += number;
 *           return result;
 *       }
 *   },
 *
 *subtract: {
 *       value: function (number) {
 *           this.undoManager.register("Subtract", Promise.resolve([this.add, this, number]));
 *           var result = this.total -= number;
 *           return result;
 *       }
 *   }
 *```
 *
 *    Of immediate interest is the actual promise added to the undoManager.
 *    ```Promise.resolve(["Add", this.subtract, this, number])```
 *
 *    The promise provides the final label (optionally), a reference to the function to call,
 *    the context for the function to be executed in, and any number of arguments
 *    to be passed along when calling the function.
 *
 *    In simple cases such as this the promise for the inverse operation
 *    can be resolved immediately; this is not necessarily always possible in cases
 *    where the operation itself is asynchronous.
 *
 *    ## Basic Undoing and Redoing
 *
 *    After performing ```calculator.add(42)``` the undoManager will have an entry
 *    on how to undo that addition operation. Each operation added to the
 *    undoManager is added on top of a stack. Calling the undoManager's ```undo```
 *    method will perform the operation on the top of that stack if
 *    original operationPromise has been resolved.
 *
 *    While performing an undo operation any additions to the undoManager will
 *    instead be placed on the redo stack. Conversely, any additions made while
 *    performing a redo operation will be placed on the undo stack.
 *
 *    When not actively undoing or redoing, the redo stack is cleared whenever a
 *    new operation is added; the only way operations end up on the redo stack is
 *    through undoing an operation.
 *
 *    ## Asynchronous Considerations
 *
 *    It is possible for a user invoked operation to take some time to complete or
 *    details of how to undo the operation may not be known until the operation
 *    has completed.
 *
 *    In these cases it is important to remember that the undo stack captures user
 *    intent, which is considered synchronous. This is why the undoManager accepts
 *    promises for the operations but places them on the stack synchronously.
 *
 *    Consider the following example:
 *```javascript
 *addRandomNumber: {
 *       var deferredUndo,
 *           self = this;
 *
 *       this.undoManager.register("Add Random", deferredUndo.promise);
 *
 *       return this.randomNumberGeneratorService.next().then(function(rand) {
 *           deferredUndo.resolve(["Add " + rand, self.subtract, self, rand];
 *           var result = self.total = self.total + number;
 *           return result
 *       });
 *   }
 *```
 *
 *    Here we see that the undo operation for addRandomNumber is added to the
 *    UndoManager before we even know how to undo the operation, indeed it's added
 *    before the operation has even happened.
 *
 *    It is worth noting that the undoManager does not block anything. Users are
 *    still free to call ```add```, ```subtract```, ```addRandomNumber``` or any
 *    other APIs exposed by the calculator, whether the ```addRandomNumber``` has
 *    resolved or not. It's the responsibility of an API provider to handle this
 *    scenario as necessary.
 *
 *    At this point two things can happen:
 *    1) A user could invoke ```undo``` after the operation promise's resolution.
 *    2) A user could invoke ```undo``` prior to the operation promise's resolution.
 *
 *    In the first scenario, things move along much like they did in the first case
 *    we described above.
 *
 *    In the second scenario, the undoManager puts the unresolved promise into a
 *    queue of operations to be performed when possible. Subsequent undo and redo
 *    requests are added to this queue.
 *
 *    Whenever a promise is resolved the undoManager runs through this queue in
 *    order, oldest to newest, and attempts to perform the operation specified,
 *    stopping when it encounters an unfulfilled operation promise.
 *
 *    This guarantees that promised operations are added in the order as they were
 *    performed by the user and are executed, not in the order they are fulfilled,
 *    but in the order they are undone or redone.
 *
 *   @class UndoManager
 *   @extends Montage
*/
var UndoManager = exports.UndoManager = Montage.create(Montage, /** @lends UndoManager# */ {

    _operationQueue: {
        value: null
    },

    _promiseOperationMap: {
        value: null
    },

    didCreate: {
        value: function () {
            this._operationQueue = [];
            this._promiseOperationMap = new Map();
            this._undoStack = new List();
            this._redoStack = new List();

            this.defineBinding("undoLabel", {"<-": "_promiseOperationMap.get(_undoStack.head.prev.value).label"});
            this.defineBinding("undoCount", {"<-": "length", source: this._undoStack});
            this.defineBinding("canUndo", {"<-": "!!length", source: this._undoStack});
            this.defineBinding("isUndoing", {"<-": "!!undoEntry"});

            this.defineBinding("redoLabel", {"<-": "_promiseOperationMap.get(_redoStack.head.prev.value).label"});
            this.defineBinding("redoCount", {"<-": "length", source: this._redoStack});
            this.defineBinding("canRedo", {"<-": "!!length", source: this._redoStack});
            this.defineBinding("isRedoing", {"<-": "!!redoEntry"});
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
        get: function () {
            return this._maxUndoCount;
        },
        set: function (value) {
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
        value: 0
    },

    _redoStack: {
        value: null
    },

    /**
        The current number of stored redoable operations
     */
    redoCount: {
        value: 0
    },

    _trimStacks: {
        enumerable: false,
        value: function () {

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
     * Whether or not to accept registration of undo/redo operations
     *
     * This is typically used to disable registration of operations
     * temporarily while undoable actions should be performed without
     * being undoable.
     */
    registrationEnabled: {
        value: true
    },

/**
 *    Adds a new operation to the either the undo or redo stack as appropriate.
 *
 *    The operationPromise should be resolved with an array containing:
 *        - A label string for the operation (optional)
 *        - The function to execute when performing this operation
 *        - The object to use as the context when performing the function
 *        - Any number of arguments to apply when performing the function
 *
 *    ### Examples
 *    Registering an undo operation with no arguments
 *```javascript
 *undoManager.register("Square", Promise.resolve([calculator.sqrt, calculator]));
 * ```
 *
 *   Registering an undo operation with arguments
 *```javascript
 *undoManager.register("Add", Promise.resolve([calculator.subtract, calculator, number]));
 *```
  *
 *    Registering an undo operation with a label and arguments
 *```javascript
 *    undoManager.register("Add", Promise.resolve(["Add 5", calculator.subtract, calculator, 5]));
 *```
 *
 *    @param {string} label A label to associate with this undo entry.
 *    @param {promise} operationPromise A promise for an undoable operation
 *    @returns a promise for the resolution of the operationPromise
 *    @function
 */
    register: {
        value: function (label, operationPromise) {

            if (!Promise.isPromiseAlike(operationPromise)) {
                throw new Error("UndoManager expected a promise");
            }

            if (0 === this._maxUndoCount || !this.registrationEnabled) {
                return Promise.resolve(null);
            }

            var undoEntry = {label: label};
            this._promiseOperationMap.set(operationPromise, undoEntry);

            if (this.isUndoing) {

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

            return operationPromise.spread(this._resolveUndoEntry(this, undoEntry));
        }
    },

    _resolveUndoEntry: {
        value: function(undoManager, entry) {

            return function () {

                var label,
                    undoFunction,
                    context,
                    firstArgIndex;

                if (typeof arguments[0] === "string") {
                    label = arguments[0];
                    undoFunction = arguments[1];
                    context = arguments[2];
                    firstArgIndex = 3;
                } else {
                    undoFunction = arguments[0];
                    context = arguments[1];
                    firstArgIndex = 2;
                }

                if (label) {
                    entry.label = label;
                }
                entry.undoFunction = undoFunction;
                entry.context = context;
                entry.args = Array.prototype.slice.call(arguments, firstArgIndex);

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

            // Perform all promised operations, in order, that have been resolved
            // with an undoFunction
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

            var opResult = entry.undoFunction.apply(entry.context, entry.args);

            //TODO do we need to wait for the promise to resolve before moving to the next operation?
            // If the operation return a promise, end it to not hide exceptions
            if (Promise.isPromiseAlike(opResult)) {
                opResult.done();
            }

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
        value: function () {
            this._undoStack.splice(0, this._undoStack.length);
        }
    },

    /**
        Removes all items from the redo stack.
        @function
    */
    clearRedo: {
        value: function () {
            this._redoStack.splice(0, this._redoStack.length);
        }
    },

    /**
        Returns `true` if the UndoManager is in the middle of an undo operation, otherwise returns `false`.
    */
    isUndoing: {
        // TODO restore as computed property with dependency on undoEntry
        value: false
    },

    /**
        Returns `true` if the UndoManager is in the middle of an redo operation, otherwise returns `false`.
    */
    isRedoing: {
        // TODO restore as computed property with dependency on reoEntry
        value: false
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
        @returns {Promise} A promise resolving to true when this undo request has been performed
     */
    undo: {
        value: function () {

            if (0 === this.undoCount) {
                return Promise.resolve(null);
            }

            return this._scheduleOperation(this._undoStack.pop(), UNDO_OPERATION);
        }
    },

    /**
        Schedules the next redo operation for invocation as soon as possible
        @function
        @returns {Promise} A promise resolving to true when this redo request has been performed
    */
    redo: {
        value: function () {

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
        // TODO restore this as a readOnly getter with a dependency on the undoStack.length
        value: null
    },

    /**
        Returns true if the redo stack contains any items, otherwise returns false.
    */
    canRedo: {
        // TODO restore this as a readOnly getter with a dependency on the redoStack.length
        value: null
    },

    /**
        Contains the label describing the operation on top of the undo stack.
        End-users are strongly advised to prefix this with a localized "Undo" when
        presenting the label within an interface.
    */
    undoLabel: {
        // TODO restore this as a readOnly getter with a dependency on the undoStack.head.prev
        value: null
    },

    /**
     Contains the label describing the operation on top of the redo stack.
     End-users are strongly advised to prefix this with a localized "Redo" when
     presenting the label within an interface.
    */
    redoLabel: {
        // TODO restore this as a readOnly getter with a dependency on the redoStack.head.prev
        value: null
    }

});

var _defaultUndoManager = null;
Montage.defineProperty(exports, "defaultUndoManager", {
    get: function () {
        if (!_defaultUndoManager) {
            _defaultUndoManager = UndoManager.create();
        }
        return _defaultUndoManager;
    }
});
