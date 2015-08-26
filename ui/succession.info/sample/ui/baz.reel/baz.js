"use strict";

var Component = require("ui/component").Component;

exports.Baz = Component.specialize({
    title: {value: "Baz Component"},

    // transition
    buildInCssClass: {value: "transition-build-in"},
    buildInTransitionCssClass: {value: "transition"},
    buildOutCssClass: {value: "transition-build-out"},
    // animation
    //buildInCssClass: {value: "zoomInDown"},
    //buildInTransitionCssClass: {value: null},
    //buildOutCssClass: {value: "zoomOutDown"},

    width: {value: 0},
    height: {value: 0},

    willDraw: {
        value: function () {
            //console.log("willDraw");
            var computedStyle = window.getComputedStyle(this._element);
            this.width = parseFloat(computedStyle.getPropertyValue("width"));
            this.height = parseFloat(computedStyle.getPropertyValue("height"));
        }
    },
    //draw: {
    //    value: function () {
    //        console.log("draw");
    //    }
    //},
    //enterDocument: {
    //    value: function (firstTime) {
    //        console.log("enterDocument");
    //    }
    //},
    //exitDocument: {
    //    value: function () {
    //        console.log("exitDocument");
    //    }
    //}
});
