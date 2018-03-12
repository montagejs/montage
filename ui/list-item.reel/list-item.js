var Component = require("../component").Component,
    PressComposer = require("../../composer/press-composer").PressComposer,
    assign = require("frb/assign"),
    Montage = require("../../core/core").Montage;

/**
 * @class ListItem
 * @extends Component
 */
exports.ListItem = Component.specialize({

    constructor: {
        value: function () {
            this.defineBindings({
                "_iconName": {
                    "<-": "data.defined() && " +
                        "userInterfaceDescriptor.defined() ? " +
                        "(userInterfaceDescriptor.iconName || " +
                        "iconName) : iconName"
                },
                "_iconSrc": {
                    "<-": "data.defined() && " +
                        "userInterfaceDescriptor.defined() ? " +
                        "(data.path(userInterfaceDescriptor.iconExpression || null) || " +
                        "path(userInterfaceDescriptor.iconExpression || null)) : iconSrc"
                },
                "_defaultIconModule": {
                    "<-": "_iconName || _iconSrc || iconComponentModule ? (iconComponentModule || _montageIconComponentModule) : null"
                },
                "_iconModule": {
                    "<-": "data.defined() && " +
                        "userInterfaceDescriptor.defined() ? " +
                        "(userInterfaceDescriptor.iconComponentModule || " +
                        "_defaultIconModule) : _defaultIconModule"
                },
                "_label": {
                    "<-": "data.defined() && " +
                        "userInterfaceDescriptor.defined() ? " +
                        "(data.path(userInterfaceDescriptor.nameExpression) || " +
                        "label) : label"
                },
                "_description": {
                    "<-": "data.defined() && " +
                        "userInterfaceDescriptor.defined() ? " +
                        "(data.path(userInterfaceDescriptor.descriptionExpression) || " +
                        "description) : description"
                },
                "__value": {
                    "<-": "data.defined() && userInterfaceDescriptor.defined() && !isNavigationEnabled ? " +
                        "data.path(userInterfaceDescriptor.valueExpression) : _value"
                },
                "_defaultToggleComponentModule": {
                    "<-": "toggleComponentModule || _montageToogleComponentModule"
                },
                "_valueComponentModule": {
                    "<-": "__value.defined() && userInterfaceDescriptor.defined() ? " +
                        "(userInterfaceDescriptor.valueComponentModule || _defaultToggleComponentModule) : _defaultToggleComponentModule"
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
                promise;

            if (data && data.constructor.objectDescriptor) {
                this.canDrawGate.setField(this.constructor.CAN_DRAW_FIELD, false);

                return data.constructor.objectDescriptor.then(function (objectDescriptor) {
                    if (objectDescriptor) {
                        objectDescriptor.userInterfaceDescriptor.then(function (userInterfaceDescriptor) {
                            self.canDrawGate.setField(self.constructor.CAN_DRAW_FIELD, true);
                            self.needsDraw = true;
                            return (self.userInterfaceDescriptor = userInterfaceDescriptor);
                        });
                    }
                });
            } else {
                promise = Promise.resolve();
            }

            return promise.then(function () {
                var moduleId = self._iconModule ? self._iconModule.id : null,
                    candidateModuleId;

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
                                
                candidateModuleId = self.callDelegateMethod(
                    "listItemWillUseIconModuleIdForObjectAtRowIndex",
                    self,
                    moduleId,
                    self.data,
                    self.rowIndex,
                    self.list
                ) || moduleId; // defined by a bidding expression
                
                if (candidateModuleId && moduleId !== candidateModuleId && self.delegate) {
                    self._iconModule = {
                        require: Montage.getInfoForObject(self.delegate).require,
                        id: candidateModuleId
                    };
                }

                if (self._iconModule === self._montageIconComponentModule) {
                    self._iconSrc = candidateModuleId = self.callDelegateMethod(
                        "listItemWillUseIconSrcForObjectAtRowIndex",
                        self,
                        self._iconSrc,
                        self.data,
                        self.rowIndex,
                        self.list
                    ) || self._iconSrc; // defined by a bidding expression

                    self._iconName = candidateModuleId = self.callDelegateMethod(
                        "listItemWillUseIconNameForObjectAtRowIndex",
                        self,
                        self._iconName,
                        self.data,
                        self.rowIndex,
                        self.list
                    ) || self._iconName; // defined by a bidding expression
                }              
            });
        }
    }

}, {
    CAN_DRAW_FIELD: {
        value: 'userInterfaceDescriptorLoaded'
    }
});
