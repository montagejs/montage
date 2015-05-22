/**
    @module "montage/ui/native/checkbox.reel"
    @requires montage/core/core
    @requires montage/ui/check-control
*/
var CheckControl = require("ui/check-control").CheckControl;

/**

    @class module:"montage/ui/native/checkbox.reel".Checkbox
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
    }
});