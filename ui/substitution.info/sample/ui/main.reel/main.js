var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

exports.Main = Component.specialize( {
    templateDidLoad: {
        value: function (documentPart) {
            this.templateObjects = documentPart.objects;
        }
    }
});

