var Component = require("../component").Component,
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
                        "path(userInterfaceDescriptor.iconExpression || null)) : null"
                },
                "_defaultIconModule": {
                    "<-": "_iconName || _iconSrc || iconModule ? (iconModule || _montageIconComponentModule) : null"
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
                "_valueComponentModule": {
                    "<-": "__value.defined() && userInterfaceDescriptor.defined() ? " +
                        "(userInterfaceDescriptor.valueComponentModule || _montageToogleComponentModule) : _montageToogleComponentModule"
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

    isNavigationEnabled: {
        value: false
    },

    label: {
        value: null
    },

    description: {
        value: null
    },

    iconModule: {
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

    handleAction: {
        value: function (event) {
            var checked = event.detail;

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
