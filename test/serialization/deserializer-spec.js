/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    logger = require("montage/core/logger").logger("deserializer-spec"),
    Deserializer = require("montage/core/deserializer").Deserializer,
    deserialize = require("montage/core/deserializer").deserialize,
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

        it("should deserialize string with string shorthand", function () {
            return deserialize('{"root":{"value":"string"}}')
            .then(function (object) {
                expect(object).toBe("string");
            });
        });

        it("should deserialize string with object shorthand", function () {
            return deserialize({
                root: {
                    value: "string"
                }
            })
            .then(function (object) {
                expect(object).toBe("string");
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

        it("should deserialize string with shorthand", function () {
            return deserialize('{"root":{"value":[1,2,3]}}')
            .then(function (object) {
                expect(object).toEqual([1,2,3]);
            });
        });

    });

    describe("User Objects Deserialization", function() {
        it("should deserialize a class instance object", function() {
            var latch, object;

            deserializer.initWithObject({
                root: {
                    module: "montage",
                    name: "Montage",
                    properties: {
                        number: 15,
                        string: "string"
                    }
                }
            }).deserializeObject(function(obj) {
                latch = true;
                object = obj;
            });

            waitsFor(function() { return latch; });
            runs(function() {
                expect(object.number).toBe(15);
                expect(object.string).toBe("string");
            })
        });

        it("should deserialize two class instance objects", function() {
            var latch, object;

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
            }).deserializeObject(function(obj) {
                latch = true;
                object = obj;
            });

            waitsFor(function() { return latch; });
            runs(function() {
                expect(object.oneprop.prop).toBe(42);
            });
        });

        it("should deserialize an external object with a label", function() {
            var latch;
            var simple = {};
            var instances = {};
            var object;
            instances["simple"] = simple;

            deserializer.initWithObject({
                root: {
                    module: "montage",
                    name: "Montage",
                    properties: {
                        simple: {"@": "simple"}
                    }
                }
            }).deserializeWithInstances(instances, function(obj) {
                latch = true;
                object = obj;
            });

            waitsFor(function() { return latch; });
            runs(function() {
                expect(object.root.simple).toBe(simple);
            });
        });

        it("should deserialize an object as another by providing a label", function() {
            var latch;
            var simple = {};
            var instances = {};
            var objects;
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
            }).deserializeWithInstances(instances, function(objs) {
                latch = true;
                objects = objs;
            });

            waitsFor(function() { return latch; });
            runs(function() {
                expect(objects.root.simple).toBe(simple);
            })
        });
        /*
        it("should deserialize to a different object", function() {
            var latch, object;

            deserializer.initWithObject({
                root: {
                    module: "serialization/testobjects-v2",
                    name: "Singleton",
                    properties: {
                        manchete: 226
                    }
                }
            }).deserializeObject(function(obj) {
                latch = true;
                object = obj;
            });

            waitsFor(function() { return latch; });
            runs(function() {
                expect(object).toBe(objects.Singleton.instance);
            })
        });
        */
        it("should return all objects deserialized", function() {
            var latch, object, objects;

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
            }).deserializeObject(function(obj) {
                latch = true;
                object = obj;
            });

            waitsFor(function() { return latch; });
            runs(function() {
                var objects = deserializer.getObjectsFromLastDeserialization();
                expect(objects.length).toBe(2);
                expect(objects).toContain(object);
                expect(objects).toContain(object.prop2);
            })
        });

        it("should call deserializedFromSerialization function on the instantiated objects", function() {
            var latch;
            var instances = {root: objects.OneProp.create()};
            var exports;

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
            }).deserializeWithInstances(instances, function(objs) {
                latch = true;
                exports = objs;
            });

            waitsFor(function() { return latch; });
            runs(function() {
                expect(exports.root.deserializedFromSerializationCount).toBe(0);
                expect(exports.oneprop.deserializedFromSerializationCount).toBe(1);
            })
        });

        it("must not return the root object as deserialized when the deserialization fails",
        function() {
            var owner = {};
            var latch;

            logger.error("The next parsing error is expected");
            deserializer.initWithString('{owner:}').deserialize(function(object) {
                logger.error("No more parsing errors are expected");
                latch = true;
            });

            waitsFor(function() { return latch; });
            runs(function() {
                var objects = deserializer.getObjectsFromLastDeserialization();
                expect(objects.length).toBe(0);
            });
        });

        it("should deserialize a group of disconnected objects", function() {
            var latch, exports;

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
            }).deserialize(function(objs) {
                latch = true;
                exports = objs;
            });

            waitsFor(function() { return latch; });
            runs(function() {
                expect(exports.graphA).toBeDefined();
                expect(exports.graphB).toBeDefined();
            });
        });
    });

    describe("User Objects Deserialization With Short Object Location", function() {
        it("should deserialize using prototype: module[name]", function() {
            var latch, objects;

            deserializer.initWithObject({
                root: {
                    prototype: "montage[Montage]",
                    properties: {
                        number: 15,
                        string: "string"
                    }
                }
            }).deserialize(function(objs) {
                latch = true;
                objects = objs;
            });

            waitsFor(function() { return latch; });
            runs(function() {
                var root = objects.root,
                    info = Montage.getInfoForObject(root);

                expect(Montage.isPrototypeOf(root));
                expect(root.instance).toBeUndefined();
            });
        });

        it("should deserialize using prototype: module", function() {
            var latch, objects;

            deserializer.initWithObject({
                root: {
                    prototype: "montage",
                    properties: {
                        number: 15,
                        string: "string"
                    }
                }
            }).deserialize(function(objs) {
                latch = true;
                objects = objs;
            });

            waitsFor(function() { return latch; });
            runs(function() {
                var root = objects.root,
                    info = Montage.getInfoForObject(root);

                expect(Montage.isPrototypeOf(root));
                expect(info.moduleId).toBe("core/core");
                expect(info.objectName).toBe("Montage");
                expect(info.isInstance).toBe(true);
                expect(root.instance).toBeUndefined();
            });
        });

        it("should deserialize using prototype: module-name.reel", function() {
            var latch, objects;

            deserializer.initWithObject({
                root: {
                    prototype: "serialization/module-name.reel",
                    properties: {
                        number: 15,
                        string: "string"
                    }
                }
            }).deserialize(function(objs) {
                latch = true;
                objects = objs;
            });

            waitsFor(function() { return latch; });
            runs(function() {
                var root = objects.root,
                    info = Montage.getInfoForObject(root);

                expect(info.moduleId).toBe("serialization/module-name.reel/module-name");
                expect(info.objectName).toBe("ModuleName");
                expect(info.isInstance).toBe(true);
            });
        });

        it("should deserialize using object: module[name]", function() {
            var latch, objects;

            deserializer.initWithObject({
                root: {
                    object: "montage[Montage]",
                    properties: {
                        number: 15,
                        string: "string"
                    }
                }
            }).deserialize(function(objs) {
                latch = true;
                objects = objs;
            });

            waitsFor(function() { return latch; });
            runs(function() {
                var root = objects.root,
                    info = Montage.getInfoForObject(root);

                expect(root).toBe(Montage);
                expect(info.moduleId).toBe("core/core");
                expect(info.objectName).toBe("Montage");
                expect(info.isInstance).toBe(false);
                expect(root.type).toBeUndefined();
            });
        });

        it("should deserialize using object: module", function() {
            var latch, objects;

            deserializer.initWithObject({
                root: {
                    object: "montage",
                    properties: {
                        number: 15,
                        string: "string"
                    }
                }
            }).deserialize(function(objs) {
                latch = true;
                objects = objs;
            });

            waitsFor(function() { return latch; });
            runs(function() {
                var root = objects.root,
                    info = Montage.getInfoForObject(root);

                expect(root).toBe(Montage);
                expect(info.moduleId).toBe("core/core");
                expect(info.objectName).toBe("Montage");
                expect(info.isInstance).toBe(false);
                expect(root.type).toBeUndefined();
            });
        });

        it("should deserialize using instance after compilation", function() {
            var latch, objects;

            deserializer.initWithObject({
                root: {
                    prototype: "montage",
                    properties: {
                        number: 15,
                        string: "string"
                    }
                }
            }).deserialize(function() {
                deserializer.deserialize(function(objs) {
                    latch = true;
                    objects = objs;
                });
            });

            waitsFor(function() { return latch; });
            runs(function() {
                var root = objects.root,
                    info = Montage.getInfoForObject(root);

                expect(Montage.isPrototypeOf(root));
                expect(info.moduleId).toBe("core/core");
                expect(info.objectName).toBe("Montage");
                expect(info.isInstance).toBe(true);
            });
        });

        it("should deserialize using type after compilation", function() {
            var latch, objects;

            deserializer.initWithObject({
                root: {
                    object: "montage",
                    properties: {
                        number: 15,
                        string: "string"
                    }
                }
            }).deserialize(function() {
                deserializer.deserialize(function(objs) {
                    latch = true;
                    objects = objs;
                });
            });

            waitsFor(function() { return latch; });
            runs(function() {
                var root = objects.root,
                    info = Montage.getInfoForObject(root);

                expect(root).toBe(Montage);
                expect(info.moduleId).toBe("core/core");
                expect(info.objectName).toBe("Montage");
                expect(info.isInstance).toBe(false);
            })
        });
    });

    describe("Element Reference Deserialization", function() {
        var root = document.createElement("div");

        it("should deserialize an element reference through id", function() {
            root.innerHTML = '<div id="id">content</div>';
            deserializer.initWithObject({
                root: {
                    value: {
                        "element": {"#": "id"}
                    }
                }
            });

            for (var i = 0; i < 3; i++) {
                deserializer.deserializeObjectWithElement(root, function(object) {
                    expect(object.element instanceof Element).toBe(true);
                    expect(object.element.textContent).toBe("content");
                });
            }
        });

        it("should deserialize an element reference through data-montage-id", function() {
            root.innerHTML = '<div data-montage-id="id">content</div>';
            deserializer.initWithObject({
                root: {
                    value: {
                        "element": {"#": "id"}
                    }
                }
            });

            for (var i = 0; i < 3; i++) {
                deserializer.deserializeObjectWithElement(root, function(object) {
                    expect(object.element instanceof Element).toBe(true);
                    expect(object.element.textContent).toBe("content");
                });
            }
        });

        it("should deserialize an element reference through data-montage-id over id", function() {
            root.innerHTML = '<div id="id">content1</div>' +
                             '<div data-montage-id="id">content2</div>';
            deserializer.initWithObject({
                root: {
                    value: {
                        "element": {"#": "id"}
                    }
                }
            });

            for (var i = 0; i < 3; i++) {
                deserializer.deserializeObjectWithElement(root, function(object) {
                    expect(object.element instanceof Element).toBe(true);
                    expect(object.element.textContent).toBe("content2");
                });
            }
        });

        it("should deserialize an element with id and data-montage-id", function() {
            root.innerHTML = '<div id="realId" data-montage-id="id">content</div>';
            deserializer.initWithObject({
                root: {
                    value: {
                        "element": {"#": "id"}
                    }
                }
            });

            for (var i = 0; i < 3; i++) {
                deserializer.deserializeObjectWithElement(root, function(object) {
                    expect(object.element instanceof Element).toBe(true);
                    expect(object.element.textContent).toBe("content");
                });
            }
        });

        it("should deserialize an element with the same id and data-montage-id", function() {
            root.innerHTML = '<div id="id" data-montage-id="id">content</div>';
            deserializer.initWithObject({
                root: {
                    value: {
                        "element": {"#": "id"}
                    }
                }
            });

            for (var i = 0; i < 3; i++) {
                deserializer.deserializeObjectWithElement(root, function(object) {
                    expect(object.element instanceof Element).toBe(true);
                    expect(object.element.textContent).toBe("content");
                });
            }
        });

        it("should deserialize an element reference through id w/ optimization", function() {
            root.innerHTML = '<div id="id">content</div>';
            deserializer.initWithObject({
                root: {
                    value: {
                        "element": {"#": "id"}
                    }
                }
            });
            deserializer.optimizeForDocument(root);

            for (var i = 0; i < 3; i++) {
                deserializer.deserializeObjectWithElement(root, function(object) {
                    expect(object.element instanceof Element).toBe(true);
                    expect(object.element.textContent).toBe("content");
                    expect(object.element.getAttribute("id")).toBe("id");
                });
            }
        });

        it("should deserialize an element reference through data-montage-id w/ optimization", function() {
            root.innerHTML = '<div data-montage-id="id">content</div>';
            deserializer.initWithObject({
                root: {
                    value: {
                        "element": {"#": "id"}
                    }
                }
            });
            deserializer.optimizeForDocument(root);

            for (var i = 0; i < 3; i++) {
                deserializer.deserializeObjectWithElement(root, function(object) {
                    expect(object.element instanceof Element).toBe(true);
                    expect(object.element.textContent).toBe("content");
                    expect(object.element.getAttribute("id")).toBeNull();
                });
            }
        });

        it("should deserialize an element reference through data-montage-id over id w/ optimization", function() {
            root.innerHTML = '<div id="id">content1</div>' +
                             '<div data-montage-id="id">content2</div>';
            deserializer.initWithObject({
                root: {
                    value: {
                        "element": {"#": "id"}
                    }
                }
            });
            deserializer.optimizeForDocument(root);

            for (var i = 0; i < 3; i++) {
                deserializer.deserializeObjectWithElement(root, function(object) {
                    expect(object.element instanceof Element).toBe(true);
                    expect(object.element.textContent).toBe("content2");
                    expect(object.element.getAttribute("id")).toBeNull();
                });
            }
        });

        it("should deserialize an element with id and data-montage-id w/ optimization", function() {
            root.innerHTML = '<div id="realId" data-montage-id="id">content</div>';
            deserializer.initWithObject({
                root: {
                    value: {
                        "element": {"#": "id"}
                    }
                }
            });
            deserializer.optimizeForDocument(root);

            for (var i = 0; i < 3; i++) {
                deserializer.deserializeObjectWithElement(root, function(object) {
                    expect(object.element instanceof Element).toBe(true);
                    expect(object.element.textContent).toBe("content");
                    expect(object.element.getAttribute("id")).toBe("realId");
                });
            }
        });

        it("should deserialize an element with the same id and data-montage-id w/ optimization", function() {
            root.innerHTML = '<div id="id" data-montage-id="id">content</div>';
            deserializer.initWithObject({
                root: {
                    value: {
                        "element": {"#": "id"}
                    }
                }
            });
            deserializer.optimizeForDocument(root);

            for (var i = 0; i < 3; i++) {
                deserializer.deserializeObjectWithElement(root, function(object) {
                    expect(object.element instanceof Element).toBe(true);
                    expect(object.element.textContent).toBe("content");
                    expect(object.element.getAttribute("id")).toBe("id");
                });
            }
        });
    })
});
