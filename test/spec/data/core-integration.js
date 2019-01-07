var Deserializer = require("montage/core/serialization/deserializer/montage-deserializer").MontageDeserializer,
    serialization = require("spec/data/logic/service/montage-data.mjson");


describe("Core Integration", function() {

    it("Main Datareel is deserialized", function () {
        var service = application.service;
            expect(service).toBeDefined();
    });
});
