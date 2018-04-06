var RawDataService = require("montage/data/service/raw-data-service").RawDataService;

exports.RawPersonServiceB = RawDataService.specialize({
    

    fetchRawData: {
        value: function (stream) {
            this.addRawData(stream, MOCK_DATA);
            this.rawDataDone(stream);
        }
    },

    mapRawDataToObject: {
        value: function (rawData, object) {
            object.name = rawData.name;
            object.birthday = new Date(rawData.birth_date);
        }
    }
    

});

var MOCK_DATA = [
    {
        name: "Robert Johnson",
        birth_date: 647283226915,
        lat_lng: {latitude: 39.9042, longitude: 116.4074}
    },
    {
        name: "Karl Towns",
        birth_date: 402258116915,
        lat_lng: {latitude: 40.7128, longitude: 74}
    },
    {
        name: "Anderson Cooper",
        birth_date: 982591626915,
        lat_lng: {latitude: -27.4698, longitude: 153.0251}
    }
];