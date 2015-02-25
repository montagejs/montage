var ModuleBlueprint = require("montage/core/meta/module-blueprint").ModuleBlueprint;
var ModuleReference = require("montage/core/module-reference").ModuleReference;

var Serializer = require("montage/core/serialization").Serializer;
var Deserializer = require("montage/core/serialization").Deserializer;

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
                "module": {"%": "meta/module-blueprint-spec"},
                "exportName": "One"
            }
        }
    };

    describe("ModuleBlueprint", function () {

        var blueprintOne;
        beforeEach(function () {
            var ref = new ModuleReference().initWithIdAndRequire("meta/module-blueprint-spec", require);
            blueprintOne = new ModuleBlueprint().initWithModuleAndExportName(ref, "One");

            blueprintOne.addPropertyBlueprint(blueprintOne.newPropertyBlueprint("a", 1));
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

                expectedSerialization = blueprintSerialization;

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

        describe("getBlueprintWithModuleId", function () {
            it("caches the blueprints", function () {
                return require.loadPackage({location: "meta/blueprint/package"})
                .then(function (require) {
                    return ModuleBlueprint.getBlueprintWithModuleId("thing.meta", require)
                    .then(function (blueprint1) {
                        return ModuleBlueprint.getBlueprintWithModuleId("thing.meta", require)
                        .then(function (blueprint2) {
                            expect(blueprint1).toBe(blueprint2);
                        });
                    });
                });
            });

            it("correctly loads blueprints with the same internal module ID cross package", function () {
                return require.loadPackage({location: "meta/blueprint/package"})
                .then(function (require) {
                    return ModuleBlueprint.getBlueprintWithModuleId("thing.meta", require)
                    .then(function (blueprint) {
                        expect(blueprint.parent).not.toBe(blueprint);
                    });
                });
            });
        });


    });

});
