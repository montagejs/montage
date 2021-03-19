var Montage = require("montage/core/core").Montage;

exports.TestController = Montage.specialize( {
    templateObjects: {
        value: null
    },

    constructor:{
        value:function () {
            window.test = this;
        }
    },

    deserializedFromTemplate: {
        value: function(owner, label, part) {
            this.templateObjects = part.objects;
        }
    }
});
