var RawDataService = require("montage/data/service/raw-data-service").RawDataService,
    CategoryNames = ["Action"];

exports.MovieService = RawDataService.specialize(/** @lends MovieService.prototype */ {

    saveRawData: {
        value: function (record, object) {
            return Promise.resolve(record);
        }
    },


    fetchRawData: {
        value: function (stream) {
            this.addRawData(stream, [{
                name: "Bill and Ted's Excellent Adventure"
            }]);
            this.rawDataDone(stream);
        }
    }

});
