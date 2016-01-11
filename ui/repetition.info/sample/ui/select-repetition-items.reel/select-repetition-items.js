/**
 * @module ui/select-repetition-items.reel
 */
var Component = require("montage/ui/component").Component;

/**
 * @class SelectRepetitionItems
 * @extends Component
 */
exports.SelectRepetitionItems = Component.specialize(/** @lends SelectRepetitionItems# */ {
    constructor: {
        value: function SelectRepetitionItems() {
            this.super();
        }
    },

    templateDidLoad: {
        value: function () {
            this.templateObjects.rangeController.addRangeAtPathChangeListener(
                "selection", this, "handleSelectionChange");
        }
    },

    handleSelectionChange: {
        value: function (plus, minus) {
            this.message = "Selection changed from: "
            + (minus[0] ? this.content.indexOf(minus[0]) : "N/A")
            + " -> "
            + (plus[0] ? this.content.indexOf(plus[0]) : "N/A");
        }
    }

});
