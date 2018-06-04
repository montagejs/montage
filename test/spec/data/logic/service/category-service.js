var RawDataService = require("montage/data/service/raw-data-service").RawDataService,
    CategoryNames = ["Action"];

exports.CategoryService = RawDataService.specialize(/** @lends CategoryService.prototype */ {

    fetchRawData: {
        value: function (stream) {
            var categoryId = stream.query.criteria.parameters.categoryID || -1,
                isValidCategory = categoryId > 0 && CategoryNames.length >= categoryId,
                categoryName = isValidCategory && CategoryNames[categoryId - 1] || "Unknown";
            this.addRawData(stream, [{
                name: categoryName
            }]);
            this.rawDataDone(stream);
        }
    },

    saveRawData: {
        value: function (rawData, object) {
            if (rawData.categoryID) {
                CategoryNames[rawData.categoryID] = rawData.name;
            } else {
                CategoryNames.push(rawData.name);
            }
            
            return Promise.resolve(CategoryNames);
        }
    },

    deleteRawData: {
        value: function (rawData, object) {
            if (rawData.categoryID && CategoryNames[rawData.categoryID]) {
                CategoryNames.splice(rawData.categoryID, 1);
            }
            return Promise.resolve(CategoryNames);
        }
    }
    

});
