var Component = require("./component").Component;

/**
 * @class AuthenticationPanel
 * @extends Component
 */
exports.AuthenticationPanel = Component.specialize(/** @lends AuthenticationPanel# */ {


    _userIdentity: {
        value: undefined
    },

    userIdentity: {
        get: function () {
            return this._userIdentity;
        },
        set: function(value) {
            this._userIdentity = value;
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
