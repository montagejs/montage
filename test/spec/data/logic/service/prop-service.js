var RawDataService = require("montage/data/service/raw-data-service").RawDataService,
    CategoryNames = ["Action"];

exports.PropService = RawDataService.specialize(/** @lends PropService.prototype */ {

    _data: {
        value: [
            {name: "Falcon"},
            {name: "Lightsaber"}
        ]
    },

    fetchRawData: {
        value: function (stream) {
            console.log("PropService.fetchRawData");
            this.addRawData(stream, this._data);
            this.rawDataDone(stream);
        }
    }

});
