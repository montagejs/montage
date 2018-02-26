var Component = require("montage/ui/component").Component;    

exports.HelloWorld = Component.specialize(/** @lends HelloWorld# */{

    _data: {
        value: null
    },

    data: {
        get: function () {
            return this._data;
        },
        set: function (data) {
            if (this._data !== data) {
                this._data = data;

                if (data) {
                    this._getUserInterfaceDescriptor(data);
                }
            }
        }
    },

    userInterfaceDescriptor: {
        value: null
    },

    _getUserInterfaceDescriptor: {
        value: function (data) {
            if (data && data.constructor.objectDescriptor) {
                var self = this;

                this.canDrawGate.setField(this.constructor.CAN_DRAW_FIELD, false);

                return data.constructor.objectDescriptor.then(function (objectDescriptor) {
                    self.canDrawGate.setField(self.constructor.CAN_DRAW_FIELD, true);

                    if (objectDescriptor) {
                        objectDescriptor.userInterfaceDescriptor.then(function (userInterfaceDescriptor) {
                            return (self.userInterfaceDescriptor = userInterfaceDescriptor);
                        });
                    }
                });
            }

            return Promise.resolve();
        }
    }

});
