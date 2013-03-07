var Montage = require("montage").Montage;

exports.ActiveTargetTest = Montage.create(Montage, {

    topEditor: {
        value: null
    },

    editorA: {
        value: null
    },

    editorB: {
        value: null
    },

    menuActionDelay: {
        value: 3
    },

    handleAction: {
        value: function (evt) {
            var eventManager = evt.target.eventManager,
                self = this;

            console.log("About to dispatch menuAction…");

            setTimeout(function () {
                console.log("Dispatch menuAction");
                self.dispatchMenuAction(eventManager);
            }, this.menuActionDelay * 1000);
        }
    },

    dispatchMenuAction: {
        value: function (eventManager) {
            eventManager.dispatchFocusedEventNamed("menuAction", true, true);
        }
    }

});
