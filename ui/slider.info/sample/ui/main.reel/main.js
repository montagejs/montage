/**
 * @module ui/main.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class Main
 * @extends Component
 */
exports.Main = Component.specialize(/** @lends Main.prototype */ {
    constructor: {
        value: function Main() {
            this.super();
        }
    },

    handleSliderAction: {
        value: function (event) {
            event.stopPropagation();
            console.log("handleSliderAction");
        }
    }
});
