/* <copyright>
</copyright> */
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

var  ComponentBlueprintTest = exports. ComponentBlueprintTest = Component.specialize( {

    init: {
        value: function () {
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
    },

    button: {
        enumerable: false,
        value: null
    },

    inputrange: {
        enumerable: false,
        value: null
    },

    toggle: {
        enumerable: false,
        value: null
    },

    checkbox: {
        enumerable: false,
        value: null
    },

    inputtext: {
        enumerable: false,
        value: null
    },

    dynamictext: {
        enumerable: false,
        value: null
    }

});
