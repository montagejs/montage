var RawDataService = require("montage-data/logic/service/raw-data-service").RawDataService,
    CategoryNames = ["Action"];

exports.CategoryService = RawDataService.specialize(/** @lends CategoryService.prototype */ {

    fetchRawData: {
        value: function (stream) {
            var categoryId = stream.query.criteria.parameters.value || -1,
                isValidCategory = categoryId > 0 && CategoryNames.length >= categoryId,
                categoryName = isValidCategory && CategoryNames[categoryId - 1] || "Unknown";
            this.addRawData(stream, [{
                name: categoryName
            }]);
            stream.dataDone();
        }
    }

});
