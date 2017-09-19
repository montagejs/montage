var ModuleObjectDescriptor = require("montage/core/meta/module-object-descriptor").ModuleObjectDescriptor;
var ModuleReference = require("montage/core/module-reference").ModuleReference;

var Serializer = require("montage/core/serialization/serializer/montage-serializer").MontageSerializer;
var Deserializer = require("montage/core/serialization/deserializer/montage-deserializer").MontageDeserializer;

describe("meta/module-object-descriptor-spec", function () {

    var objectDescriptorSerialization = {
        "objectDescriptor_one_a": {
            "prototype": "montage/core/meta/property-descriptor",
            "values": {
                "name": "a",
                "objectDescriptor": {"@": "root"}
            }
        },
        "root": {
            "prototype": "montage/core/meta/module-object-descriptor",
            "values": {
                "name": "One",
                "propertyDescriptors": [
                    {"@": "objectDescriptor_one_a"}
                ],
                "module": {"%": "spec/meta/module-object-descriptor-spec"},
                "exportName": "One"
            }
        }
    };

    var objectDescriptorSerialization = {
        "objectDescriptor_one_a": {
            "prototype": "montage/core/meta/property-descriptor",
            "values": {
                "name": "a",
                "objectDescriptor": {"@": "root"}
            }
        },
        "root": {
            "prototype": "montage/core/meta/module-object-descriptor",
            "values": {
                "name": "One",
                "propertyDescriptors": [
                    {"@": "objectDescriptor_one_a"}
                ],
                "maxAge": 240,
                "module": {"%": "spec/meta/module-object-descriptor-spec"},
                "exportName": "One"
            }
        }
    };

    describe("ModuleObjectDescriptor", function () {

        var objectDescriptorOne;
        beforeEach(function () {
            var ref = new ModuleReference().initWithIdAndRequire("spec/meta/module-object-descriptor-spec", require);
            objectDescriptorOne = new ModuleObjectDescriptor().initWithModuleAndExportName(ref, "One");
            objectDescriptorOne.addPropertyDescriptor(objectDescriptorOne.newPropertyDescriptor("a", 1));
        });

        describe("serialization", function () {
            var serializer;

            beforeEach(function () {
                serializer = new Serializer().initWithRequire(require);
                serializer.setSerializationIndentation(4);
            });

            it("should serialize correctly", function () {
                var expectedSerialization,
                    serialization;

                expectedSerialization = objectDescriptorSerialization;

                serialization = serializer.serializeObject(objectDescriptorOne);
                expect(JSON.parse(serialization))
                    .toEqual(expectedSerialization);
            });

            it("should not serialize without a module property", function () {
                objectDescriptorOne.module = null;
                expect(function () {
                    serializer.serializeObject(objectDescriptorOne);
                }).toThrow();
            });

            it("should not serialize without a exportName property", function () {
                objectDescriptorOne.exportName = null;
                expect(function () {
                    serializer.serializeObject(objectDescriptorOne);
                }).toThrow();
            });
        });

        describe("getObjectDescriptorWithModuleId", function () {
            it("caches the objectDescriptors", function (done) {
                require.loadPackage({location: "spec/meta/blueprint/package"}).then(function (require) {
                    return ModuleObjectDescriptor.getObjectDescriptorWithModuleId("thing.meta", require).then(function (objectDescriptor1) {
                        return ModuleObjectDescriptor.getObjectDescriptorWithModuleId("thing.meta", require)
                        .then(function (objectDescriptor2) {
                            expect(objectDescriptor1).toBe(objectDescriptor2);
                        });
                    }, function (err) {
                        fail(err);
                    }).finally(function () {
                        done();
                    });
                });
            });

            it("correctly loads objectDescriptors with the same internal module ID cross package", function (done) {
                require.loadPackage({location: "spec/meta/blueprint/package"}).then(function (require) {
                    return ModuleObjectDescriptor.getObjectDescriptorWithModuleId("thing.meta", require)
                    .then(function (objectDescriptor) {
                        expect(objectDescriptor.parent).not.toBe(objectDescriptor);
                    }, function (err) {
                        fail(err);
                    }).finally(function () {
                        done();
                    });
                });
            });
        });
    });
});
