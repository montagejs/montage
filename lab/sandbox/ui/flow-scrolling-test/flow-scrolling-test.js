var Montage = require("montage").Montage;

exports.FlowScrollingTest = Montage.create(Montage, {

    index: {
        value: 10
    },

    handleNextAction: {
        enumerable: false,
        value: function () {
            this.index++;
            this.flow.startScrollingIndexToOffset(this.index, 10);
        }
    }
});