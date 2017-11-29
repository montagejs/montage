/**
 * @module "ui/main.reel"
 */
var Component = require("montage/ui/component").Component,
    data = require('core/data');

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

    myData: {
        get: function() {
            return data;
        }
    }
});
