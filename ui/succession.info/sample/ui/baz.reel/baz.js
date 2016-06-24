"use strict";

var Component = require("montage/ui/component").Component;

exports.Baz = Component.specialize({
    title: {value: "Baz Component"},

    buildInAnimation: {
        value: {
            fromCssClass: "buildInFrom",
            cssClass: "buildIn"
        }
    },

    buildOutAnimation: {
        value: {
            cssClass: "buildOut",
            toCssClass: "buildOutTo"
        }
    },

    width: {value: 0},
    height: {value: 0},

    willDraw: {
        value: function () {
            var computedStyle = window.getComputedStyle(this._element);
            this.width = parseFloat(computedStyle.getPropertyValue("width"));
            this.height = parseFloat(computedStyle.getPropertyValue("height"));
        }
    }

});
