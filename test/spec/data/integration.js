var Deserializer = require("montage/core/serialization/deserializer/montage-deserializer").MontageDeserializer,
    serialization = require("spec/data/logic/service/montage-data.mjson");


describe("End-to-end Integration", function() {

    it("can deserialize data-service", function (done) {
        new Deserializer().init(JSON.stringify(serialization), require).deserializeObject().then(function (service) {
            console.log("Service", service);
            expect(service).toBeDefined();
            done();
        });
    });
    console.log("Serialization", serialization);

});