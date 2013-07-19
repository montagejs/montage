var Binder = require("core/meta/binder").Binder;

exports.ModuleBinder = Binder.specialize({

    constructor: {
        value: function ModuleBinder() {
            return this.super();
        }
    },

    serializeSelf: {
        value: function(serializer) {
            if (!this.binderInstanceModuleId) {
                throw new Error("Cannot serialize binder without a module id");
            }
            return this.super(serializer);
        }
    }

});
