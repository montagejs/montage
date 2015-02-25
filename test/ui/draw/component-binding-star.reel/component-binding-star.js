var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

exports.ComponentBindingStar = Component.specialize( {
    _bindTemplateParametersToArguments: {
        value: function () {
        }
    },

    _replaceElementWithTemplate: {
        value: function () {

        }
    }
});
