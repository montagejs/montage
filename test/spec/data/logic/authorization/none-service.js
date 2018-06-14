var RawDataService = require("montage/data/service/raw-data-service").RawDataService,
    AuthorizationPolicy = require("montage/data/service/authorization-policy").AuthorizationPolicy;

exports.NoneService = RawDataService.specialize(/** @lends NoneService.prototype */ {

    authorizationPolicy: {
        value: AuthorizationPolicy.NONE
    },

    fetchRawData: {
        value: function (stream) {
            stream.dataDone();
        }
    }

});