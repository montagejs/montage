var RawDataService = require("montage/data/service/raw-data-service").RawDataService;

exports.RawPersonServiceD = RawDataService.specialize({
    

    fetchRawData: {
        value: function (stream) {
            this.addRawData(stream, MOCK_DATA);
            this.rawDataDone(stream);
        }
    }
    

});

var MOCK_DATA = [
    {
        name: "Jon Favreau",
        birth_date: 647203221465
    },
    {
        name: "Jerry Garcia",
        birth_date: 401259226915
    },
    {
        name: "Bryan Williams",
        birth_date: 982311626915
    }
];