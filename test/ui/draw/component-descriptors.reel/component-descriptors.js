/**
    @module "ui/component-descriptors.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

/**
    Description TODO
    @class module:"ui/component-descriptors.reel".ComponentDescriptors
    @extends module:montage/ui/component.Component
*/
exports.ComponentDescriptors = Montage.create(Component, /** @lends module:"ui/component-descriptors.reel".ComponentDescriptors# */ {

    _text: { value: "hello" },
    text: Component.descriptors.setPropertyAndNeedsDraw("_text"),

    draw: {
        value: function() {
            this.textEl.textContent = this._text;
        }
    }

});
