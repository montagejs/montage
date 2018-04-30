var RawDataService = require("montage/data/service/raw-data-service").RawDataService,
    CategoryNames = ["Action"];

exports.CategoryService = RawDataService.specialize(/** @lends CategoryService.prototype */ {

    fetchRawData: {
        value: function (stream) {
            var categoryId = stream.query.criteria.parameters.categoryID || -1,
                isValidCategory = categoryId > 0 && CategoryNames.length >= categoryId,
                categoryName = isValidCategory && CategoryNames[categoryId - 1] || "Unknown";
                console.log("CategoryService.fetchRawData");
            this.addRawData(stream, [{
                name: categoryName
            }]);
            this.rawDataDone(stream);
        }
    }

});
