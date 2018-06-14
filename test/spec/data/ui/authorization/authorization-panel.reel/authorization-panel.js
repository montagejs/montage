var AuthorizationPanel = require("montage/ui/authorization-panel.reel").AuthorizationPanel,
    Authorization = require("spec/data/logic/authorization/authorization").Authorization;

/**
 * @class AuthorizationPanel
 * @extends Component
 */
exports.AuthorizationPanel = AuthorizationPanel.specialize(/** @lends AuthorizationPanel# */ {
    
    
    approveAuthorization: {
        value: function () {
            this.authorizationManagerPanel.approveAuthorization(this.authorization, this);
        }
    },

    rejectAuthorization: {
        value: function () {
            this.authorizationManagerPanel.cancelAuthorization(this);
        }
    },

    authorization: {
        get: function () {
            if (!this._authorization) {
                this._authorization = new Authorization();
            }
            return this._authorization;
        }
    }

});
