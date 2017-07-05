/**
    @module "montage/ui/checkbox.reel"
    @requires montage/core/core
    @requires montage/ui/check-control
*/
var CheckControl = require("ui/check-control").CheckControl;

// var CLASS_PREFIX = "montage-Checkbox";

/**

    @class module:"montage/ui/checkbox.reel".Checkbox
    @extends module:montage/ui/check-control.CheckControl
*/
var Checkbox = exports.Checkbox = CheckControl.specialize({
    enterDocument: {
        value: function (firstTime) {
            this.super(firstTime);
            if (firstTime) {
                this.element.setAttribute("role", "checkbox");
            }
        }
    },

    hasTemplate: {
        value: false
    }
});