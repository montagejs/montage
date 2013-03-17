
var Montage = require("core/core").Montage;

var Bindings = exports.Bindings = require("frb");

Montage.defineProperties(Montage, {

    defineBinding: {
        value: function (targetPath, descriptor, parameters) {
            return Bindings.defineBinding(this, targetPath, descriptor, parameters);
        }
    },

    defineBindings: {
        value: function (descriptors, parameters) {
            return Bindings.defineBindings(this, descriptors, parameters);
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

});

