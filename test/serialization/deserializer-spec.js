/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    logger = require("montage/core/logger").logger("deserializer-spec"),
    Deserializer = require("montage/core/deserializer").Deserializer,
    objects = require("serialization/testobjects-v2").objects;

logger.isError = true;

describe("serialization/deserializer-spec", function() {
    var deserializer;

    beforeEach(function() {
        deserializer = Deserializer.create();
        deserializer._require = require;
    });

    describe("Native Types Deserialization", function() {
        it("should deserialize a string", function() {
            deserializer.initWithObject({
                root: {
                    value: "string"
                }
            }).deserializeObject(function(object) {
                expect(object).toBe("string");
            });
        });

        it("should deserialize a number", function() {
            deserializer.initWithObject({
                root: {
                    value: 42
                }
            }).deserializeObject(function(object) {
                expect(object).toBe(42);
            });

            deserializer.initWithObject({
                root: {
                    value: -42
                }
            }).deserializeObject(function(object) {
                expect(object).toBe(-42);
            });

            deserializer.initWithObject({
                root: {
                    value: 3.1415
                }
            }).deserializeObject(function(object) {
                expect(object).toBe(3.1415);
            });
        });

        it("should deserialize a boolean", function() {
            deserializer.initWithObject({
                root: {
                    value: true
                }
            }).deserializeObject(function(object) {
                expect(object).toBe(true);
            });

            deserializer.initWithObject({
                root: {
                    value: false
                }
            }).deserializeObject(function(object) {
                expect(object).toBe(false);
            });
        });

        it("should deserialize a null value", function() {
            deserializer.initWithObject({
                root: {
                    value: null
                }
            }).deserializeObject(function(object) {
                expect(object).toBeNull();
            });
        });
    });

    describe("Native Objects Deserialization", function() {
        it("should deserialize an Array", function() {
            deserializer.initWithObject({
                root: {
                    value: [42, "string", null]
                }
            }).deserializeObject(function(object) {
                expect(object).toEqual([42, "string", null]);
            });
        });

        it("should deserialize a RegExp", function() {
            deserializer.initWithObject({
                root: {
                    value: {"/": {source: 'this \\/ "\\/ regexp', flags: "gm"}}
                }
            }).deserializeObject(function(object) {
                expect(object instanceof RegExp).toBeTruthy();
                expect(object.toString()).toBe(/this \/ "\/ regexp/gm.toString());
            });
        });

        it("should deserialize a object literal", function() {
            deserializer.initWithObject({
                root: {
                    value: {number: 42, string: "string", bool: true}
                }
            }).deserializeObject(function(object) {
                expect(object).toEqual({number: 42, string: "string", bool: true});
            });
        });

        it("should deserialize a function", function() {
            deserializer.initWithObject({
                root: {
                    value: {"->": {name: "square", arguments: ["x"], body: "return x*x;"}}
                }
            }).deserializeObject(function(object) {
                expect(object(2)).toBe(4);
            });
        });
    });

    describe("User Objects Deserialization", function() {
        it("should deserialize a class instance object", function() {
            var latch;

            deserializer.initWithObject({
                root: {
                    module: "montage",
                    name: "Montage",
                    properties: {
                        number: 15,
                        string: "string"
                    }
                }
            }).deserializeObject(function(object) {
                latch = true;
                expect(object.number).toBe(15);
                expect(object.string).toBe("string");
            });

            waitsFor(function() { return latch; });
        });

        it("should deserialize two class instance objects", function() {
            var latch;

            deserializer.initWithObject({
                root: {
                    module: "montage",
                    name: "Montage",
                    properties: {
                        oneprop: {"@": "oneprop"}
                    }
                },
                oneprop: {
                    module: "montage",
                    name: "Montage",
                    properties: {
                        prop: 42
                    }
                }
            }).deserializeObject(function(object) {
                latch = true;
                expect(object.oneprop.prop).toBe(42);
            });

            waitsFor(function() { return latch; });
        });

        it("should deserialize an external object with a label", function() {
            var latch;
            var simple = {};
            var instances = {};
            instances["simple"] = simple;

            deserializer.initWithObject({
                root: {
                    module: "montage",
                    name: "Montage",
                    properties: {
                        simple: {"@": "simple"}
                    }
                }
            }).deserializeWithInstances(instances, function(object) {
                latch = true;
                expect(object.root.simple).toBe(simple);
            });

            waitsFor(function() { return latch; });
        });

        it("should deserialize an object as another by providing a label", function() {
            var latch;
            var simple = {};
            var instances = {};
            instances["simple"] = simple;

            deserializer.initWithObject({
                root: {
                    module: "montage",
                    name: "Montage",
                    properties: {
                        simple: {"@": "simple"}
                    }
                },
                simple: {
                    module: "serialization/testobjects-v2",
                    name: "Simple"
                }
            }).deserializeWithInstances(instances, function(objects) {
                latch = true;
                expect(objects.root.simple).toBe(simple);
            });

            waitsFor(function() { return latch; });
        });
        /*
        it("should deserialize to a different object", function() {
            var latch;

            deserializer.initWithObject({
                root: {
                    module: "serialization/testobjects-v2",
                    name: "Singleton",
                    properties: {
                        manchete: 226
                    }
                }
            }).deserializeObject(function(object) {
                latch = true;
                expect(object).toBe(objects.Singleton.instance);
            });

            waitsFor(function() { return latch; });
        });
        */
        it("should return all objects deserialized", function() {
            var latch;

            deserializer.initWithObject({
                root: {
                    module: "serialization/testobjects-v2",
                    name: "TwoProps",
                    properties: {
                        prop1: ["object", "composed", "test"],
                        prop2: {"@": "simple"}
                    }
                },
                simple: {
                    module: "serialization/testobjects-v2",
                    name: "Simple"
                }
            }).deserializeObject(function(object) {
                latch = true;
                var objects = deserializer.getObjectsFromLastDeserialization();
                expect(objects.length).toBe(2);
                expect(objects).toContain(object);
                expect(objects).toContain(object.prop2);
            });

            waitsFor(function() { return latch; });
        });

        it("should call deserializedFromSerialization function on the instantiated objects", function() {
            var latch;
            var instances = {root: objects.OneProp.create()};
            deserializer.initWithObject({
                root: {
                    module: "serialization/testobjects-v2",
                    name: "OneProp",
                    properties: {
                        prop: {"@": "oneprop"}
                    }
                },
                oneprop: {
                    module: "serialization/testobjects-v2",
                    name: "OneProp"
                }
            }).deserializeWithInstances(instances, function(exports) {
                latch = true;
                expect(exports.root.deserializedFromSerializationCount).toBe(0);
                expect(exports.oneprop.deserializedFromSerializationCount).toBe(1);
            });

            waitsFor(function() { return latch; });
        });

        it("must not return the root object as deserialized when the deserialization fails",
        function() {
            var owner = {};
            var latch;

            logger.error("The next parsing error is expected");
            deserializer.initWithString('{owner:}').deserialize(function(object) {
                logger.error("No more parsing errors are expected");

                latch = true;
                var objects = deserializer.getObjectsFromLastDeserialization();
                expect(objects.length).toBe(0);
            });

            waitsFor(function() { return latch; });
        });

        it("should deserialize a group of disconnected objects", function() {
            var latch;

            deserializer.initWithObject({
                simple: {
                    module: "serialization/testobjects-v2",
                    name: "Simple",
                    properties: {
                        number: 42,
                        string: "string"
                    }
                },
                graphA: {
                    module: "serialization/testobjects-v2",
                    name: "OneProp",
                    properties: {
                        prop: {"@": "simple"}
                    }
                },
                graphB: {
                    module: "serialization/testobjects-v2",
                    name: "TwoProps",
                    properties: {
                        prop1: "string",
                        prop2: 42
                    }
                }
            }).deserialize(function(exports) {
                latch = true;

                expect(exports.graphA).toBeDefined();
                expect(exports.graphB).toBeDefined();
            });

            waitsFor(function() { return latch; });
        });
    });
});
