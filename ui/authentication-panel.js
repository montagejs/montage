var Component = require("./component").Component;

/**
 * @class AuthenticationPanel
 * @extends Component
 */
exports.AuthenticationPanel = Component.specialize(/** @lends AuthenticationPanel# */ {


    _identity: {
        value: undefined
    },

    identity: {
        get: function () {
            return this._identity;
        },
        set: function(value) {
            this._identity = value;
        }
    },

    show: {
        value: function() {
            var type = this.type,
                self = this;
            this.application.getPopupSlot(type, this, function(slot) {
                self._popupSlot = slot;
                self.displayed = true;
                self._addEventListeners();
            });
        }
    },

    /**
    * Hide the popup
    */
    hide: {
        value: function() {
            var type = this.type,
                self = this;

            this.application.getPopupSlot(type, this, function(slot) {
                self._removeEventListeners();
                //self.application.returnPopupSlot(type);
                self.displayed = false;
            });
        }
    },

    type: {
        value: "authentication"
    }

});
