/* <copyright>
</copyright> */
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

var ComponentBlueprintTest3 = exports.ComponentBlueprintTest3 = Component.specialize( {

    templateDidLoad: {
        value: function () {
            //console.log("Component Blueprint Test 3 template did load");
        }
    },

    deserializedFromTemplate: {
        value: function () {
            //console.log("Component Blueprint Test 3 deserialized from template");
        }
    },

    bindableProperty1: {
        value: null
    },

    bindableProperty2: {
        value: null
    },

    bindableProperty3: {
        value: null
    },

    bindableProperty4: {
        value: null
    },

    bindableProperty5: {
        value: null
    },

    requiredBindableProperty1: {
        value: null
    },

    requiredBindableProperty2: {
        value: null
    },

    requiredBindableProperty3: {
        value: null
    }

});

