var Montage = require("montage").Montage,
    Target = require("montage/core/target").Target;

exports.ActiveTargetTest = Montage.create(Target, {

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
            console.log("About to dispatch menuAction…");

            var self = this;
            setTimeout(function () {
                console.log("Dispatch menuAction");
                self.dispatchMenuAction();
            }, this.menuActionDelay * 1000);
        }
    },

    dispatchMenuAction: {
        value: function () {
            this.dispatchFocusedEventNamed("menuAction", true, true);
        }
    }

});
