var DataService = require("montage/data/service/data-service").DataService,
    Authorization = require("spec/data/logic/authorization/authorization").Authorization,
    Promise = require("montage/core/promise").Promise;



exports.AuthorizationService = DataService.specialize( /** @lends AuthorizationService.prototype */ {

    authorization: {
        get: function () {
            if (!this._authorization) {
                this._authorization = new Authorization();
            }
            return this._authorization;
        }
    },
    
    authorize: {
        value: function () {
            return Promise.resolve(this.authorization);
        }
    }

    

});
