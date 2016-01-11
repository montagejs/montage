/**
 * @module ui/sorting-and-filtering.reel
 */
var Component = require("montage/ui/component").Component;

/**
 * @class SortingAndFiltering
 * @extends Component
 */
exports.SortingAndFiltering = Component.specialize(/** @lends SortingAndFiltering# */ {
    constructor: {
        value: function SortingAndFiltering() {
            this.super();
        }
    },

    handleFilterButtonAction: {
        value: function (evt) {
            var rangeController = this.templateObjects.rangeController;
            // toggle filterPath to either filter by "important" key or not filter
            rangeController.filterPath = rangeController.filterPath ? "" : "important";
        }
    },

    handleSortButtonAction: {
        value: function (evt) {
            var rangeController = this.templateObjects.rangeController;
            // toggle sortPath to either filter by "quote" key or not filter
            rangeController.sortPath = rangeController.sortPath ? "" : "quote";
        }
    }
});
