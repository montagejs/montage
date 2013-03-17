var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;


var DelegateMethods = Montage.create(Component, {
    deserializedFromTemplateCount: {value: 0},

    deserializedFromTemplate: {
        value: function() {
            this.deserializedFromTemplateCount++;
        }
    },

    templateDidLoadCount: {value: 0},

    templateDidLoad: {
        value: function() {
            this.templateDidLoadCount++;
        }
    }
});

exports.DelegateMethods = DelegateMethods;