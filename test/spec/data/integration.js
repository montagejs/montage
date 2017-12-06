var Deserializer = require("montage/core/serialization/deserializer/montage-deserializer").MontageDeserializer,
    serialization = require("spec/data/logic/service/montage-data.mjson");


describe("End-to-end Integration", function() {

    it("can deserialize data-service", function () {
        var service = serialization.montageObject;
            expect(service).toBeDefined();
    });
});