exports = typeof exports !== "undefined" ? exports : {};

var Montage = require("montage").Montage;
var Component = require("montage/ui/component").Component;

exports.TemplateObjects = Component.specialize( {
    templateObjectsPresent: {value: false},

    templateDidLoad: {
        value: function () {
            this.templateObjectsPresent = !!this.templateObjects;
        }
    }
});

