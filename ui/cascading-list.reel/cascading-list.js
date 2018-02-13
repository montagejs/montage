var Component = require("../component").Component,
    MontageModule = require("../../core/core"),
    Promise = require('../../core/promise').Promise,
    Montage = MontageModule.Montage,
    getObjectDescriptorWithModuleId = MontageModule.getObjectDescriptorWithModuleId;

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

    selectedObject: {
        value: null
    },

    delegate: {
        value: null
    }

});

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

                if (root) {
                    this.expand(root);
                }
            }
        }
    },

    exitDocument: {
        value: function () {
            this.popAll();
        }
    },

    push: {
        value: function (object) {
            this.expand(object, this._currentIndex + 1);
        }
    },

    pop: {
        value: function () {
            this._pop();
            this.needsDraw = true;
        }
    },

    popAll: {
        value: function () {
            while (this._stack.length) {
                this._pop();
            }
        }
    },

    popAtIndex: {
        value: function (index) {
            if (index <= this._currentIndex && this._currentIndex !== -1) {
                this._pop();

                // the value of the property _currentIndex 
                // changed when _pop() has been called.
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

    _push: {
        value: function (context) {
            this._stack.push(context);
            this.needsDraw = true;
        }
    },

    _pop: {
        value: function () {
            this._stack.pop();
            this._currentIndex--;
        }
    },

    _populateColumnWithObjectAndIndex: {
        value: function (object, columnIndex) {
            if (!this._populatePromise && object) {
                var self = this,
                    objectDescriptorModuleId,
                    objectDescriptorModuleIdCandidate,
                    objectDescriptor,
                    infoDelegate,
                    constructor;

                if (typeof object === "object" &&
                    (constructor = object.constructor) &&
                    constructor.objectDescriptorModuleId
                ) {
                    objectDescriptorModuleId = constructor.objectDescriptorModuleId;
                }

                objectDescriptorModuleIdCandidate = this.callDelegateMethod(
                    "cascadingListWillUseObjectDescriptorModuleIdForObjectAtColumnIndex",
                    this,
                    objectDescriptorModuleId,
                    object,
                    columnIndex
                );

                if (objectDescriptorModuleIdCandidate) {
                    infoDelegate = Montage.getInfoForObject(this.delegate);
                    objectDescriptorModuleId = objectDescriptorModuleIdCandidate;
                }

                if (objectDescriptorModuleId) {
                    if (objectDescriptorModuleIdCandidate) {
                        objectDescriptor = getObjectDescriptorWithModuleId(
                            objectDescriptorModuleId,
                            infoDelegate ? infoDelegate.require : require
                        );
                    } else {
                        objectDescriptor = constructor.objectDescriptor;
                    }

                    if (objectDescriptor) {
                        this._populatePromise = objectDescriptor
                            .then(function (objectDescriptor) {
                                objectDescriptor = self.callDelegateMethod(
                                    "cascadingListWillUseObjectDescriptorForObjectAtColumnIndex",
                                    self,
                                    objectDescriptor,
                                    object,
                                    columnIndex
                                ) || objectDescriptor;

                                return objectDescriptor.userInterfaceDescriptor;
                            });
                    }
                }
                else {
                    var userInterfaceDescriptorModuleId = self.callDelegateMethod(
                        "cascadingListNeedsUserInterfaceDescriptorForObjectAtColumnIndex",
                        this,
                        object,
                        columnIndex
                    ) || objectDescriptor;

                    if (userInterfaceDescriptorModuleId) {
                        infoDelegate = infoDelegate || Montage.getInfoForObject(this.delegate);

                        this._populatePromise = (infoDelegate.require || require).async(userInterfaceDescriptorModuleId)
                            .then(function (userInterfaceDescriptorModule) {
                                return userInterfaceDescriptorModule.montageObject;
                            });
                    } else { // leave a chance to the deeper components to handle it 
                        this._populatePromise = Promise.resolve();
                    }
                }
            }

            return this._populatePromise.then(function (UIDescriptor) {
                var context = self._createCascadingListContextWithObjectAndColumnIndex(
                    object,
                    columnIndex
                );

                context.userInterfaceDescriptor = UIDescriptor;
                
                self._push(context);
                self._populatePromise = null;

                return context;
            });
        }
    },

    _createCascadingListContextWithObjectAndColumnIndex: {
        value: function (object, columnIndex) {
            var context = new CascadingListContext();

            context.object = object;
            context.columnIndex = columnIndex;
            context.cascadingList = this;
            context.delegate = this.delegate;

            return context;
        }
    }

});
