/* <copyright>
</copyright> */
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

var  ComponentDescriptionTest = exports. ComponentDescriptionTest = Montage.create(Component, {

    init: {
        value: function() {
            return this;
        }
    },

    component1: {
        enumerable: false,
        value: null
    },

    component2: {
        enumerable: false,
        value: null
    },

    component3: {
        enumerable: false,
        value: null
    }


});
