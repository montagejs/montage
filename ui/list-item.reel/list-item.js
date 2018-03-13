var Component = require("../component").Component,
    PressComposer = require("../../composer/press-composer").PressComposer,
    assign = require("frb/assign"),
    MontageModule = require("../../core/core"),
    Montage = MontageModule.Montage,
    getObjectDescriptorWithModuleId = MontageModule.getObjectDescriptorWithModuleId;

/**
 * @class ListItem
 * @extends Component
 */
exports.ListItem = Component.specialize({

    constructor: {
        value: function () {
            this.defineBindings({
                "_iconName": {
                    "<-": "data.defined() && userInterfaceDescriptor.defined() ? " +
                        "(userInterfaceDescriptor.iconName || " +
                        "iconName) : iconName"
                },
                "_iconSrc": {
                    "<-": "data.defined() && userInterfaceDescriptor.defined() ? " +
                        "(data.path(userInterfaceDescriptor.iconExpression || null) || " +
                        "path(userInterfaceDescriptor.iconExpression || null)) : iconSrc"
                },
                "_defaultIconComponenModule": {
                    "<-": "_iconName || _iconSrc || iconComponentModule ? " +
                        "(iconComponentModule || _montageIconComponentModule) : null"
                },
                "_iconComponentModule": {
                    "<-": "data.defined() && userInterfaceDescriptor.defined() ? " +
                        "(userInterfaceDescriptor.iconComponentModule || " +
                        "_defaultIconComponenModule) : _defaultIconComponenModule"
                },
                "_label": {
                    "<-": "data.defined() && userInterfaceDescriptor.defined() ? " +
                        "(data.path(userInterfaceDescriptor.nameExpression) || " +
                        "label) : label"
                },
                "_description": {
                    "<-": "data.defined() && userInterfaceDescriptor.defined() ? " +
                        "(data.path(userInterfaceDescriptor.descriptionExpression) || " +
                        "description) : description"
                },
                "__value": {
                    "<-": "data.defined() && userInterfaceDescriptor.defined() ? " +
                        "data.path(userInterfaceDescriptor.valueExpression) : _value"
                },
                "_defaultToggleComponentModule": {
                    "<-": "toggleComponentModule || _montageToogleComponentModule"
                },
                "_toggleComponentModule": {
                    "<-": "__value.defined() && userInterfaceDescriptor.defined() ? " +
                        "(userInterfaceDescriptor.toggleComponentModule || " +
                        "_defaultToggleComponentModule) : _defaultToggleComponentModule"
                }
            });
        }
    },

    _value: {
        value: null
    },

    value: {
        set: function (value) {
            this._value = !!value;
        }, 
        get: function () {
            return this._value;
        }
    },

    _isNavigationEnabled: {
        value: false
    },

    isNavigationEnabled: {
        set: function (isNavigationEnabled) {
            this._isNavigationEnabled = !!isNavigationEnabled;
        },
        get: function () {
            return this._isNavigationEnabled;
        }
    },

    _descriptionPosition: {
        value: null
    },

    descriptionPosition: {
        set: function (descriptionPosition) {
            this._descriptionPosition = descriptionPosition === 'bottom' ?
                descriptionPosition: 'right';
        },
        get: function () {
            return this._descriptionPosition;
        }
    },

    active: {
        value: false
    },

    selected: {
        value: false
    },

    label: {
        value: null
    },

    description: {
        value: null
    },

    iconComponentModule: {
        value: null
    },

    toggleComponentModule: {
        value: null
    },

    iconName: {
        value: null
    },

    iconSrc: {
        value: null
    },

    _data: {
        value: null
    },

    data: {
        get: function () {
            return this._data;
        },
        set: function(data) {
            if (this._data !== data) {
                this._data = data;

                if (data) {
                    this._getUserInterfaceDescriptor(data);
                }

                this.needsDraw = true;
            }
        }
    },

    rowIndex: {
        value: -1
    },

    list: {
        value: null
    },

    userInterfaceDescriptor: {
        value: null
    },

    __pressComposer: {
        value: null
    },

    _pressComposer: {
        get: function () {
            if (!this.__pressComposer) {
                this.__pressComposer = new PressComposer();
                this.__pressComposer.delegate = this;
                this.addComposerForElement(
                    this.__pressComposer, 
                    this._valuePlaceholderComponent.element
                );
            }

            return this.__pressComposer;
        }
    },

    shouldComposerSurrenderPointerToComponent: {
        value: function (pressComposer, pointer, component) {
            if (pressComposer === this.__pressComposer && 
                this.element.contains(component.element)
            ) {
                return false;
            }
            return true;
        }
    },

    enterDocument: {
        value: function () {
            this._startListeningToPressIfNeeded();
        }
    },

    prepareForActivationEvents: {
        value: function () {
            this._startListeningToPress();
        }
    },

    exitDocument: {
        value: function () {
            this._startListeningToPressIfNeeded();
        }
    },

    _startListeningToPressIfNeeded: {
        value: function () {
            if (this.preparedForActivationEvents) {
                this._startListeningToPress();
            }
        }
    },

    _startListeningToPress: {
        value: function () {
            this._pressComposer.addEventListener('press', this);
        }
    },

    _stopListeningToPress: {
        value: function () {
            if (this.preparedForActivationEvents) {
                this._pressComposer.removeEventListener('press', this);
            }
        }
    },

    handlePress: {
        value: function () {
            var checked = !this.__value;

            if (this.data &&
                this.userInterfaceDescriptor &&
                this.userInterfaceDescriptor.valueExpression
            ) {
                assign(
                    this.data,
                    this.userInterfaceDescriptor.valueExpression,
                    checked
                );
            }
            
            this.value = checked;
        }
    },

    _getUserInterfaceDescriptor: {
        value: function (data) {
            var self = this,
                objectDescriptorModuleIdCandidate,    
                objectDescriptorModuleId,
                objectDescriptor,
                infoDelegate,
                constructor,
                promise;

            this.canDrawGate.setField(this.constructor.CAN_DRAW_FIELD, false);

            if (typeof data === "object" &&
                (constructor = data.constructor) &&
                constructor.objectDescriptorModuleId
            ) {
                objectDescriptorModuleId = constructor.objectDescriptorModuleId;
            }

            objectDescriptorModuleIdCandidate = this.callDelegateMethod(
                "listItemWillUseObjectDescriptorModuleIdForObjectAtRowIndex",
                this,
                objectDescriptorModuleId,
                this.data,
                this.rowIndex,
                this.list
            ) || this._label;

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

                promise = objectDescriptor;
            } else {
                promise = Promise.resolve();
            }

            return promise.then(function (objectDescriptor) {
                var userInterfaceDescriptorModuleId = objectDescriptor &&
                    objectDescriptor.userInterfaceDescriptorModule ?
                    objectDescriptor.userInterfaceDescriptorModule.id : null;

                userInterfaceDescriptorModuleId = self.callDelegateMethod(
                    "listItemWillUseUserInterfaceDescriptorModuleIdForObjectAtRowIndex",
                    self,
                    userInterfaceDescriptorModuleId,
                    self.data,
                    self.rowIndex,
                    self.list
                ) || userInterfaceDescriptorModuleId;

                if (objectDescriptor && objectDescriptor.userInterfaceDescriptorModule &&
                    objectDescriptor.userInterfaceDescriptorModule.id === userInterfaceDescriptorModuleId
                ) {
                    return objectDescriptor.userInterfaceDescriptor;
                } else if (userInterfaceDescriptorModuleId) {
                    infoDelegate = infoDelegate || Montage.getInfoForObject(self.delegate);

                    return (infoDelegate.require || require).async(userInterfaceDescriptorModuleId)
                        .then(function (userInterfaceDescriptorModule) {
                            return userInterfaceDescriptorModule.montageObject;
                        });
                }
            }).then(function (UIDescriptor) {
                self.userInterfaceDescriptor = UIDescriptor || self.userInterfaceDescriptor; // trigger biddings.

                var iconComponentModuleId = self._iconComponentModule ?
                    self._iconComponentModule.id : null,
                    toggleComponentModuleId = self._toggleComponentModule ?
                        self._toggleComponentModule.id : null,    
                    candidateToggleComponentModuleId,    
                    candidateIconComponentModuleId;

                self._label = self.callDelegateMethod(
                    "listItemWillUseLabelForObjectAtRowIndex",
                    self,
                    self._label,
                    self.data,
                    self.rowIndex,
                    self.list
                ) || self._label; // defined by a bidding expression

                self._description = self.callDelegateMethod(
                    "listItemWillUseDescriptionForObjectAtRowIndex",
                    self,
                    self._description,
                    self.data,
                    self.rowIndex,
                    self.list
                ) || self._description; // defined by a bidding expression
                                
                candidateIconComponentModuleId = self.callDelegateMethod(
                    "listItemWillUseIconComponentModuleIdForObjectAtRowIndex",
                    self,
                    iconComponentModuleId,
                    self.data,
                    self.rowIndex,
                    self.list
                ) || iconComponentModuleId; // defined by a bidding expression
                
                if (candidateIconComponentModuleId &&
                    iconComponentModuleId !== candidateIconComponentModuleId && self.delegate
                ) {
                    infoDelegate = infoDelegate || Montage.getInfoForObject(self.delegate);
                    self._iconComponentModule = {
                        require: infoDelegate.require || require,
                        id: candidateIconComponentModuleId
                    };
                }

                if (self._iconComponentModule === self._montageIconComponentModule) {
                    self._iconSrc = self.callDelegateMethod(
                        "listItemWillUseIconSrcForObjectAtRowIndex",
                        self,
                        self._iconSrc,
                        self.data,
                        self.rowIndex,
                        self.list
                    ) || self._iconSrc; // defined by a bidding expression

                    self._iconName = self.callDelegateMethod(
                        "listItemWillUseIconNameForObjectAtRowIndex",
                        self,
                        self._iconName,
                        self.data,
                        self.rowIndex,
                        self.list
                    ) || self._iconName; // defined by a bidding expression
                }

                candidateToggleComponentModuleId = self.callDelegateMethod(
                    "listItemWillUseToggleComponentModuleIdForObjectAtRowIndex",
                    self,
                    toggleComponentModuleId,
                    self.data,
                    self.rowIndex,
                    self.list
                ) || toggleComponentModuleId; // defined by a bidding expression

                if (candidateToggleComponentModuleId &&
                    toggleComponentModuleId !== candidateToggleComponentModuleId && self.delegate
                ) {
                    infoDelegate = infoDelegate || Montage.getInfoForObject(self.delegate);
                    self._toggleComponentModule = {
                        require: infoDelegate.require || require,
                        id: candidateToggleComponentModuleId
                    };
                }
                
                self.descriptionPosition = self.callDelegateMethod(
                    "listItemWillUseDescriptionPositionForObjectAtRowIndex",
                    self,
                    self.descriptionPosition,
                    self.data,
                    self.rowIndex,
                    self.list
                ) || self.descriptionPosition; // default value

                self.isNavigationEnabled = self.callDelegateMethod(
                    "listItemShouldEnableNavigationForObjectAtRowIndex",
                    self,
                    self.isNavigationEnabled,
                    self.data,
                    self.rowIndex,
                    self.list
                ) || self.isNavigationEnabled; // default value

                self.canDrawGate.setField(self.constructor.CAN_DRAW_FIELD, true);
                self.needsDraw = true;
            });
        }
    }

}, {
    CAN_DRAW_FIELD: {
        value: 'userInterfaceDescriptorLoaded'
    }
});
