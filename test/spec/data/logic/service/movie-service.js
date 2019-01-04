var RawDataService = require("montage/data/service/raw-data-service").RawDataService,
    CategoryNames = ["Action"];

exports.MovieService = RawDataService.specialize(/** @lends MovieService.prototype */ {

    saveRawData: {
        value: function (record, object) {
            return Promise.resolve(record);
        }
    }

});
