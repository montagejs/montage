/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/*global require,exports,describe,it,expect,waitsFor,runs */
var Montage = require("montage").Montage,
    Localizer = require("montage/core/localizer"),
    Deserializer = require("montage/core/deserializer").Deserializer;

describe("core/localizer-spec", function() {

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

    describe("serialization", function() {
        it("requires a key", function() {
            testDeserializer({
                test: {
                    prototype: "montage/ui/dynamic-text.reel",
                    properties: {
                        defaultValue: "fail"
                    },
                    localizations: {
                        value: {
                            "_default": "Hello"
                        }
                    }
                }
            }, function(objects) {
                var test = objects.test;
                expect(test.value).not.toBe("Hello");
            });
        });

        it("creates a binding from the localizer to the object", function() {
            testDeserializer({
                test: {
                    prototype: "montage/ui/dynamic-text.reel",
                    properties: {
                        defaultValue: "fail"
                    },
                    localizations: {
                        value: {
                            "_": "hello",
                            "_default": "Hello"
                        }
                    }
                }
            }, function(objects) {
                var test = objects.test;
                expect(test.value).toBe("Hello");
                expect(test._bindingDescriptors.value).toBeDefined();
            });
        });

        it("accepts variables for the localization", function() {
            testDeserializer({
                input: {
                    prototype: "montage",
                    properties: {
                        "thing": "World"
                    }
                },

                test: {
                    prototype: "montage/ui/dynamic-text.reel",
                    properties: {
                        defaultValue: "fail"
                    },
                    localizations: {
                        value: {
                            "_": "hello_thing",
                            "_default": "Hello {thing}",
                            "thing": "@input.thing"
                        }
                    }
                }
            }, function(objects) {
                var test = objects.test;
                expect(test.value).toBe("Hello World");
                objects.input.thing = "Earth";
                expect(test.value).toBe("Hello Earth");
            });
        });
    });

    describe("Localizer", function(){
    });
});
