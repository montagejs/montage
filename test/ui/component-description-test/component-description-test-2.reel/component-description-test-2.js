/* <copyright>
</copyright> */
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

var ComponentDescriptionTest2 = exports.ComponentDescriptionTest2 = Montage.create(Component, {

    templateDidLoad: {
        value: function() {
            console.log("Component Description Test 2 template did load");
        }
    },

    deserializedFromTemplate: {
        value: function() {
            console.log("Component Description Test 2 deserialized from template");
        }
    }

});

