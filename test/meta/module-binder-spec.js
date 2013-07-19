var ModuleBinder = require("montage/core/meta/module-binder").ModuleBinder;
var Blueprint = require("montage/core/meta/blueprint").Blueprint;

var MontageSerializer = require("montage/core/serialization").Serializer;

describe("meta/module-bindiner-spec", function () {

    describe("ModuleBinder", function () {

        var binder, blueprintOne, blueprintTwo;
        beforeEach(function () {
            binder = new ModuleBinder().initWithNameAndRequire("test", require);
            binder.binderInstanceModuleId = "meta/test";

            blueprintOne = new Blueprint().initWithNameAndModuleId("one");
            blueprintTwo = new Blueprint().initWithNameAndModuleId("two");

            blueprintOne.addPropertyBlueprint(blueprintOne.newPropertyBlueprint("a", 1));

            binder.addBlueprint(blueprintOne);
            binder.addBlueprint(blueprintTwo);
        });

        describe("serialization", function () {
            var serializer;

            beforeEach(function() {
                serializer = new MontageSerializer().initWithRequire(require);
                serializer.setSerializationIndentation(4);
            });

            it("should serialize correctly", function() {
                var expectedSerialization,
                    serialization;

                expectedSerialization = {
                    "blueprint_one_a": {
                        "prototype": "montage/core/meta/property-blueprint",
                        "properties": {
                            "name": "a",
                            "blueprint": {"@": "blueprint_one"}
                        }
                    },
                    "blueprint_one": {
                        "prototype": "montage/core/meta/blueprint",
                        "properties": {
                            "name": "one",
                            "binder": {"@": "root"},
                            "blueprintModuleId": null,
                            "prototypeName": "one",
                            "propertyBlueprints": [
                                {"@": "blueprint_one_a"}
                            ]
                        }
                    },
                    "blueprint_two": {
                        "prototype": "montage/core/meta/blueprint",
                        "properties": {
                            "name": "two",
                            "binder": {"@": "root"},
                            "blueprintModuleId": null,
                            "prototypeName": "two"
                        }
                    },
                    "root": {
                        "prototype": "montage/core/meta/module-binder",
                        "properties": {
                            "name": "test",
                            "blueprints": [
                                {"@": "blueprint_one"},
                                {"@": "blueprint_two"}
                            ],
                            "binderModuleId": "meta/test"
                        }
                    }
                };

                serialization = serializer.serializeObject(binder);
                expect(JSON.parse(serialization))
                    .toEqual(expectedSerialization);
            });
        });

    });
});
