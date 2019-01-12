var RawDataService = require("montage/data/service/raw-data-service").RawDataService,
    AuthorizationPolicy = require("montage/data/service/authorization-policy").AuthorizationPolicy; 

exports.OnDemandService = RawDataService.specialize(/** @lends OnDemandService.prototype */ {

    authorizationServices: {
        value: ["spec/data/logic/authorization/authorization-service"]
    },

    authorizationPolicy: {
        value: AuthorizationPolicy.ON_DEMAND
    },

    fetchRawData: {
        value: function (stream) {
            stream.dataDone();
        }
    },

    didLogOut: {
        value: false
    },

    /**
     *
     * @method
     * @returns Promise
     */
    logOut: {
        value: function () {
            this.didLogOut = true;
            return RawDataService.prototype.logOut.call(this);
        }
    }

});