var Component = require("../component").Component,
    PressComposer = require("../../composer/press-composer").PressComposer,
    assign = require("frb/assign"),
    Montage = require("../../core/core").Montage;

/**
 * @class ListItem
 * @extends Component
 */
exports.ListItem = Component.specialize({

    _templateDidLoad: {
        value: false
    },

    templateDidLoad: {
        value: function () {
            this.defineBindings({
                "_iconSrc": {
                    "<-": "data.defined() && userInterfaceDescriptor.defined() ? " +
                        "(data.path(userInterfaceDescriptor.iconExpression || null) || " +
                        "path(userInterfaceDescriptor.iconExpression || null)) : iconSrc"
                },
                "_defaultIconComponenModule": {
                    "<-": "iconComponentModule || _montageIconComponentModule"
                },
                "_iconComponentModule": {
                    "<-": "data.defined() && userInterfaceDescriptor.defined() ? " +
                        "(userInterfaceDescriptor.iconComponentModule || " +
                        "_defaultIconComponenModule) : _defaultIconComponenModule"
                },
                "_label": {
                    "<-": "data.defined() && userInterfaceDescriptor.defined() ? " +
                        "(data.path(userInterfaceDescriptor.nameExpression) || " +
                        "label) : (label || data)"
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
                        "(userInterfaceDescriptor.listItemToggleComponentModule || " +
                        "_defaultToggleComponentModule) : _defaultToggleComponentModule"
                },
                "_descriptionPosition": {
                    "<-": "userInterfaceDescriptor.defined() ? " +
                        "(userInterfaceDescriptor.listItemDescriptionPosition || " +
                        "descriptionPosition) : descriptionPosition"
                },
                "_isExpandable": {
                    "<-": "userInterfaceDescriptor.defined() ? " +
                        "(userInterfaceDescriptor.listItemIsExpandable || " +
                        "isExpandable) : isExpandable"
                }
            }); 
            //FIXME: not safe!
            this._templateDidLoad = true;
            this._loadDataUserInterfaceDescriptorIfNeeded();
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

    _isExpandable: {
        value: false
    },

    isExpandable: {
        set: function (isExpandable) {
            this._isExpandable = !!isExpandable;
        },
        get: function () {
            return this._isExpandable;
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
                this._loadDataUserInterfaceDescriptorIfNeeded();
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

    _loadDataUserInterfaceDescriptorIfNeeded: {
        value: function () {
            if (this.data && this._templateDidLoad) {
                var self = this,
                    infoDelegate;
                
                return this.loadUserInterfaceDescriptor(this.data).then(function (UIDescriptor) {
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
                        infoDelegate = Montage.getInfoForObject(self.delegate);
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
                        self._defaultToggleComponentModule = {
                            require: infoDelegate.require || require,
                            id: candidateToggleComponentModuleId
                        };
                    }

                    self._descriptionPosition = self.callDelegateMethod(
                        "listItemWillUseDescriptionPositionForObjectAtRowIndex",
                        self,
                        self.descriptionPosition,
                        self.data,
                        self.rowIndex,
                        self.list
                    ) || self._descriptionPosition; // default value

                    self._isExpandable = self.callDelegateMethod(
                        "listItemShouldBeExpandableForObjectAtRowIndex",
                        self,
                        self._isExpandable,
                        self.data,
                        self.rowIndex,
                        self.list
                    ) || self._isExpandable; // default value
                });
            }  
        }
    }

});
