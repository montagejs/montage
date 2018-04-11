var Component = require("montage/ui/component").Component;    

exports.HelloWorld = Component.specialize(/** @lends HelloWorld# */{

    // Super Class Data Controller?

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
                    var self = this;
                    
                    this.loadUserInterfaceDescriptor(data).then(function (userInterfaceDescriptor) {
                        return (self.userInterfaceDescriptor = userInterfaceDescriptor);
                    });
                }
            }
        }
    },

    userInterfaceDescriptor: {
        value: null
    }

});
