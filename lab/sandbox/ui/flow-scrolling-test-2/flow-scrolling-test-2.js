var Montage = require("montage").Montage;

exports.FlowScrollingTest2 = Montage.create(Montage, {

    flow: {
        value: null
    },

    index: {
        value: 0
    },

    handleNextAction: {
        enumerable: false,
        value: function () {
            this.index++;
            this.flow.startScrollingIndexToOffset(this.index, 0);
        }
    }
});