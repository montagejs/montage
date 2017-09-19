var ObjectDescriptor = require("montage/core/meta/object-descriptor").ObjectDescriptor;
var EventDescriptor = require("montage/core/meta/event-descriptor").EventDescriptor;

var Serializer = require("montage/core/serialization/serializer/montage-serializer").MontageSerializer;
var Deserializer = require("montage/core/serialization/deserializer/montage-deserializer").MontageDeserializer;

describe("meta/event-descriptor-spec", function () {

    describe("EventDescriptor", function () {

        var blueprint, eventDescriptor;
        beforeEach(function () {
            blueprint = new ObjectDescriptor().initWithName("testObjectDescriptor");
            eventDescriptor = new EventDescriptor().initWithNameAndObjectDescriptor("event", blueprint);
        });

        it("has the correct name", function () {
            expect(eventDescriptor.name).toEqual("event");
        });

        describe("detailKeys", function () {
            it("can be pushed to", function () {
                eventDescriptor.detailKeys.push("pass");
                expect(eventDescriptor.detailKeys).toEqual(["pass"]);
            });

            it("can be set", function () {
                eventDescriptor.detailKeys = ["pass"];
                expect(eventDescriptor.detailKeys).toEqual(["pass"]);
            });

            it("can not be set to a string", function () {
                eventDescriptor.detailKeys = "fail";
                expect(eventDescriptor.detailKeys).toEqual([]);
            });
        });

        describe("serialization", function () {
            var serializer, blueprintSerialization, objectDescriptorSerialization;

            beforeEach(function () {
                blueprintSerialization = {
                    "root": {
                        "prototype": "montage/core/meta/event-blueprint",
                        "values": {
                            "name": "event",
                            "blueprint": {"@": "blueprint_testblueprint"}
                        }
                    },
                    "blueprint_testblueprint": {}
                };
                objectDescriptorSerialization = {
                    "root": {
                        "prototype": "montage/core/meta/event-descriptor",
                        "values": {
                            "name": "event",
                            "objectDescriptor": {"@": "objectDescriptor_testobjectdescriptor"}
                        }
                    },
                    "objectDescriptor_testobjectdescriptor": {}
                };
                serializer = new Serializer().initWithRequire(require);
                serializer.setSerializationIndentation(4);
            });

            it("should serialize correctly", function () {
                var expectedSerialization,
                    serialization;

                expectedSerialization = objectDescriptorSerialization;

                serialization = serializer.serializeObject(eventDescriptor);
                expect(JSON.parse(serialization))
                    .toEqual(expectedSerialization);
            });

            xit("should deserialize correctly", function (done) {
                var deserializer = new Deserializer().init(JSON.stringify(blueprintSerialization), require);
                deserializer.deserializeObject({blueprint_testblueprint: blueprint}).then(function (deserialized) {
                    expect(deserialized).toEqual(eventDescriptor);
                }).finally(function () {
                    done();
                });
            });
        });
    });
});
