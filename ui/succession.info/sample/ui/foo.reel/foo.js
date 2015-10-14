"use strict";

var Component = require("ui/component").Component;

exports.Foo = Component.specialize({
    title: {value: "Foo Component"},
    buildInCssClass: {value: "transition-build-in"},
    buildInTransitionCssClass: {value: "transition"},
    buildOutCssClass: {value: "transition-build-out"}
});
