/* <copyright>
Copyright (c) 2012, Motorola Mobility LLC.
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of Motorola Mobility LLC nor the names of its
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    logger = require("montage/core/logger").logger("deserializer-spec"),
    Deserializer = require("montage/core/deserializer").Deserializer,
    deserialize = require("montage/core/deserializer").deserialize,
    defaultEventManager = require("montage/core/event/event-manager").defaultEventManager,
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
                },
                simple: {}
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

         it("should call deserializedFromSerialization function on the instantiated objects even if they were given as null instances", function() {
                var latch;
                var instances = {root: null};
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
                    expect(exports.root.deserializedFromSerializationCount).toBe(1);
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

        it("should have isDeserializing set to true during units deserialization", function() {
            var object, isDeserializing;

            Deserializer.defineDeserializationUnit("spec", function(object) {
                isDeserializing = object.isDeserializing;
            });

            deserializer.initWithObject({
                root: {
                    prototype: "serialization/testobjects-v2[OneProp]",
                    properties: {
                        prop: 42
                    },
                    spec: {}
                }
            }).deserializeObject(function(obj) {
                latch = true;
                object = obj;
            });

            waitsFor(function() { return latch; });
            runs(function() {
                expect(isDeserializing).toBeTruthy();
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

                expect(info.moduleId).toBe("serialization/module-name.reel");
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
    });

    describe("Custom deserialization", function() {
        var customDeserialization = objects.CustomDeserialization,
            serialization = {
                root: {
                    prototype: "serialization/testobjects-v2[CustomDeserialization]",
                    properties: {
                        prop1: 15
                    },
                    bindings: {
                        prop2: {
                            boundObject: {"@": "oneprop"},
                            boundObjectPropertyPath: "prop",
                            oneway: true
                        }
                    },
                    listeners: [{
                        type: "action",
                        listener: {"@": "oneprop"}
                    }]
                },

                oneprop: {
                    prototype: "serialization/testobjects-v2[OneProp]",
                    properties: {
                        prop: 42
                    }
                }
            };

        it("should only create the object", function() {
            var latch, object;

            customDeserialization.deserializeSelf = function(deserializer) {

            };

            deserializer.initWithObject(serialization)
                        .deserializeObject(function(obj) {
                latch = true;
                object = obj;
            });

            waitsFor(function() { return latch; });
            runs(function() {
                expect(object.prop1).toBeNull();
                if (defaultEventManager.registeredEventListeners.action) {
                    expect(object.uuid in defaultEventManager.registeredEventListeners.action).toBeFalsy();
                }
                expect(object._bindingDescriptors).toBeFalsy();
            })
        });

        it("should report prototype type", function() {
            var latch, type, typeValue;

            customDeserialization.deserializeSelf = function(deserializer) {
                type = deserializer.getType();
                typeValue = deserializer.getTypeValue();
            }
            deserializer.initWithObject(serialization)
                        .deserializeObject(function(obj) {
                latch = true;
            });

            waitsFor(function() { return latch; });
            runs(function() {
                expect(type).toBe("prototype");
                expect(typeValue).toBe("serialization/testobjects-v2[CustomDeserialization]");
            });
        });

        it("should report object type", function() {
            var latch, type, typeValue;

            customDeserialization.deserializeSelf = function(deserializer) {
                type = deserializer.getType();
                typeValue = deserializer.getTypeValue();
            }
            deserializer.initWithObject({
                root: {
                    "object": "serialization/testobjects-v2[CustomDeserialization]"
                }
            }).deserializeObject(function(obj) {
                latch = true;
            });

            waitsFor(function() { return latch; });
            runs(function() {
                expect(type).toBe("object");
                expect(typeValue).toBe("serialization/testobjects-v2[CustomDeserialization]");
            });
        });

        it("should access properties", function() {
            var latch, prop1;

            customDeserialization.deserializeSelf = function(deserializer) {
                prop1 = deserializer.getProperty("prop1");
            }
            deserializer.initWithObject(serialization)
                        .deserializeObject(function(obj) {
                latch = true;
            });

            waitsFor(function() { return latch; });
            runs(function() {
                expect(prop1).toBe(15);
            });
        });

        it("should only deserialize properties", function() {
            var latch, object;

            customDeserialization.deserializeSelf = function(deserializer) {
                deserializer.deserializeProperties();
            }
            deserializer.initWithObject(serialization)
                        .deserializeObject(function(obj) {
                latch = true;
                object = obj;
            });

            waitsFor(function() { return latch; });
            runs(function() {
                expect(object.prop1).toBe(15);
                if (defaultEventManager.registeredEventListeners.action) {
                    expect(object.uuid in defaultEventManager.registeredEventListeners.action).toBeFalsy();
                }
                expect(object._bindingDescriptors).toBeFalsy();
            });
        });

        it("should deserialize properties and listeners", function() {
            var latch, object;

            customDeserialization.deserializeSelf = function(deserializer) {
                deserializer.deserializeProperties();
                deserializer.deserializeUnit("listeners");
            }
            deserializer.initWithObject(serialization)
                        .deserializeObject(function(obj) {
                latch = true;
                object = obj;
            });

            waitsFor(function() { return latch; });
            runs(function() {
                expect(object.prop1).toBe(15);
                expect(defaultEventManager.registeredEventListeners.action).toBeDefined();
                expect(object.uuid in defaultEventManager.registeredEventListeners.action).toBeTruthy();
                expect(object._bindingDescriptors).toBeFalsy();
            });
        });

        it("should deserialize properties and bindings", function() {
            var latch, object;

            customDeserialization.deserializeSelf = function(deserializer) {
                deserializer.deserializeProperties();
                deserializer.deserializeUnit("bindings");
            }
            deserializer.initWithObject(serialization)
                        .deserializeObject(function(obj) {
                latch = true;
                object = obj;
            });

            waitsFor(function() { return latch; });
            runs(function() {
                expect(object.prop1).toBe(15);
                if (defaultEventManager.registeredEventListeners.action) {
                    expect(object.uuid in defaultEventManager.registeredEventListeners.action).toBeFalsy();
                }
                expect(object._bindingDescriptors).toBeTruthy();
            });
        });

        it("should deserialize properties and all units", function() {
            var latch, object;

            customDeserialization.deserializeSelf = function(deserializer) {
                deserializer.deserializeProperties();
                deserializer.deserializeUnits();
            }
            deserializer.initWithObject(serialization)
                        .deserializeObject(function(obj) {
                latch = true;
                object = obj;
            });

            waitsFor(function() { return latch; });
            runs(function() {
                expect(object.prop1).toBe(15);
                expect(defaultEventManager.registeredEventListeners.action).toBeDefined();
                expect(object.uuid in defaultEventManager.registeredEventListeners.action).toBeTruthy();
                expect(object._bindingDescriptors).toBeTruthy();
            });
        });
    });
});
