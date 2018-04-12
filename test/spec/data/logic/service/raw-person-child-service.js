var RawDataService = require("montage/data/service/raw-data-service").RawDataService;

exports.RawPersonChildService = RawDataService.specialize({
    

    fetchRawData: {
        value: function (stream) {
            stream.addData(MOCK_DATA);
            stream.dataDone();
        }
    }
    

});

var MOCK_DATA = {
    employer_name: "Kaazing",
    position_name: "software engineer"
};