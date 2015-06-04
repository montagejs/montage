"use strict";

var Component = require("ui/component").Component;

exports.Bar = Component.specialize({
    title: {value: "Bar Component"},
    buildInCssClass: {value: "transition-build-in"},
    buildInTransitionCssClass: {value: "transition"},
    buildOutCssClass: {value: "transition-build-out"}
});
