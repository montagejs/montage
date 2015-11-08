"use strict";

var Component = require("ui/component").Component;

exports.Foo = Component.specialize({

    title: {value: "Foo Component"},

    buildInAnimation: {
        value: {
            fromCssClass: "fooBuildInFrom",
            cssClass: "fooBuildIn"
        }
    },

    buildOutAnimation: {
        value: {
            cssClass: "fooBuildOut",
            toCssClass: "fooBuildOutTo"
        }
    }

});
