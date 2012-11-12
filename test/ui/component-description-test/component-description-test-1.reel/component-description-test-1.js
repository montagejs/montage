/* <copyright>
</copyright> */
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

var ComponentDescriptionTest1 = exports.ComponentDescriptionTest1 = Montage.create(Component, {

    templateDidLoad: {
        value: function() {
            console.log("Component Description Test 1 template did load");
        }
    },

    deserializedFromTemplate: {
        value: function() {
            console.log("Component Description Test 1 deserialized from template");
        }
    }

});

