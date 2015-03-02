"use strict";

var Component = require("ui/component").Component;

exports.Main = Component.specialize({
    componentList: {value: [
        "Select a .info to render",
        "--------------------",
        // add component class names below, UpperCamelCase
        // e.g.: "SegmentedBar"
        "SegmentedBar"
    ]}
});
