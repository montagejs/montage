/**
 * @module "ui/main.reel"
 */
var Component = require("montage/ui/component").Component;

/**
 * @class Main
 * @extends Component
 */
exports.Main = Component.specialize(/** @lends Main.prototype */{
	constructor: {
        value: function Main() {
            this.super();
        }
    },

    packageDescription: {
        get: function() {
            return ( typeof montageRequire !== "undefined" ? montageRequire : mr).packageDescription;
        }
    }
});
