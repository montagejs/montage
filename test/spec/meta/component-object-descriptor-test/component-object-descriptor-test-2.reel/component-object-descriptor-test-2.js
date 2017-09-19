/* <copyright>
</copyright> */
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

var ComponentObjectDescriptorTest2 = exports.ComponentObjectDescriptorTest2 = Component.specialize( {

    templateDidLoad: {
        value: function () {
            //console.log("Component ObjectDescriptor Test 2 template did load");
        }
    },

    deserializedFromTemplate: {
        value: function () {
            //console.log("Component ObjectDescriptor Test 2 deserialized from template");
        }
    }

});

