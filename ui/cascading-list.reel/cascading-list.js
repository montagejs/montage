var Component = require("montage/ui/component").Component,
    CascadingListItem = require("ui/controls/cascading-list.reel/cascading-list-item.reel").CascadingListItem;


exports.CascadingList = Component.specialize({

    constructor: {
        value: function () {
            this._stack = [];
        }
    },

    _stack: {
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
                this.popAll(true);

                if (this._selectionService) {
                    this._restoreSelection();
                }
            }
        }
    },

    templateDidLoad: {
        value: function () {
            this._selectionService = this.application.selectionService;
        }
    },

    enterDocument: {
        value: function () {
            this._restoreSelection();
            this.addPathChangeListener("_selectionService.needsRefresh", this, "_handleNeedsRefreshChange");
        }
    },

    exitDocument: {
        value: function () {
            if (this.getPathChangeDescriptor("_selectionService.needsRefresh", this)) {
                this.removePathChangeListener("_selectionService.needsRefresh", this);
            }
            this._resetCascadingListItemAtIndex(0);

            if (this._currentIndex > 0) {
                this.popAtIndex(1, true);
            }
        }
    },

    pop: {
        value: function () {
            this._pop();
            this.needsDraw = true;
        }
    },

    popAll: {
        value: function (isSelectionSaved) {
            while (this._stack.length) {
                this._pop(isSelectionSaved);
            }
        }
    },

    popAtIndex: {
        value: function (index, isSelectionSaved) {
            if (index <= this._currentIndex && this._currentIndex !== -1) {
                this._pop(isSelectionSaved);

                // the value of the property _currentIndex changed when _pop() has been called.
                if (index <= this._currentIndex) {
                    this.popAtIndex(index);
                }
            }
        }
    },

    expand: {
        value: function (object, columnIndex) {
            columnIndex = columnIndex || 0;

            if (columnIndex) {
                for (var i = this._stack.length - columnIndex; i > 0; i--) {
                    this._pop();
                }
            } else {
                this.popAll();
            }

            this._currentIndex = columnIndex;
            return this._populateColumnWithObjectAndIndex(object, columnIndex);
        }
    },

    cascadingListItemAtIndex: {
        value: function (index) {
            if (index <= this._currentIndex) {
                return this.repetition.childComponents[index];
            }

            return null;
        }
    },

    _handleNeedsRefreshChange: {
        value: function () {
            if (this._selectionService.needsRefresh) {
                this._restoreSelection();
                this._selectionService.needsRefresh = false;
            }
        }
    },

    _restoreSelection: {
        value: function () {
            if (this._root) {
                var self = this;
                this._selection = this._selectionService.getSelection(this.application.section);
                var rootPromise = this._stack.length === 0 && this._populatePromise ? this._populatePromise : this.expand(this._root);
                return rootPromise.then(function () {
                    if (self._selection && self._selection.length > 0) {
                        return Promise.mapSeries(self._selection, function (selectedObject) {
                            return self.expand(selectedObject, self._selection.indexOf(selectedObject) + 1).then(function (context) {
                                self.cascadingListItemAtIndex(context.columnIndex - 1).selectedObject = context.object;
                            });
                        });
                    } else {
                        return Promise.resolve();
                    }
                });
            }
        }
    },

    _push: {
        value: function (context) {
            this._stack.push(context);
            this._selectionService.saveSelection(this.application.section, this._stack);
            this.needsDraw = true;
        }
    },

    _pop: {
        value: function (isSelectionSaved) {
            this._resetCascadingListItemAtIndex(this._currentIndex);
            this._stack.pop();
            if (!isSelectionSaved) {
                this._selectionService.saveSelection(this.application.section, this._stack);
            }
            this._currentIndex--;
        }
    },

    _resetCascadingListItemAtIndex: {
        value: function (index) {
            var cascadingListItem = this.cascadingListItemAtIndex(index);

            if (cascadingListItem) {
                cascadingListItem.resetSelection();
            }
        }
    },

    _populateColumnWithObjectAndIndex: {
        value: function (object, columnIndex) {
            var self = this;
            var currentStackLength = self._stack.length;

            if (this._populatePromise) {
                return this._populatePromise.then(function () {
                    return (self._populatePromise = self.application.delegate.userInterfaceDescriptorForObject(object).then(function (userInterfaceDescriptor) {
                        columnIndex = Math.min(currentStackLength, columnIndex);
                        var context = {
                            object: object,
                            userInterfaceDescriptor: userInterfaceDescriptor,
                            columnIndex: columnIndex
                        };
                        if (currentStackLength > 0) {
                            context.parentContext = self._stack[currentStackLength - 1];
                        }
                        self._push(context);
                        self._populatePromise = null;
                        return context;
                    }));
                });
            } else {
                return (self._populatePromise = self.application.delegate.userInterfaceDescriptorForObject(object).then(function (userInterfaceDescriptor) {
                    columnIndex = Math.min(currentStackLength, columnIndex);
                    var context = {
                        object: object,
                        userInterfaceDescriptor: userInterfaceDescriptor,
                        columnIndex: columnIndex
                    };
                    if (currentStackLength > 0) {
                        context.parentContext = self._stack[currentStackLength - 1];
                    }
                    self._push(context);
                    self._populatePromise = null;
                    return context;
                }));
            }
        }
    }

}, {
        findCascadingListItemContextWithComponent: {
            value: function (component) {
                var parentComponent = component.parentComponent;

                if (parentComponent) {
                    if (parentComponent instanceof CascadingListItem) {
                        return parentComponent;
                    }

                    return this.findCascadingListItemContextWithComponent(parentComponent);
                }

                return null;
            }
        },

        findPreviousCascadingListItemContextWithComponent: {
            value: function (component) {
                var cascadingListItem = this.findCascadingListItemContextWithComponent(component),
                    previousCascadingListItem = null;

                if (cascadingListItem && cascadingListItem.data.columnIndex > 0) {
                    previousCascadingListItem = cascadingListItem.cascadingList.cascadingListItemAtIndex(cascadingListItem.data.columnIndex - 1);
                }

                return previousCascadingListItem;
            }
        },

        findPreviousContextWithComponent: {
            value: function (component) {
                var previousCascadingListItem = this.findPreviousCascadingListItemContextWithComponent(component);

                return previousCascadingListItem ? previousCascadingListItem.data : null;
            }
        }
    });