var Component = require("../component").Component,
    Montage = require("../../core/core").Montage,
    Promise = require('../../core/promise').Promise;

var CascadingListContext = exports.CascadingListContext = Montage.specialize({

    object: {
        value: null
    },

    userInterfaceDescriptor: {
        value: null
    },

    columnIndex: {
        value: null
    },

    cascadingList: {
        value: null
    },

    cascadingListItem: {
        value: null
    },

    isEditing: {
        value: false
    }

});

exports.CascadingList = Component.specialize({

    constructor: {
        value: function () {
            this.history = [];
        }
    },

    _currentColumnIndex: {
        value: 0
    },

    history: {
        value: null
    },

    _root: {
        value: null
    },

    root: {
        get: function () {
            return this._root;
        },
        set: function (root) {
            if (this._root !== root) {
                this._root = root;

                if (root) {
                    this.expand(root);
                }
            }
        }
    },

    shouldDispatchCascadingListEvents: {
        value: false
    },

    exitDocument: {
        value: function () {
            this.popAll();
        }
    },
    
    _delegate: {
        value: null
    },

    delegate: {
        set: function (delegate) {
            this._delegate = delegate;

            if (delegate) {
                if (delegate.shouldListEnableSelection === void 0) {
                    delegate.shouldListEnableSelection =
                        this.shouldListEnableSelection.bind(delegate);
                }

                if (delegate.shouldListBeExpandable === void 0) {
                    delegate.shouldListBeExpandable =
                        this.shouldListBeExpandable.bind(delegate);
                }

                if (delegate.shouldListAllowMultipleSelectionn === void 0) {
                    delegate.shouldListAllowMultipleSelectionn =
                        this.shouldListAllowMultipleSelectionn.bind(delegate);
                }
            }
        },
        get: function () {
            return this._delegate || this;
        }
    },

    shouldListEnableSelection: {
        value: function () {
            return true;
        }
    },

    shouldListBeExpandable: {
        value: function () {
            return true;
        }
    },

    shouldListAllowMultipleSelectionn: {
        value: function () {
            return false;
        }
    },

    push: {
        value: function (object) {
            this.expand(object, this._currentColumnIndex + 1);
        }
    },

    pop: {
        value: function () {
            this._pop();
        }
    },

    popAll: {
        value: function () {
            while (this.history.length) {
                this._pop();
            }
        }
    },

    popAtIndex: {
        value: function (index) {
            if (index <= this._currentColumnIndex && this._currentColumnIndex !== -1) {
                this._pop();

                // the value of the property _currentColumnIndex 
                // changed when _pop() has been called.
                if (index <= this._currentColumnIndex) {
                    this.popAtIndex(index);
                }
            }
        }
    },

    expand: {
        value: function (object, columnIndex, isEditing) {
            columnIndex = columnIndex || this._currentColumnIndex;

            if (columnIndex) {
                if (columnIndex > 0) {
                    var parentCascadingListItem = this.cascadingListItemAtIndex(columnIndex - 1);

                    if (parentCascadingListItem) {
                        parentCascadingListItem.selectObject(object);
                    }
                }

                for (var i = this.history.length - columnIndex; i > 0; i--) {
                    this._pop();
                }
            } else {
                this.popAll();
            }

            this._currentColumnIndex = columnIndex;

            return this._populateColumnWithObjectAndIndex(
                object, columnIndex, isEditing
            );
        }
    },

    cascadingListItemAtIndex: {
        value: function (index) {
            if (this.history[index]) {
                return this.history[index].cascadingListItem;
            }
        }
    },

    findIndexForObject: {
        value: function (object) {
            for (var i = this.history.length - 1; i > -1; i--) {
                if (this.history[i] === object) {
                    return i;
                }
            }

            return -1;
        }
    },

    _push: {
        value: function (context) {
            this.history.splice(context.columnIndex, 1, context);
            this.needsDraw = true;

            if (this.shouldDispatchCascadingListEvents) {
                this.dispatchEventNamed('cascadingListPush', true, true, context);
            }
        }
    },

    _pop: {
        value: function () {
            var cascadingListItem,
                context = this.history.pop();
            
            this._currentColumnIndex--;
            context.isEditing = false;
            this.needsDraw = true;

            if (this.shouldDispatchCascadingListEvents) {
                this.dispatchEventNamed('cascadingListPop', true, true, context);
            }

            return context;
        }
    },

    _populateColumnWithObjectAndIndex: {
        value: function (object, columnIndex, isEditing) {
            if (!this._populatePromise && object) {
                var self = this;
                
                this._populatePromise = this.loadUserInterfaceDescriptor(object).then(function (UIDescriptor) {
                    var context = self._createCascadingListContextWithObjectAndColumnIndex(
                        object,
                        columnIndex
                    );

                    context.userInterfaceDescriptor = UIDescriptor;
                    context.isEditing = !!isEditing;

                    self._push(context);
                    self._populatePromise = null;

                    return context;
                });
            }

            return this._populatePromise;
        }
    },

    _createCascadingListContextWithObjectAndColumnIndex: {
        value: function (object, columnIndex) {
            var context = new CascadingListContext();

            context.object = object;
            context.columnIndex = columnIndex;
            context.cascadingList = this;

            return context;
        }
    }

});
