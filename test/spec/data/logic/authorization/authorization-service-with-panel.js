var DataService = require("montage/data/service/data-service").DataService,
    Authorization = require("spec/data/logic/authorization/authorization").Authorization,
    Promise = require("montage/core/promise").Promise;



exports.AuthorizationServiceWithPanel = DataService.specialize( /** @lends AuthorizationServiceWithPanel.prototype */ {

    authorization: {
        get: function () {
            if (!this._authorization) {
                this._authorization = new Authorization();
            }
            return this._authorization;
        }
    },

    providesAuthorization: {
        value: true
    },

    didLogOut: {
        value: false
    },

    logOut: {
        value: function () {
            this.didLogOut = true;
        }
    },
    
    authorize: {
        value: function () {
            // return Promise.resolve(this.authorization);
            return null;
        }
    },


    authorizationPanel: {
        value: "spec/data/ui/authorization/authorization-panel.reel"
    }

});
