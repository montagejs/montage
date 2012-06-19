/*global require,exports,describe,beforeEach,it,expect,waits,waitsFor,runs */
var Montage = require("montage").Montage,
    Localizer = require("montage/core/localizer"),
    Promise = require("montage/core/promise").Promise,
    Deserializer = require("montage/core/deserializer").Deserializer,
    TestPageLoader = require("support/testpageloader").TestPageLoader;

var testPage = TestPageLoader.queueTest("fallback", {directory: module.directory}, function() {
    var test = testPage.test;

    function testDeserializer(object, callback) {
        var deserializer = Deserializer.create(),
            objects, latch;

        deserializer._require = require;
        deserializer.initWithObject(object).deserialize(function(objs) {
            latch = true;
            objects = objs;
        });

        waitsFor(function() { return latch; });
        runs(function() {
            callback(objects);
        });
    }

    describe("core/localizer/serialization-spec", function() {
        describe("localizations unit", function() {

            it("requires a key", function() {
                expect(test.missingKey.value).toBe("Pass");
            });

            it("localizes a string", function() {
                expect(test.basic.value).toBe("Pass.");
            });

            it("localizes a string and uses available resources", function() {
                expect(test.resources.value).toBe("Hello");
            });

            it("creates a binding from the localizer to the object", function() {
                expect(test.binding.value).toBe("Hello World");
                expect(test.binding._bindingDescriptors.value).toBeDefined();
                test.bindingInput.value = "Earth";
                expect(test.binding.value).toBe("Hello Earth");
            });
        });

        describe("localizer localizeObjects", function() {
            it("only works on the localizer", function() {
                testDeserializer({
                    other: {
                        value: {x: "pass"}
                    },
                    localizer: {
                        prototype: "montage/core/converter/converter",
                        localizeObjects: [
                            {
                                object: {"@": "other"},
                                "properties": {
                                    x: "fail"
                                }
                            }
                        ]
                    }
                }, function(objects) {
                    waits(10); // wait for promise to be resolved
                    runs(function() {
                        expect(objects.other.x).toBe("pass");
                    });
                });
            });

            it("can set properties on any object", function() {
                testDeserializer({
                    other: {
                        value: {x: "fail"}
                    },
                    localizer: {
                        object: "montage/core/localizer",
                        localizeObjects: [
                            {
                                object: {"@": "other"},
                                "properties": {
                                    x: "pass"
                                }
                            }
                        ]
                    }
                }, function(objects) {
                    waits(10); // wait for promise to be resolved
                    runs(function() {
                        expect(objects.other.x).toBe("pass");
                    });
                });
            });
            it("uses the existing property value as a key", function() {
                testDeserializer({
                    other: {
                        value: {x: "pass"}
                    },
                    localizer: {
                        object: "montage/core/localizer",
                        localizeObjects: [
                            {
                                object: {"@": "other"},
                                "properties": {
                                    x: true
                                }
                            }
                        ]
                    }
                }, function(objects) {
                    waits(10); // wait for promise to be resolved
                    runs(function() {
                        expect(objects.other.x).toBe("pass");
                    });
                });
            });
        });
    });
});