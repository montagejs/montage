var Montage = require("montage").Montage,
    defaultEventManager = require("montage/core/event/event-manager").defaultEventManager,
    Target = require("montage/core/target").Target;

exports.ActiveTargetTest = Target.specialize( {

    targetChainRangeController: {
        value: null
    },

    //NOTE that we can't rely on the target identifier when the event has been dispatched from the focused target
    handleKeyPress: {
        value: function (evt) {
            defaultEventManager.activeTarget.dispatchEventNamed("menuAction", true, true);
        }
    }

});
