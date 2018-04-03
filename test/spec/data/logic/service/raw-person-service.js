var RawDataService = require("montage/data/service/raw-data-service").RawDataService;

exports.RawPersonService = RawDataService.specialize({
    

    fetchRawData: {
        value: function (stream) {
            this.addRawData(stream, MOCK_DATA);
            this.rawDataDone(stream);
        }
    }
    

});

var MOCK_DATA = [
    {
        name: "Phil Smith",
        birth_date: 647203226915,
        lat_lng: {latitude: 39.9042, longitude: 116.4074}
    },
    {
        name: "Jerry Garcia",
        birth_date: 402259226915,
        lat_lng: {latitude: 40.7128, longitude: 74}
    },
    {
        name: "Bryan Williams",
        birth_date: 982611626915,
        lat_lng: {latitude: -27.4698, longitude: 153.0251}
    }
];