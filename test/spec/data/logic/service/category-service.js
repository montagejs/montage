var RawDataService = require("montage/data/service/raw-data-service").RawDataService,
    CategoryNames = ["Action"];

exports.CategoryService = RawDataService.specialize(/** @lends CategoryService.prototype */ {

    fetchRawData: {
        value: function (stream) {
            var categoryId = stream.query.criteria.parameters || -1,
                isValidCategory = categoryId > 0 && CategoryNames.length >= categoryId,
                categoryName = isValidCategory && CategoryNames[categoryId - 1] || "Unknown";
            this.addRawData(stream, [{
                name: categoryName
            }]);
            stream.dataDone();
        }
    }

});
