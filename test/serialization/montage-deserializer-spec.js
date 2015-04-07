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
    Deserializer = require("montage/core/serialization").Deserializer,
    Alias = require("montage/core/serialization/alias").Alias,
    Bindings = require("montage/frb"),
    defaultEventManager = require("montage/core/event/event-manager").defaultEventManager,
    Promise = require("montage/core/promise").Promise,
    objects = require("serialization/testobjects-v2").objects;

logger.isError = true;

describe("serialization/montage-deserializer-spec", function () {
    var deserializer;

    beforeEach(function () {
        deserializer = new Deserializer();
    });

    describe("Montage Objects Deserialization", function () {
        it("should deserialize a class instance object", function () {
            var serialization = {
                    "root": {
                        "prototype": "montage",
                        "properties": {
                            "number": 42,
                            "string": "a string"
                        }
                    }
                },
                serializationString = JSON.stringify(serialization);

            deserializer.init(
                serializationString, require);

            return deserializer.deserializeObject().then(function (root) {
                expect(Object.getPrototypeOf(root)).toBe(Montage.prototype);
                expect(root.number).toBe(42);
                expect(root.string).toBe("a string");
            }).catch(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            });
        });

        it("should deserialize two class instance objects", function () {
            var serialization = {
                    "root": {
                        "prototype": "montage",
                        "properties": {
                            "oneprop": {"@": "oneprop"}
                        }
                    },

                    "oneprop": {
                        "prototype": "montage",
                        "properties": {
                            "prop": 42
                        }
                    }
                },
                serializationString = JSON.stringify(serialization);

            deserializer.init(serializationString, require);

            return deserializer.deserializeObject().then(function (root) {
                expect(root.oneprop.prop).toBe(42);
            });
        });

        it("should deserialize an external object with a label", function () {
            var serialization = {
                    "root": {
                        "prototype": "montage",
                        "properties": {
                            "simple": {"@": "simple"}
                        }
                    },

                    "simple": {}
                },
                serializationString = JSON.stringify(serialization),
                simple = {},
                instances = {
                    simple: simple
                };

            deserializer.init(
                serializationString, require);

            return deserializer.deserializeObject(instances)
            .then(function (root) {
                expect(root.simple).toBe(simple);
            }).catch(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            });
        });

        it("should deserialize an object as another by providing an instance", function () {
            var serialization = {
                    "root": {
                        "prototype": "montage",
                        "properties": {
                            "simple": {"@": "simple"}
                        }
                    },

                    "simple": {
                        "prototype": "serialization/testobjects-v2[Simple]"
                    }
                },
                serializationString = JSON.stringify(serialization),
                simple = {},
                instances = {
                    simple: simple
                };

            deserializer.init(
                serializationString, require);

            return deserializer.deserializeObject(instances)
            .then(function (root) {
                expect(root.simple).toBe(simple);
            }).catch(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            });
        });

        it("should deserialize to a different object", function () {
            var serialization = {
                    "root": {
                        "prototype": "serialization/testobjects-v2[Singleton]",
                        "properties": {
                            "number": 42
                        }
                    }
                },
                serializationString = JSON.stringify(serialization);

            deserializer.init(
                serializationString, require);

            return deserializer.deserializeObject()
            .then(function (root) {
                expect(root).toBe(objects.Singleton.instance);
            }).catch(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            });
        });

        it("should deserialize an object's properties when an instance is given for that object", function () {
            var serialization = {
                    "root": {
                        "prototype": "montage",
                        "properties": {
                            "number": 42
                        }
                    }
                },
                serializationString = JSON.stringify(serialization),
                root = {},
                instances = {
                    root: root
                };

            deserializer.init(
                serializationString, require);

            return deserializer.deserializeObject(instances)
            .then(function (root) {
                expect(root).toBe(instances.root);
                expect(instances.root.number).toBe(42);
            }).catch(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            });
        });

        it("should deserialize an object's properties when an instance is given for that object even when the serialization doesn't have a prototype or object property", function () {
            var serialization = {
                    "owner": {
                        "properties": {
                            "number": 42
                        }
                    }
                },
                serializationString = JSON.stringify(serialization),
                owner = {},
                instances = {
                    owner: owner
                };

            deserializer.init(
                serializationString, require);

            return deserializer.deserialize(instances)
            .then(function (objects) {
                expect(objects.owner).toBe(instances.owner);
                expect(instances.owner.number).toBe(42);
            }).catch(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            });
        });

        it("should call deserializedFromSerialization function on the instantiated objects", function () {
            var serialization = {
                    "root": {
                        "prototype": "serialization/testobjects-v2[OneProp]",
                        "properties": {
                            "prop": {"@": "oneprop"}
                        }
                    },
                    "oneprop": {
                        "prototype": "serialization/testobjects-v2[OneProp]"
                    }
                },
                serializationString = JSON.stringify(serialization),
                instances = {
                    root: new objects.OneProp()
                };

            deserializer.init(
                serializationString, require);

            return deserializer.deserialize(instances)
            .then(function (object) {
                var root = object.root,
                    oneprop = object.oneprop;

                expect(root.deserializedFromSerializationCount).toBe(0);
                expect(oneprop.deserializedFromSerializationCount).toBe(1);
            }).catch(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            });
        });

        //it("should call deserializedFromSerialization function on the instantiated objects even if they were given as null instances", function () {
        //    var latch;
        //    var instances = {root: null};
        //    var exports;
        //
        //    deserializer.initWithObject({
        //        root: {
        //            module: "serialization/testobjects-v2",
        //            name: "OneProp",
        //            properties: {
        //                prop: {"@": "oneprop"}
        //            }
        //        },
        //        oneprop: {
        //            module: "serialization/testobjects-v2",
        //            name: "OneProp"
        //        }
        //    }).deserializeWithInstances(instances, function (objs) {
        //        latch = true;
        //        exports = objs;
        //    });
        //
        //    waitsFor(function () { return latch; });
        //    runs(function () {
        //        expect(exports.root.deserializedFromSerializationCount).toBe(1);
        //    })
        //});

        it("should have isDeserializing set to true during units deserialization", function () {
            var serialization = {
                    "root": {
                        "prototype": "serialization/testobjects-v2[OneProp]",
                        "properties": {
                            "prop": 42
                        },
                        "spec": {}
                    }
                },
                serializationString = JSON.stringify(serialization),
                isDeserializing;

            deserializer.init(
                serializationString, require);

            Deserializer.defineDeserializationUnit("spec", function (deserializer, object) {
                isDeserializing = object.isDeserializing;
            });

            return deserializer.deserialize()
            .then(function (objects) {
                expect(isDeserializing).toBeTruthy();
                expect(objects.root.isDeserializing).toBeUndefined();
            }).catch(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            });
        });
    });

    describe("Alias deserialization", function () {
        it("should deserialize an alias", function () {
            var serialization = {
                    ":templateProperty": {
                        "alias": "@component:propertyName"
                    }
                },
                serializationString = JSON.stringify(serialization);

            deserializer.init(serializationString, require);

            return deserializer.deserialize().then(function (objects) {
                var alias = objects[":templateProperty"];

                expect(Object.getPrototypeOf(alias)).toBe(Alias.prototype);
                expect(alias.value).toBe("@component:propertyName");
                expect(alias.componentLabel).toBe("component");
                expect(alias.propertyName).toBe("propertyName");
            });
        });
    });

    describe("Template properties deserialization", function () {
        it("should deserialize a template property as an alias", function () {
            var serialization = {
                    ":templateProperty": {
                        "alias": "@component:propertyName"
                    }
                },
                serializationString = JSON.stringify(serialization);

            deserializer.init(serializationString, require);

            return deserializer.deserialize()
            .then(function () {
                // promise needs to return undefined
            });
        });

        it("should not deserialize a template property as an external object", function () {
            var serialization = {
                    ":templateProperty": {}
                },
                serializationString = JSON.stringify(serialization);

            deserializer.init(serializationString, require);

            return deserializer.deserialize()
            .then(function () {
                expect("deserialization").toBe("failed");
            },function() {
                // it should fail
                console.log("fail");
            });
        });

        it("should not deserialize a montage object as a template property", function () {
            var serialization = {
                    ":templateProperty": {
                        "prototype": "montage/ui/component"
                    }
                },
                serializationString = JSON.stringify(serialization);

            deserializer.init(serializationString, require);

            return deserializer.deserialize()
            .then(function () {
                expect("deserialization").toBe("failed");
            }).catch(function() {
                // it should fail
            });
        });

        it("should not deserialize a value as a template property", function () {
            var serialization = {
                    ":templateProperty": {
                        "value": 42
                    }
                },
                serializationString = JSON.stringify(serialization);

            deserializer.init(serializationString, require);

            return deserializer.deserialize()
            .then(function () {
                expect("deserialization").toBe("failed");
            }).catch(function() {
                // it should fail
            });
        });

        it("should not deserialize a regexp as a template property", function () {
            var serialization = {
                    ":templateProperty": {
                        "/": {"source": "regexp"}
                    }
                },
                serializationString = JSON.stringify(serialization);

            deserializer.init(serializationString, require);

            return deserializer.deserialize()
            .then(function () {
                expect("deserialization").toBe("failed");
            }).catch(function() {
                // it should fail
            });
        });

        it("should not deserialize a literal object as a template property", function () {
            var serialization = {
                    ":templateProperty": {
                        "value": {}
                    }
                },
                serializationString = JSON.stringify(serialization);

            deserializer.init(serializationString, require);

            return deserializer.deserialize()
            .then(function () {
                expect("deserialization").toBe("failed");
            }).catch(function() {
                // it should fail
            });
        });
    });

    describe("Object Location", function () {
        it("should deserialize using prototype: module[name]", function () {
            var serialization = {
                    "root": {
                        "prototype": "serialization/testobjects-v2[TestobjectsV2]",
                        "properties": {
                            "number": 42,
                            "string": "a string"
                        }
                    }
                },
                serializationString = JSON.stringify(serialization);

            deserializer.init(
                serializationString, require);

            return deserializer.deserializeObject()
            .then(function (root) {
                var info = Montage.getInfoForObject(root);

                expect(Object.getPrototypeOf(root)).toBe(objects.TestobjectsV2.prototype);
                expect(root.instance).toBeUndefined();
            }).catch(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            });
        });

        it("should deserialize using prototype: module", function () {
            var serialization = {
                    "root": {
                        "prototype": "serialization/testobjects-v2",
                        "properties": {
                            "number": 42,
                            "string": "a string"
                        }
                    }
                },
                serializationString = JSON.stringify(serialization);

            deserializer.init(
                serializationString, require);

            return deserializer.deserializeObject()
            .then(function (root) {
                var info = Montage.getInfoForObject(root);

                expect(Object.getPrototypeOf(root)).toBe(objects.TestobjectsV2.prototype);

                expect(info.moduleId).toBe("serialization/testobjects-v2");
                expect(info.objectName).toBe("TestobjectsV2");
                expect(info.isInstance).toBe(true);
                expect(root.instance).toBeUndefined();
            }).catch(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            });
        });

        it("should deserialize using prototype: module-name.reel", function () {
            var serialization = {
                    "root": {
                        "prototype": "serialization/module-name.reel",
                        "properties": {
                            "number": 42,
                            "string": "a string"
                        }
                    }
                },
                serializationString = JSON.stringify(serialization);

            deserializer.init(
                serializationString, require);

            return deserializer.deserializeObject()
            .then(function (root) {
                var info = Montage.getInfoForObject(root);

                expect(info.moduleId).toBe("serialization/module-name.reel");
                expect(info.objectName).toBe("ModuleName");
                expect(info.isInstance).toBe(true);
            }).catch(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            });
        });

        it("should deserialize using object: module[name]", function () {
            var serialization = {
                    "root": {
                        "object": "serialization/testobjects-v2[TestobjectsV2]",
                        "properties": {
                            "number": 42,
                            "string": "a string"
                        }
                    }
                },
                serializationString = JSON.stringify(serialization);

            deserializer.init(
                serializationString, require);

            return deserializer.deserializeObject()
            .then(function (root) {
                var info = Montage.getInfoForObject(root);

                expect(root).toBe(objects.TestobjectsV2);
                expect(info.moduleId).toBe("serialization/testobjects-v2");
                expect(info.objectName).toBe("TestobjectsV2");
                expect(info.isInstance).toBe(false);
                expect(root.type).toBeUndefined();
            }).catch(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            });
        });

        it("should deserialize using object: module", function () {
            var serialization = {
                    "root": {
                        "object": "serialization/testobjects-v2",
                        "properties": {
                            "number": 42,
                            "string": "a string"
                        }
                    }
                },
                serializationString = JSON.stringify(serialization);

            deserializer.init(
                serializationString, require);

            return deserializer.deserializeObject()
            .then(function (root) {
                var info = Montage.getInfoForObject(root);

                expect(root).toBe(objects.TestobjectsV2);
                expect(info.moduleId).toBe("serialization/testobjects-v2");
                expect(info.objectName).toBe("TestobjectsV2");
                expect(info.isInstance).toBe(false);
                expect(root.type).toBeUndefined();
            }).catch(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            });
        });

        //it("should deserialize using instance after compilation", function () {
        //    var latch, objects;
        //
        //    deserializer.initWithObjectAndRequire({
        //        root: {
        //            prototype: "montage",
        //            properties: {
        //                number: 15,
        //                string: "string"
        //            }
        //        }
        //    }, require).deserialize(function () {
        //        deserializer.deserialize(function (objs) {
        //            latch = true;
        //            objects = objs;
        //        });
        //    });
        //
        //    waitsFor(function () { return latch; });
        //    runs(function () {
        //        var root = objects.root,
        //            info = Montage.getInfoForObject(root);
        //
        //        expect(Montage.isPrototypeOf(root));
        //        expect(info.moduleId).toBe("core/core");
        //        expect(info.objectName).toBe("Montage");
        //        expect(info.isInstance).toBe(true);
        //    });
        //});

        //it("should deserialize using type after compilation", function () {
        //    var latch, objects;
        //
        //    deserializer.initWithObjectAndRequire({
        //        root: {
        //            object: "montage",
        //            properties: {
        //                number: 15,
        //                string: "string"
        //            }
        //        }
        //    }, require).deserialize(function () {
        //        deserializer.deserialize(function (objs) {
        //            latch = true;
        //            objects = objs;
        //        });
        //    });
        //
        //    waitsFor(function () { return latch; });
        //    runs(function () {
        //        var root = objects.root,
        //            info = Montage.getInfoForObject(root);
        //
        //        expect(root).toBe(Montage);
        //        expect(info.moduleId).toBe("core/core");
        //        expect(info.objectName).toBe("Montage");
        //        expect(info.isInstance).toBe(false);
        //    })
        //});
    });

    describe("Element Reference Deserialization", function () {
        var element = document.createElement("div");

        it("should deserialize an element reference", function () {
            var serialization = {
                    "root": {
                        "value": {"#": "id"}
                    }
                },
                serializationString = JSON.stringify(serialization);

            element.innerHTML = '<div data-montage-id="id">content</div>';
            deserializer.init(
                serializationString, require);

            return deserializer.deserialize(null, element)
            .then(function (objects) {
                expect(objects.root instanceof Element).toBe(true);
                expect(objects.root.textContent).toBe("content");
            });

            //for (var i = 0; i < 3; i++) {
            //    deserializer.deserializeObjectWithElement(root, function (object) {
            //        expect(object.element instanceof Element).toBe(true);
            //        expect(object.element.textContent).toBe("content");
            //    });
            //}
        });

        //it("should deserialize an element reference through data-montage-id over id", function () {
        //    root.innerHTML = '<div id="id">content1</div>' +
        //                     '<div data-montage-id="id">content2</div>';
        //    deserializer.initWithObject({
        //        root: {
        //            value: {
        //                "element": {"#": "id"}
        //            }
        //        }
        //    });
        //
        //    for (var i = 0; i < 3; i++) {
        //        deserializer.deserializeObjectWithElement(root, function (object) {
        //            expect(object.element instanceof Element).toBe(true);
        //            expect(object.element.textContent).toBe("content2");
        //        });
        //    }
        //});

        //it("should deserialize an element with id and data-montage-id", function () {
        //    root.innerHTML = '<div id="realId" data-montage-id="id">content</div>';
        //    deserializer.initWithObject({
        //        root: {
        //            value: {
        //                "element": {"#": "id"}
        //            }
        //        }
        //    });
        //
        //    for (var i = 0; i < 3; i++) {
        //        deserializer.deserializeObjectWithElement(root, function (object) {
        //            expect(object.element instanceof Element).toBe(true);
        //            expect(object.element.textContent).toBe("content");
        //        });
        //    }
        //});

        //it("should deserialize an element with the same id and data-montage-id", function () {
        //    root.innerHTML = '<div id="id" data-montage-id="id">content</div>';
        //    deserializer.initWithObject({
        //        root: {
        //            value: {
        //                "element": {"#": "id"}
        //            }
        //        }
        //    });
        //
        //    for (var i = 0; i < 3; i++) {
        //        deserializer.deserializeObjectWithElement(root, function (object) {
        //            expect(object.element instanceof Element).toBe(true);
        //            expect(object.element.textContent).toBe("content");
        //        });
        //    }
        //});

        //it("should deserialize an element reference through id w/ optimization", function () {
        //    root.innerHTML = '<div id="id">content</div>';
        //    deserializer.initWithObject({
        //        root: {
        //            value: {
        //                "element": {"#": "id"}
        //            }
        //        }
        //    });
        //    deserializer.optimizeForDocument(root);
        //
        //    for (var i = 0; i < 3; i++) {
        //        deserializer.deserializeObjectWithElement(root, function (object) {
        //            expect(object.element instanceof Element).toBe(true);
        //            expect(object.element.textContent).toBe("content");
        //            expect(object.element.getAttribute("id")).toBe("id");
        //        });
        //    }
        //});

        //it("should deserialize an element reference through data-montage-id w/ optimization", function () {
        //    root.innerHTML = '<div data-montage-id="id">content</div>';
        //    deserializer.initWithObject({
        //        root: {
        //            value: {
        //                "element": {"#": "id"}
        //            }
        //        }
        //    });
        //    deserializer.optimizeForDocument(root);
        //
        //    for (var i = 0; i < 3; i++) {
        //        deserializer.deserializeObjectWithElement(root, function (object) {
        //            expect(object.element instanceof Element).toBe(true);
        //            expect(object.element.textContent).toBe("content");
        //            expect(object.element.getAttribute("id")).toBeNull();
        //        });
        //    }
        //});

        //it("should deserialize an element reference through data-montage-id over id w/ optimization", function () {
        //    root.innerHTML = '<div id="id">content1</div>' +
        //                     '<div data-montage-id="id">content2</div>';
        //    deserializer.initWithObject({
        //        root: {
        //            value: {
        //                "element": {"#": "id"}
        //            }
        //        }
        //    });
        //    deserializer.optimizeForDocument(root);
        //
        //    for (var i = 0; i < 3; i++) {
        //        deserializer.deserializeObjectWithElement(root, function (object) {
        //            expect(object.element instanceof Element).toBe(true);
        //            expect(object.element.textContent).toBe("content2");
        //            expect(object.element.getAttribute("id")).toBeNull();
        //        });
        //    }
        //});

        //it("should deserialize an element with id and data-montage-id w/ optimization", function () {
        //    root.innerHTML = '<div id="realId" data-montage-id="id">content</div>';
        //    deserializer.initWithObject({
        //        root: {
        //            value: {
        //                "element": {"#": "id"}
        //            }
        //        }
        //    });
        //    deserializer.optimizeForDocument(root);
        //
        //    for (var i = 0; i < 3; i++) {
        //        deserializer.deserializeObjectWithElement(root, function (object) {
        //            expect(object.element instanceof Element).toBe(true);
        //            expect(object.element.textContent).toBe("content");
        //            expect(object.element.getAttribute("id")).toBe("realId");
        //        });
        //    }
        //});

        //it("should deserialize an element with the same id and data-montage-id w/ optimization", function () {
        //    root.innerHTML = '<div id="id" data-montage-id="id">content</div>';
        //    deserializer.initWithObject({
        //        root: {
        //            value: {
        //                "element": {"#": "id"}
        //            }
        //        }
        //    });
        //    deserializer.optimizeForDocument(root);
        //
        //    for (var i = 0; i < 3; i++) {
        //        deserializer.deserializeObjectWithElement(root, function (object) {
        //            expect(object.element instanceof Element).toBe(true);
        //            expect(object.element.textContent).toBe("content");
        //            expect(object.element.getAttribute("id")).toBe("id");
        //        });
        //    }
        //});
    });

    describe("Module reference deserialization", function () {
        it("should deserialize a module", function () {
            var serialization = {
                    "root": {
                        "value": {"%": "./testobjects-v2"}
                    }
                },
                serializationString = JSON.stringify(serialization);

            deserializer.init(
                serializationString, require);

            return deserializer.deserializeObject()
            .then(function (root) {
                // module is now absolute from the root of the test package
                expect(root.id).toBe("serialization/testobjects-v2");
                expect(root.require.location).toBe(require.location);
            });
        });

        it("should use the require of the package the deserializer is using", function () {
            return require.loadPackage("package-a").then(function (pkg1) {
                var serialization = {
                        "root": {
                            "value": {"%": "pass"}
                        }
                    },
                    serializationString = JSON.stringify(serialization);

                deserializer.init(
                    serializationString, pkg1);

                return deserializer.deserializeObject()
                .then(function (root) {
                    expect(root.id).toBe("pass");
                    expect(root.require.location).toBe(pkg1.location);
                });
            });
        });
    });

    describe("Custom deserialization", function () {
        var customDeserialization = objects.CustomDeserialization,
            serialization = {
                "root": {
                    "prototype": "serialization/testobjects-v2[CustomDeserialization]",
                    "properties": {
                        "prop1": 3.14
                    },
                    "bindings": {
                        "prop2": {"<-": "@oneprop.prop"}
                    },
                    "listeners": [{
                        "type": "action",
                        "listener": {"@": "oneprop"}
                    }]
                },

                "oneprop": {
                    "prototype": "serialization/testobjects-v2[OneProp]",
                    "properties": {
                        "prop": 42
                    }
                }
            };

        it("should only create the object", function () {
            var serializationString = JSON.stringify(serialization);

            deserializer.init(
                serializationString, require);

            customDeserialization.prototype.deserializeSelf = function (deserializer) {

            };

            return deserializer.deserializeObject()
            .then(function (root) {
                expect(root.prop1).toBeNull();
                if (defaultEventManager.registeredEventListeners.action) {
                    expect(root.uuid in defaultEventManager.registeredEventListeners.action).toBeFalsy();
                }
                expect(root._bindingDescriptors).toBeFalsy();
            }).catch(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            });
        });

        it("should report prototype type", function () {
            var serializationString = JSON.stringify(serialization),
                type,
                typeValue;

            deserializer.init(
                serializationString, require);

            customDeserialization.prototype.deserializeSelf = function (deserializer) {
                type = deserializer.getType();
                typeValue = deserializer.getTypeValue();
            };

            return deserializer.deserializeObject()
            .then(function (root) {
                expect(type).toBe("prototype");
                expect(typeValue).toBe("serialization/testobjects-v2[CustomDeserialization]");
            }).catch(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            });
        });

        it("should report object type", function () {
            var serialization = {
                    "root": {
                        "object": "serialization/testobjects-v2[CustomDeserialization]"
                    }
                },
                serializationString = JSON.stringify(serialization),
                type,
                typeValue;

            deserializer.init(
                serializationString, require);

            customDeserialization.deserializeSelf = function (deserializer) {
                type = deserializer.getType();
                typeValue = deserializer.getTypeValue();
            };

            return deserializer.deserializeObject()
            .then(function (root) {
                expect(type).toBe("object");
                expect(typeValue).toBe("serialization/testobjects-v2[CustomDeserialization]");
            }).catch(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            });
        });

        it("should access properties", function () {
            var serializationString = JSON.stringify(serialization),
                prop1;

            deserializer.init(
                serializationString, require);

            customDeserialization.prototype.deserializeSelf = function (deserializer) {
                prop1 = deserializer.getProperty("prop1");
            };

            return deserializer.deserializeObject()
            .then(function (root) {
                expect(prop1).toBe(3.14);
            }).catch(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            });
        });

        it("should only deserialize properties", function () {
            var serializationString = JSON.stringify(serialization);

            deserializer.init(
                serializationString, require);

            customDeserialization.prototype.deserializeSelf = function (deserializer) {
                deserializer.deserializeProperties();
            };

            return deserializer.deserializeObject()
            .then(function (root) {
                expect(root.prop1).toBe(3.14);
                if (defaultEventManager.registeredEventListeners.action) {
                    expect(root.uuid in defaultEventManager.registeredEventListeners.action).toBeFalsy();
                }
                expect(root._bindingDescriptors).toBeFalsy();
            }).catch(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            });
        });

        it("should deserialize properties and listeners", function () {
            var serializationString = JSON.stringify(serialization);

            deserializer.init(
                serializationString, require);

            customDeserialization.prototype.deserializeSelf = function (deserializer) {
                deserializer.deserializeProperties();
                deserializer.deserializeUnit("listeners");
            };

            return deserializer.deserializeObject()
            .then(function (root) {
                expect(root.prop1).toBe(3.14);
                expect(defaultEventManager.registeredEventListeners.action).toBeDefined();
                expect(root.uuid in defaultEventManager.registeredEventListeners.action).toBeTruthy();
                expect(root._bindingDescriptors).toBeFalsy();
            }).catch(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            });
        });

        it("should deserialize properties and bindings", function () {
            var serializationString = JSON.stringify(serialization);

            deserializer.init(
                serializationString, require);

            customDeserialization.prototype.deserializeSelf = function (deserializer) {
                deserializer.deserializeProperties();
                deserializer.deserializeUnit("bindings");
            };

            return deserializer.deserializeObject()
            .then(function (root) {
                expect(root.prop1).toBe(3.14);
                if (defaultEventManager.registeredEventListeners.action) {
                    expect(root.uuid in defaultEventManager.registeredEventListeners.action).toBeFalsy();
                }

                expect(Object.keys(Bindings.getBindings(root)).length).toBeGreaterThan(0);
            }).catch(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            });
        });

        it("should deserialize properties and all units", function () {
            var serializationString = JSON.stringify(serialization);

            deserializer.init(
                serializationString, require);

            customDeserialization.prototype.deserializeSelf = function (deserializer) {
                deserializer.deserializeProperties();
                deserializer.deserializeUnits();
            };

            return deserializer.deserializeObject()
            .then(function (root) {
                expect(root.prop1).toBe(3.14);
                expect(defaultEventManager.registeredEventListeners.action).toBeDefined();
                expect(root.uuid in defaultEventManager.registeredEventListeners.action).toBeTruthy();
                expect(Object.keys(Bindings.getBindings(root)).length).toBeGreaterThan(0);
            }).catch(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            });
        });

        it("should deserialize into another object in an asynchronous way", function () {
            var serializationString = JSON.stringify(serialization),
                newRoot = {};

            deserializer.init(serializationString, require);

            customDeserialization.prototype.deserializeSelf = function (deserializer) {
                return Promise.resolve(newRoot);
            };

            return deserializer.deserializeObject()
                .then(function (root) {
                    expect(root).toBe(newRoot);
                }).catch(function(reason) {
                    console.log(reason.stack);
                    expect("test").toBe("executed");
                });
        });
    });

    it("should load the correct module even if it's from a diferent package but with the same name", function () {
        var deserializer1 = new Deserializer(),
            deserializer2 = new Deserializer(),
            serialization = {
                root: {
                    prototype: "ui/main.reel"
                }
            },
            serializationString = JSON.stringify(serialization);

        return require.loadPackage("package-a").then(function (pkg1) {
            return require.loadPackage("package-b").then(function (pkg2) {
                return deserializer1.init(serializationString, pkg1)
                .deserialize().then(function (object1) {
                    return deserializer2.init(serializationString, pkg2)
                    .deserialize().then(function (object2) {
                        expect(object1.root.name).toBe("A");
                        expect(object2.root.name).toBe("B");
                    });
                });
            });
        });
    });

    it("should detect a malformed serialization string", function () {
        var serializationString = "{root:}",
            valid;

        valid = deserializer.isSerializationStringValid(serializationString);
        expect(valid).toBe(false);
    });

    it("should detect a well formed serialization string", function () {
        var serializationString = '{"root": {"value": 3}}',
            valid;

        valid = deserializer.isSerializationStringValid(serializationString);
        expect(valid).toBe(true);
    });

    it("should deserialize null", function () {
        var serialization = {
                "a": {
                    "value": null
                }
            },
            serializationString = JSON.stringify(serialization);

        deserializer.init(
            serializationString, require);

        return deserializer.deserialize(serializationString)
        .then(function (objects) {
            expect(objects.a).toBe(null);
        }).catch(function(reason) {
            console.log(reason.stack);
            expect("test").toBe("executed");
        });
    });

    describe("errors", function () {
        it("should fail if no require was given", function () {
            var serialization = {
                    "root": {
                        "prototype": "montage",
                        "properties": {
                            "number": 42,
                            "string": "a string"
                        }
                    }
                },
                serializationString = JSON.stringify(serialization);

            try {
                deserializer.init(
                    serializationString, null);
                // should never execute
                expect(true).toBe(false);
            } catch (ex) {
                expect(ex).toBeDefined();
            }
        });

        it("should fail if serialization is malformed", function () {
            var serializationString = "{root:}";

            deserializer._serializationString = serializationString;

            return deserializer.deserialize().then(function () {
                // should never execute
                expect(true).toBe(false);
            }, function (reason) {
                expect(reason).toBeDefined();
            }).catch(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            });
        });

        it("should fail initialization if serialization is malformed", function () {
            var serializationString = "{root:}";

            try {
                deserializer.init(
                    serializationString, require);
                // should never execute
                expect(true).toBe(false);
            } catch (ex) {
                expect(ex).toBeDefined();
            }
        });
    });
});
