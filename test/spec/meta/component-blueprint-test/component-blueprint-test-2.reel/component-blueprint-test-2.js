/* <copyright>
</copyright> */
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

var ComponentBlueprintTest2 = exports.ComponentBlueprintTest2 = Component.specialize( {

    templateDidLoad: {
        value: function () {
            //console.log("Component Blueprint Test 2 template did load");
        }
    },

    deserializedFromTemplate: {
        value: function () {
            //console.log("Component Blueprint Test 2 deserialized from template");
        }
    }

});

