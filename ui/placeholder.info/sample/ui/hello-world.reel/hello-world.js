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
                    this.loadUserInterfaceDescriptor(data);
                }
            }
        }
    },

    userInterfaceDescriptor: {
        value: null
    },

    didLoadUserInterfaceDescriptor: {
        value: function (promise) {
            var self = this;
            return promise.then(function (userInterfaceDescriptor) {
                return (self.userInterfaceDescriptor = userInterfaceDescriptor);
            });
        }
    }

});
