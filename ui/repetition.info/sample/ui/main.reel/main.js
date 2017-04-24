/**
 * @module ui/main.reel
 */
var Component = require("montage/ui/component").Component;

/**
 * @class Main
 * @extends Component
 */
exports.Main = Component.specialize(/** @lends Main# */ {
    constructor: {
        value: function Main() {
            this.super();
        }
    },
    myListProperty: {
        value: [{
            "quote": "If music be the food of love, play on.",
            "important": false
        }, {
            "quote": "O Romeo, Romeo! wherefore art thou Romeo?",
            "important": true
        }, {
            "quote": "All that glitters is not gold.",
            "important": false
        }, {
            "quote": "I am amazed and know not what to say.",
            "important": false
        }]
    }
});
