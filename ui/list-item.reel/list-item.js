var Component = require("../component").Component;

/**
 * @class ListItem
 * @extends Component
 */
exports.ListItem = Component.specialize({

    constructor: {
        value: function () {
            this.defineBindings({
                "_label": {
                    "<-": "object.defined() && " +
                        "userInterfaceDescriptor.defined() ? " +
                        "object.path(userInterfaceDescriptor.nameExpression) : " +
                        "label"
                }
            });
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

    _object: {
        value: null
    },

    object: {
        get: function () {
            return this._object;
        },
        set: function(object) {
            if (this._object !== object) {
                this._object = object;

                if (object) {
                    this._getUserInterfaceDescriptor(object);
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

    _getUserInterfaceDescriptor: {
        value: function (object) {
            var self = this,
                promise;

            if (object && object.constructor.objectDescriptor) {
                this.canDrawGate.setField(this.constructor.CAN_DRAW_FIELD, false);

                return object.constructor.objectDescriptor.then(function (objectDescriptor) {
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
                self.label = self.callDelegateMethod(
                    "listItemWillUseLabelForObjectAtRowIndex",
                    self,
                    self._label,
                    self.object,
                    self.rowIndex,
                    self.list
                ) || self._label || self.label;
            });
        }
    }

}, {
    CAN_DRAW_FIELD: {
        value: 'userInterfaceDescriptorLoaded'
    }
});
