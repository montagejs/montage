/**
 * @module ui/range-controller-repetition.reel
 */
var Component = require("montage/ui/component").Component;

/**
 * @class RangeControllerRepetition
 * @extends Component
 */
exports.RangeControllerRepetition = Component.specialize(/** @lends RangeControllerRepetition# */ {
    constructor: {
        value: function RangeControllerRepeition() {
            this.super();
        }
    },

    templateDidLoad: {
        value: function () {
            this.templateObjects.rangeController.content = this.content;
        }
    },

    handleChangeButtonAction: {
        value: function (evt) {
            var randomContentIndex = Math.floor(Math.random() * this.content.length);
            this.templateObjects.rangeController.add(Object.clone(this.content[randomContentIndex]));
        }
    }

});
