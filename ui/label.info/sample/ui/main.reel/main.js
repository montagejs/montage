var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

exports.Main = Component.specialize(/** @lends Main# */ {
    constructor: {
        value: function Main() {
            this.super();
        }
    },

    label: {
        value: null
    },

    text: {
        value: null
    }

});
