/* <copyright>
</copyright> */
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

var ComponentBlueprintTest1 = exports.ComponentBlueprintTest1 = Component.specialize( {

    templateDidLoad: {
        value: function () {
            //console.log("Component Blueprint Test 1 template did load");
        }
    },

    deserializedFromTemplate: {
        value: function () {
            //console.log("Component Blueprint Test 1 deserialized from template");
        }
    }

});

