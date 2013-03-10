var Montage = require("montage").Montage,
    Target = require("montage/core/target").Target;

exports.ActiveTargetTest = Montage.create(Target, {

    targetChainRangeController: {
        value: null
    },

    //NOTE that we can't rely on the target identifier when the event has been dispatched from the focused target
    handleKeyPress: {
        value: function (evt) {
            this.dispatchFocusedEventNamed("menuAction", true, true);
        }
    }

});
