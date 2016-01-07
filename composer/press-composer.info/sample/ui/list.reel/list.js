/**
 * @module ui/list.reel
 */
var Component = require("montage/ui/component").Component;

/**
 * @class List
 * @extends Component
 */
exports.List = Component.specialize(/** @lends List# */ {

    selectedCell: {
        value: null
    },

    prepareForActivationEvents: {
        value: function () {
            this.addPathChangeListener("selectedCell", this, "handleSelectedCellChange");
            this.addEventListener("action", this);
        }
    },

    handleSelectedCellChange: {
        value: function (selectedCell) {
            if (selectedCell) {
                console.log(this.identifier, "cell " + selectedCell + " selected");
            }
        }
    },

    handleAction: {
        value: function (event) {
            console.log(event.target.identifier, "action");
        }
    }

});
