{{#copyright}}/* {{{copyright}}} */

{{/copyright}}/**
    @module "{{jsdocModule}}ui/{{name}}.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

/**
    Description TODO
    @class module:"{{jsdocModule}}ui/{{name}}.reel".{{exportedName}}
    @extends module:montage/ui/component.Component
*/
exports.{{exportedName}} = Montage.create(Component, /** @lends module:"{{jsdocModule}}ui/{{name}}.reel".{{exportedName}}# */ {

});
