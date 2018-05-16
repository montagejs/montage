var RawDataService = require("montage/data/service/raw-data-service").RawDataService,
    AuthorizationPolicy = require("montage/data/service/authorization-policy").AuthorizationPolicy;

exports.OnFirstFetchService = RawDataService.specialize(/** @lends OnFirstFetchService.prototype */ {

    authorizationServices: {
        value: ["spec/data/logic/authorization/authorization-service"]
    },

    authorizationPolicy: {
        value: AuthorizationPolicy.ON_FIRST_FETCH
    },

    fetchRawData: {
        value: function (stream) {
            stream.dataDone();
        }
    }

});