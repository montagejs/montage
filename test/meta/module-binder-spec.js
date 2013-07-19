var ModuleBinder = require("montage/core/meta/module-binder").ModuleBinder;
var Blueprint = require("montage/core/meta/blueprint").Blueprint;
var Promise = require("montage/core/promise").Promise;

var MontageSerializer = require("montage/core/serialization").Serializer;

var twoExports = require("./blueprint/two-exports");

// makes a fake require function that takes a moduleId => exports object
function makeFakeRequire(mappings, fallbackRequire) {
    var r = function (id) {
        if (id in mappings) {
            return mappings[id];
        } else if (fallbackRequire) {
            return fallbackRequire(id);
        }
        throw new Error("Can't require module " + id);
    };
    r.location = "http://fake/";
    r.async = function (id) {
        if (id in mappings) {
            return Promise(mappings[id]);
        } else if (fallbackRequire) {
            return fallbackRequire.async(id);
        }
        return Promise.reject(new Error("Can't require module " + id));
    };
    r.resolve = function (id) {
        return id;
    };
    r.getModuleDescriptor = function (id) {
        return {
            id: id,
            require: r,
        };
    };
    return r;
}

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

            it("should not serialize without a binderInstanceModuleId", function () {
                binder.binderInstanceModuleId = null;
                expect(function () {
                    serializer.serializeObject(binder);
                }).toThrow();
            });
        });

        describe("getBlueprintForExport", function () {
            it("gets the blueprint with the given exportName", function () {
                expect(binder.getBlueprintForExport("one")).toBe(blueprintOne);
                expect(binder.getBlueprintForExport("two")).toBe(blueprintTwo);
            });

            it("updates live", function () {
                var blueprintThree = new Blueprint().initWithNameAndModuleId("three");
                binder.addBlueprint(blueprintThree);
                expect(binder.getBlueprintForExport("three")).toBe(blueprintThree);
            });
        });

        describe("getBinder", function () {
            it("only accepts module ids ending with .meta", function () {
                expect(function () {
                    ModuleBinder.getBinder("fail", require);
                }).toThrow("fail blueprint module id does not end in '.meta'");
            });

            it("returns a binder", function () {
                var serializer = new MontageSerializer().initWithRequire(require);
                var _require = makeFakeRequire({
                    "test.meta": JSON.parse(serializer.serializeObject(binder))
                }, require);

                return ModuleBinder.getBinder("test.meta", _require)
                .then(function (moduleBinder) {
                    expect(moduleBinder.name).toBe(binder.name);
                });
            });
        });

        describe(".meta file", function () {

            it("has a blueprint for each export", function () {
                return Promise.all([twoExports.One.blueprint, twoExports.Two.blueprint])
                .spread(function (oneBlueprint, twoBlueprint) {
                    expect(oneBlueprint.moduleId).toBe("meta/blueprint/two-exports");
                    expect(oneBlueprint.prototypeName).toBe("One");
                    expect(oneBlueprint.propertyBlueprints[0].name).toBe("one");

                    expect(twoBlueprint.moduleId).toBe("meta/blueprint/two-exports");
                    expect(twoBlueprint.prototypeName).toBe("Two");
                    expect(twoBlueprint.propertyBlueprints[0].name).toBe("two");
                });
            });

        });

    });
});
