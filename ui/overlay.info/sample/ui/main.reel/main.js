var Component = require("montage/ui/component").Component;

exports.Main = Component.specialize(/** @lends Main# */ {

    handleOpenOverlayButtonPress: {
        value: function(event) {
            this.overlay.show();
        }
    },

    handleCloseButtonAction: {
        value: function () {
            this.overlay.hide();
        }
    },

    didShowOverlay: {
        value: function (overlay) {
            console.log("didShowOverlay",overlay);
        }
    },

    didHideOverlay: {
        value: function (overlay) {
            console.log("didHideOverlay",overlay);
        }
    },

    _overlay: {
        value: undefined
    },

    overlay: {
        get: function () {
            return this._overlay;
        },
        set: function (value) {
            window.consentmentForm = this;
            window.overlay = value;
            this._overlay = value;
        }
    }
});
