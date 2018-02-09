var Component = require("../component").Component,
    MontageModule = require("../../core/core"),
    Promise = require('../../core/promise').Promise,
    Montage = MontageModule.Montage,
    objectDescriptorDescriptor = MontageModule._objectDescriptorDescriptor;

// Needs to provide an Api on Montage 
var DummyObject = Montage.specialize(null, {
    objectDescriptor: objectDescriptorDescriptor
});

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

    __dummyObject: {
        value: null
    },

    _dummyObject: {
        get: function () {
            if (!this.__dummyObject) {
                this.__dummyObject = new DummyObject();
            }

            return this.__dummyObject;
        }
    },

    _populateColumnWithObjectAndIndex: {
        value: function (object, columnIndex) {
            if (!this._populatePromise && object) {
                var self = this,
                    objectDescriptorModuleId,
                    objectDescriptorModuleIdCandidate,
                    objectDescriptor,
                    constructor;

                if (typeof object === "object" &&
                    (constructor = object.constructor) &&
                    constructor.objectDescriptorModuleId
                ) {
                    objectDescriptorModuleId = constructor.objectDescriptorModuleId
                }

                objectDescriptorModuleIdCandidate = this.callDelegateMethod(
                    "cascadingListWillUseObjectDescriptorModuleIdForObjectAtColumnIndex",
                    self,
                    objectDescriptorModuleId,
                    object,
                    columnIndex
                );

                if (objectDescriptorModuleIdCandidate) {
                    var infoDelegate = Montage.getInfoForObject(this.delegate),
                        infoDummyObjectConstructor = Montage.getInfoForObject(this._dummyObject.constructor);
                    
                    infoDummyObjectConstructor.require = infoDelegate.require; // not safe
                    objectDescriptorModuleId = objectDescriptorModuleIdCandidate;
                }

                if (objectDescriptorModuleId) {
                    if (!constructor || !constructor.objectDescriptorModuleId ||
                        constructor.objectDescriptorModuleId !== objectDescriptorModuleId
                    ) {
                        constructor = this._dummyObject.constructor;
                        constructor.objectDescriptorModuleId = objectDescriptorModuleId;
                    }
                    
                    objectDescriptor = constructor.objectDescriptor;

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

                                return objectDescriptor.userInterfaceDescriptor
                                    .then(function (UIDescriptor) {
                                        var context = self._createCascadingListContextWithObjectAndColumnIndex(object, columnIndex);
                                        context.userInterfaceDescriptor = UIDescriptor;

                                        self._push(context);
                                        self._populatePromise = null;
                                        self._dummyObject.constructor.objectDescriptorModuleId = null;
                                        self._dummyObject.constructor.objectDescriptor = null;

                                        if (infoDummyObjectConstructor) {
                                            infoDummyObjectConstructor.require = null;
                                        }

                                        return context;
                                    });
                            });
                    }
                } else {
                    //todo ask manually ?
                }
            }

            return this._populatePromise || Promise.resolve();
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
