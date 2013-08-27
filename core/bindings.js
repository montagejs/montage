
var Montage = require("core/core").Montage;

var Bindings = exports.Bindings = require("frb");

var bindingPropertyDescriptors = {

    defineBinding: {
        value: function (targetPath, descriptor, commonDescriptor) {
            return Bindings.defineBinding(this, targetPath, descriptor, commonDescriptor);
        }
    },

    defineBindings: {
        value: function (descriptors, commonDescriptor) {
            return Bindings.defineBindings(this, descriptors, commonDescriptor);
        }
    },

    cancelBinding: {
        value: function (targetPath) {
            return Bindings.cancelBinding(this, targetPath);
        }
    },

    cancelBindings: {
        value: function () {
            return Bindings.cancelBindings(this);
        }
    },

    getBinding: {
        value: function (targetPath) {
            return Bindings.getBinding(this, targetPath);
        }
    },

    getBindings: {
        value: function () {
            return Bindings.getBindings(this);
        }
    }

};
Montage.defineProperties(Montage, bindingPropertyDescriptors);
Montage.defineProperties(Montage.prototype, bindingPropertyDescriptors);
