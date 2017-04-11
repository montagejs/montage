var ModuleObjectDescriptor = require("montage/core/meta/module-object-descriptor").ModuleObjectDescriptor;
var ModuleReference = require("montage/core/module-reference").ModuleReference;

var Serializer = require("montage/core/serialization/serializer/montage-serializer").MontageSerializer;
var Deserializer = require("montage/core/serialization/deserializer/montage-deserializer").MontageDeserializer;

describe("meta/module-blueprint-spec", function () {

    var blueprintSerialization = {
        "blueprint_one_a": {
            "prototype": "montage/core/meta/property-blueprint",
            "properties": {
                "name": "a",
                "blueprint": {"@": "root"}
            }
        },
        "root": {
            "prototype": "montage/core/meta/module-blueprint",
            "properties": {
                "name": "One",
                "propertyBlueprints": [
                    {"@": "blueprint_one_a"}
                ],
                "module": {"%": "spec/meta/module-blueprint-spec"},
                "exportName": "One"
            }
        }
    };

    var objectDescriptorSerialization = {
        "objectDescriptor_one_a": {
            "prototype": "montage/core/meta/property-descriptor",
            "properties": {
                "name": "a",
                "objectDescriptor": {"@": "root"}
            }
        },
        "root": {
            "prototype": "montage/core/meta/module-object-descriptor",
            "properties": {
                "name": "One",
                "propertyDescriptors": [
                    {"@": "objectDescriptor_one_a"}
                ],
                "maxAge": 240,
                "module": {"%": "spec/meta/module-blueprint-spec"},
                "exportName": "One"
            }
        }
    };

    describe("ModuleObjectDescriptor", function () {

        var blueprintOne;
        beforeEach(function () {
            var ref = new ModuleReference().initWithIdAndRequire("spec/meta/module-blueprint-spec", require);
            blueprintOne = new ModuleObjectDescriptor().initWithModuleAndExportName(ref, "One");
            blueprintOne.addPropertyDescriptor(blueprintOne.newPropertyDescriptor("a", 1));
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

                serialization = serializer.serializeObject(blueprintOne);
                expect(JSON.parse(serialization))
                    .toEqual(expectedSerialization);
            });

            it("should not serialize without a module property", function () {
                blueprintOne.module = null;
                expect(function () {
                    serializer.serializeObject(blueprintOne);
                }).toThrow();
            });

            it("should not serialize without a exportName property", function () {
                blueprintOne.exportName = null;
                expect(function () {
                    serializer.serializeObject(blueprintOne);
                }).toThrow();
            });
        });

        describe("getObjectDescriptorWithModuleId", function () {
            it("caches the blueprints", function (done) {
                require.loadPackage({location: "spec/meta/blueprint/package"}).then(function (require) {                
                    return ModuleObjectDescriptor.getObjectDescriptorWithModuleId("thing.meta", require).then(function (blueprint1) {
                        return ModuleObjectDescriptor.getObjectDescriptorWithModuleId("thing.meta", require)
                        .then(function (blueprint2) {
                            expect(blueprint1).toBe(blueprint2);
                        });
                    }, function (err) {
                        fail(err);
                    }).finally(function () {
                        done();
                    });
                });
            });

            it("correctly loads blueprints with the same internal module ID cross package", function (done) {
                require.loadPackage({location: "spec/meta/blueprint/package"}).then(function (require) {
                    return ModuleObjectDescriptor.getObjectDescriptorWithModuleId("thing.meta", require)
                    .then(function (blueprint) {
                        expect(blueprint.parent).not.toBe(blueprint);
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
