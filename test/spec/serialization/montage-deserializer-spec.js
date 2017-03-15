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
    Deserializer = require("montage/core/serialization/deserializer/montage-deserializer").MontageDeserializer,
    deserialize = require("montage/core/serialization/deserializer/montage-deserializer").deserialize,
    Alias = require("montage/core/serialization/alias").Alias,
    Bindings = require("montage/frb"),
    defaultEventManager = require("montage/core/event/event-manager").defaultEventManager,
    Promise = require("montage/core/promise").Promise,
    objects = require("spec/serialization/testobjects-v2").objects;

logger.isError = true;

describe("serialization/montage-deserializer-spec", function () {
    var deserializer;

    beforeEach(function () {
        deserializer = new Deserializer();
    });

    describe("Montage Objects Deserialization", function () {
        it("should deserialize a class instance object", function (done) {
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

            deserializer.deserializeObject().then(function (root) {
                expect(Object.getPrototypeOf(root)).toBe(Montage.prototype);
                expect(root.number).toBe(42);
                expect(root.string).toBe("a string");
            }).catch(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            }).finally(function () {
                done();
            });
        });

        it("should deserialize two class instance objects", function (done) {
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

            deserializer.deserializeObject().then(function (root) {
                expect(root.oneprop.prop).toBe(42);
            }).finally(function () {
                done();
            });
        });

        it("should deserialize an external object with a label", function (done) {
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

            deserializer.deserializeObject(instances).then(function (root) {
                expect(root.simple).toBe(simple);
            }).catch(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            }).finally(function () {
                done();
            });
        });

        it("should deserialize an object as another by providing an instance", function (done) {
            var serialization = {
                    "root": {
                        "prototype": "montage",
                        "properties": {
                            "simple": {"@": "simple"}
                        }
                    },

                    "simple": {
                        "prototype": "spec/serialization/testobjects-v2[Simple]"
                    }
                },
                serializationString = JSON.stringify(serialization),
                simple = {},
                instances = {
                    simple: simple
                };

            deserializer.init(
                serializationString, require);

            deserializer.deserializeObject(instances).then(function (root) {
                expect(root.simple).toBe(simple);
            }).catch(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            }).finally(function () {
                done();
            });
        });

        it("should deserialize to a different object", function (done) {
            var serialization = {
                    "root": {
                        "prototype": "spec/serialization/testobjects-v2[Singleton]",
                        "properties": {
                            "number": 42
                        }
                    }
                },
                serializationString = JSON.stringify(serialization);

            deserializer.init(
                serializationString, require);

            deserializer.deserializeObject().then(function (root) {
                expect(root).toBe(objects.Singleton.prototype.instance);
            }).catch(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            }).finally(function () {
                done();
            });
        });

        it("should deserialize an object's properties when an instance is given for that object", function (done) {
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

            deserializer.deserializeObject(instances).then(function (root) {
                expect(root).toBe(instances.root);
                expect(instances.root.number).toBe(42);
            }).catch(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            }).finally(function () {
                done();
            });
        });

        it("should deserialize an object's properties when an instance is given for that object even when the serialization doesn't have a prototype or object property", function (done) {
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

            deserializer.deserialize(instances).then(function (objects) {
                expect(objects.owner).toBe(instances.owner);
                expect(instances.owner.number).toBe(42);
            }).catch(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            }).finally(function () {
                done();
            });
        });

        it("should call deserializedFromSerialization function on the instantiated objects", function (done) {
            var serialization = {
                    "root": {
                        "prototype": "spec/serialization/testobjects-v2[OneProp]",
                        "properties": {
                            "prop": {"@": "oneprop"}
                        }
                    },
                    "oneprop": {
                        "prototype": "spec/serialization/testobjects-v2[OneProp]"
                    }
                },
                serializationString = JSON.stringify(serialization),
                instances = {
                    root: new objects.OneProp()
                };

            deserializer.init(serializationString, require);
            deserializer.deserialize(instances).then(function (object) {
                var root = object.root,
                    oneprop = object.oneprop;

                expect(root.deserializedFromSerializationCount).toBe(0);
                expect(oneprop.deserializedFromSerializationCount).toBe(1);
            }).catch(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            }).finally(function () {
                done();
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

        it("should have isDeserializing set to true during units deserialization", function (done) {
            var serialization = {
                    "root": {
                        "prototype": "spec/serialization/testobjects-v2[OneProp]",
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

            deserializer.deserialize().then(function (objects) {
                expect(isDeserializing).toBeTruthy();
                expect(objects.root.isDeserializing).toBeUndefined();
            }).catch(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            }).finally(function () {
                done();
            });
        });
    });

    describe("Alias deserialization", function () {
        it("should deserialize an alias", function (done) {
            var serialization = {
                    ":templateProperty": {
                        "alias": "@component:propertyName"
                    }
                },
                serializationString = JSON.stringify(serialization);

            deserializer.init(serializationString, require);
            deserializer.deserialize().then(function (objects) {
                var alias = objects[":templateProperty"];
                expect(Object.getPrototypeOf(alias)).toBe(Alias.prototype);
                expect(alias.value).toBe("@component:propertyName");
                expect(alias.componentLabel).toBe("component");
                expect(alias.propertyName).toBe("propertyName");
            }).finally(function () {
                done();
            });
        });
    });

    describe("Template properties deserialization", function () {
        it("should deserialize a template property as an alias", function (done) {
            var serialization = {
                    ":templateProperty": {
                        "alias": "@component:propertyName"
                    }
                },
                serializationString = JSON.stringify(serialization);

            deserializer.init(serializationString, require);
            deserializer.deserialize().then(function (result) {
                expect(result).toBeDefined();
            }).finally(function () {
                done();
            });
        });

        it("should not deserialize a template property as an external object", function (done) {
            var serialization = {
                    ":templateProperty": {}
                },
                serializationString = JSON.stringify(serialization);

            deserializer.init(serializationString, require);
            deserializer.deserialize().then(function () {
                expect("deserialization").toBe("failed");
            }).catch(function() {
                expect("failed").toBe("failed");
            }).finally(function () {
                done();
            });
        });

        it("should not deserialize a montage object as a template property", function (done) {
            var serialization = {
                    ":templateProperty": {
                        "prototype": "montage/ui/component"
                    }
                },
                serializationString = JSON.stringify(serialization);

            deserializer.init(serializationString, require);
            deserializer.deserialize().then(function () {
                expect("deserialization").toBe("failed");
            }).catch(function() {
                expect("failed").toBe("failed");
            }).finally(function () {
                done();
            });
        });

        it("should not deserialize a value as a template property", function (done) {
            var serialization = {
                    ":templateProperty": {
                        "value": 42
                    }
                },
                serializationString = JSON.stringify(serialization);

            deserializer.init(serializationString, require);
            deserializer.deserialize().then(function () {
                expect("deserialization").toBe("failed");
            }).catch(function() {
                expect("failed").toBe("failed");
            }).finally(function () {
                done();
            });
        });

        it("should not deserialize a regexp as a template property", function (done) {
            var serialization = {
                    ":templateProperty": {
                        "/": {"source": "regexp"}
                    }
                },
                serializationString = JSON.stringify(serialization);

            deserializer.init(serializationString, require);
            deserializer.deserialize().then(function () {
                expect("deserialization").toBe("failed");
            }).catch(function() {
                expect("failed").toBe("failed");
            }).finally(function () {
                done();
            });
        });

        it("should not deserialize a literal object as a template property", function (done) {
            var serialization = {
                    ":templateProperty": {
                        "value": {}
                    }
                },
                serializationString = JSON.stringify(serialization);

            deserializer.init(serializationString, require);
            deserializer.deserialize().then(function () {
                expect("deserialization").toBe("failed");
            }).catch(function() {
                expect("failed").toBe("failed");
            }).finally(function () {
                done();
            });
        });
    });

    describe("Object Location", function () {
        it("should deserialize using prototype: module[name]", function (done) {
            var serialization = {
                    "root": {
                        "prototype": "spec/serialization/testobjects-v2[TestobjectsV2]",
                        "properties": {
                            "number": 42,
                            "string": "a string"
                        }
                    }
                },
                serializationString = JSON.stringify(serialization);

            deserializer.init(serializationString, require);
            deserializer.deserializeObject().then(function (root) {
                var info = Montage.getInfoForObject(root);
                expect(Object.getPrototypeOf(root)).toBe(objects.TestobjectsV2.prototype);
                expect(root.instance).toBeUndefined();
            }).catch(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            }).finally(function () {
                done();
            });
        });

        it("should deserialize using prototype: module", function (done) {
            var serialization = {
                    "root": {
                        "prototype": "spec/serialization/testobjects-v2",
                        "properties": {
                            "number": 42,
                            "string": "a string"
                        }
                    }
                },
                serializationString = JSON.stringify(serialization);

            deserializer.init(serializationString, require);
            deserializer.deserializeObject().then(function (root) {
                var info = Montage.getInfoForObject(root);

                expect(Object.getPrototypeOf(root)).toBe(objects.TestobjectsV2.prototype);

                expect(info.moduleId).toBe("spec/serialization/testobjects-v2");
                expect(info.objectName).toBe("TestobjectsV2");
                expect(info.isInstance).toBe(true);
                expect(root.instance).toBeUndefined();
            }).catch(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            }).finally(function () {
                done();
            });
        });

        it("should deserialize using prototype: module-name.reel", function (done) {
            var serialization = {
                    "root": {
                        "prototype": "spec/serialization/module-name.reel",
                        "properties": {
                            "number": 42,
                            "string": "a string"
                        }
                    }
                },
                serializationString = JSON.stringify(serialization);

            deserializer.init(serializationString, require);
            deserializer.deserializeObject().then(function (root) {
                var info = Montage.getInfoForObject(root);

                expect(info.moduleId).toBe("spec/serialization/module-name.reel");
                expect(info.objectName).toBe("ModuleName");
                expect(info.isInstance).toBe(true);
            }).catch(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            }).finally(function () {
                done();
            });
        });

        it("should deserialize using object: module[name]", function (done) {
            var serialization = {
                    "root": {
                        "object": "spec/serialization/testobjects-v2[TestobjectsV2]",
                        "properties": {
                            "number": 42,
                            "string": "a string"
                        }
                    }
                },
                serializationString = JSON.stringify(serialization);

            deserializer.init(serializationString, require);
            deserializer.deserializeObject().then(function (root) {
                var info = Montage.getInfoForObject(root);

                expect(root).toBe(objects.TestobjectsV2);
                expect(info.moduleId).toBe("spec/serialization/testobjects-v2");
                expect(info.objectName).toBe("TestobjectsV2");
                expect(info.isInstance).toBe(false);
                expect(root.type).toBeUndefined();
            }).catch(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            }).finally(function () {
                done();
            });
        });

        it("should deserialize using object: module", function (done) {
            var serialization = {
                    "root": {
                        "object": "spec/serialization/testobjects-v2",
                        "properties": {
                            "number": 42,
                            "string": "a string"
                        }
                    }
                },
                serializationString = JSON.stringify(serialization);

            deserializer.init(serializationString, require);
            deserializer.deserializeObject().then(function (root) {
                var info = Montage.getInfoForObject(root);

                expect(root).toBe(objects.TestobjectsV2);
                expect(info.moduleId).toBe("spec/serialization/testobjects-v2");
                expect(info.objectName).toBe("TestobjectsV2");
                expect(info.isInstance).toBe(false);
                expect(root.type).toBeUndefined();
            }).catch(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            }).finally(function () {
                done();
            });
        });

        it("should deserialize using object: module.json", function (done) {
            var serialization = {
                    "root": {
                        "object": "spec/serialization/testjson.json"
                    }
                },
                serializationString = JSON.stringify(serialization);

            deserializer.init(serializationString, require);
            deserializer.deserializeObject().then(function (json) {
                expect("root" in json).toBe(true);
                expect(json.root.foo).toBe("bar");
            }).finally(function () {
                done();
            });
        });

        it("should deserialize using object: module.mjson", function (done) {
            var serialization = {
                    "root": {
                        "object": "spec/serialization/testmjson.mjson"
                    }
                },
                serializationString = JSON.stringify(serialization);

            deserializer.init(
                serializationString, require);

            deserializer.deserializeObject().then(function (object) {
                var info = Montage.getInfoForObject(object);
                expect(info.moduleId).toBe("core/meta/blueprint");
                expect(info.isInstance).toBe(true);
                expect(object.type).toBeUndefined();
                expect(object.name).toBe("RootBlueprint");
            }).finally(function () {
                done();
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

        it("should deserialize an element reference", function (done) {
            var serialization = {
                    "root": {
                        "value": {"#": "id"}
                    }
                },
                serializationString = JSON.stringify(serialization);

            element.innerHTML = '<div data-montage-id="id">content</div>';
            deserializer.init(
                serializationString, require);

            deserializer.deserialize(null, element).then(function (objects) {
                expect(objects.root instanceof Element).toBe(true);
                expect(objects.root.textContent).toBe("content");
            }).finally(function () {
                done();
            });

            //for (var i = 0; i < 3; i++) {
            //    deserializer.deserializeObjectWithElement(root, function (object) {
            //        expect(object.element instanceof Element).toBe(true);
            //        expect(object.element.textContent).toBe("content");
            //    });
            //}
        });

        it("should deserialize an element reference and add event listeners", function (done) {
            var serialization = {
                    "root": {
                        "value": {"#": "id"},
                        "listeners": [
                            {
                                "type": "click",
                                "listener": {"@": "root"}
                            }
                        ]
                    }
                },
                serializationString = JSON.stringify(serialization);

            element.innerHTML = '<div data-montage-id="id">content</div>';
            deserializer.init(serializationString, require);

            deserializer.deserialize(null, element).then(function (objects) {
                var registeredEventListeners = defaultEventManager._registeredBubbleEventListeners.get("click");
                expect(registeredEventListeners.get(element.firstElementChild) === objects.root).toBe(true);
            }).finally(function () {
                done();
            });
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
        it("should deserialize a module", function (done) {
            var serialization = {
                    "root": {
                        "value": {"%": "./testobjects-v2"}
                    }
                },
                serializationString = JSON.stringify(serialization);

            deserializer.init(
                serializationString, require);

            deserializer.deserializeObject().then(function (root) {
                // module is now absolute from the root of the test package
                expect(root.id).toBe("spec/serialization/testobjects-v2");
                expect(root.require.location).toBe(require.location);
            }).finally(function () {
                done();
            });
        });

        it("should use the require of the package the deserializer is using", function (done) {
            
            require.loadPackage("spec/package-a").then(function (pkg1) {
                var serialization = {
                        "root": {
                            "value": {"%": "pass"}
                        }
                    },
                    serializationString = JSON.stringify(serialization);

                deserializer.init(
                    serializationString, pkg1);

                deserializer.deserializeObject().then(function (root) {
                    expect(root.id).toBe("pass");
                    expect(root.require.location).toBe(pkg1.location);
                }).finally(function () {
                    done();
                });
            });
        });
    });

    describe("Custom deserialization", function () {
        var customDeserialization = objects.CustomDeserialization,
            serialization = {
                "root": {
                    "prototype": "spec/serialization/testobjects-v2[CustomDeserialization]",
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
                    "prototype": "spec/serialization/testobjects-v2[OneProp]",
                    "properties": {
                        "prop": 42
                    }
                }
            };

        it("should only create the object", function (done) {
            var serializationString = JSON.stringify(serialization);

            deserializer.init(
                serializationString, require);

            customDeserialization.prototype.deserializeSelf = function (deserializer) {

            };

            deserializer.deserializeObject().then(function (root) {
                expect(root.prop1).toBeNull();
                if (defaultEventManager.registeredEventListeners.action) {
                    expect(root.uuid in defaultEventManager.registeredEventListeners.action).toBeFalsy();
                }
                expect(root._bindingDescriptors).toBeFalsy();
            }).catch(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            }).finally(function () {
                done();
            });
        });

        it("should report prototype type", function (done) {
            var serializationString = JSON.stringify(serialization),
                type,
                typeValue;

            deserializer.init(
                serializationString, require);

            customDeserialization.prototype.deserializeSelf = function (deserializer) {
                type = deserializer.getType();
                typeValue = deserializer.getTypeValue();
            };

            deserializer.deserializeObject().then(function (root) {
                expect(type).toBe("prototype");
                expect(typeValue).toBe("spec/serialization/testobjects-v2[CustomDeserialization]");
            }).catch(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            }).finally(function () {
                done();
            });
        });

        it("should report object type", function (done) {
            var serialization = {
                    "root": {
                        "object": "spec/serialization/testobjects-v2[CustomDeserialization]"
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

            deserializer.deserializeObject().then(function (root) {
                expect(type).toBe("object");
                expect(typeValue).toBe("spec/serialization/testobjects-v2[CustomDeserialization]");
            }).catch(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            }).finally(function () {
                done();
            });
        });

        it("should access properties", function (done) {
            var serializationString = JSON.stringify(serialization),
                prop1;

            deserializer.init(
                serializationString, require);

            customDeserialization.prototype.deserializeSelf = function (deserializer) {
                prop1 = deserializer.getProperty("prop1");
            };

            deserializer.deserializeObject().then(function (root) {
                expect(prop1).toBe(3.14);
            }).catch(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            }).finally(function () {
                done();
            });
        });

        it("should only deserialize properties", function (done) {
            var serializationString = JSON.stringify(serialization);

            deserializer.init(
                serializationString, require);

            customDeserialization.prototype.deserializeSelf = function (deserializer) {
                deserializer.deserializeProperties();
            };

            deserializer.deserializeObject().then(function (root) {
                expect(root.prop1).toBe(3.14);
                if (defaultEventManager.registeredEventListeners.action) {
                    expect(root.uuid in defaultEventManager.registeredEventListeners.action).toBeFalsy();
                }
                expect(root._bindingDescriptors).toBeFalsy();
            }).catch(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            }).finally(function () {
                done();
            });
        });

        it("should deserialize properties and listeners", function (done) {
            var serializationString = JSON.stringify(serialization);

            deserializer.init(
                serializationString, require);

            customDeserialization.prototype.deserializeSelf = function (deserializer) {
                deserializer.deserializeProperties();
                deserializer.deserializeUnit("listeners");
            };

            deserializer.deserializeObject().then(function (root) {
                var registeredEventListenersForRootAction = defaultEventManager.registeredEventListenersForEventType_onTarget_("action",root);
                expect(root.prop1).toBe(3.14);
                expect(registeredEventListenersForRootAction).toBeDefined();
                expect(root._bindingDescriptors).toBeFalsy();
            }).catch(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            }).finally(function () {
                done();
            });
        });

        it("should deserialize properties and bindings", function (done) {
            var serializationString = JSON.stringify(serialization);

            deserializer.init(
                serializationString, require);

            customDeserialization.prototype.deserializeSelf = function (deserializer) {
                deserializer.deserializeProperties();
                deserializer.deserializeUnit("bindings");
            };

            deserializer.deserializeObject().then(function (root) {
                expect(root.prop1).toBe(3.14);
                if (defaultEventManager.registeredEventListeners.action) {
                    expect(root.uuid in defaultEventManager.registeredEventListeners.action).toBeFalsy();
                }

                expect(Bindings.getBindings(root).size).toBeGreaterThan(0);
            }).catch(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            }).finally(function () {
                done();
            });
        });

        it("should deserialize properties and all units", function (done) {
            var serializationString = JSON.stringify(serialization);

            deserializer.init(
                serializationString, require);

            customDeserialization.prototype.deserializeSelf = function (deserializer) {
                deserializer.deserializeProperties();
                deserializer.deserializeUnits();
            };

            deserializer.deserializeObject().then(function (root) {
                var registeredEventListenersForRootAction = defaultEventManager.registeredEventListenersForEventType_onTarget_("action",root);
                expect(root.prop1).toBe(3.14);
                expect(registeredEventListenersForRootAction).toBeDefined();
                expect(Bindings.getBindings(root).size).toBeGreaterThan(0);
            }).catch(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            }).finally(function () {
                done();
            });
        });

        it("should deserialize into another object in an asynchronous way", function (done) {
            var serializationString = JSON.stringify(serialization),
                newRoot = {};

            deserializer.init(serializationString, require);

            customDeserialization.prototype.deserializeSelf = function (deserializer) {
                return Promise.resolve(newRoot);
            };

            deserializer.deserializeObject().then(function (root) {
                expect(root).toBe(newRoot);
            }).catch(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            }).finally(function () {
                done();
            });
        });
    });

    it("should load the correct module even if it's from a diferent package but with the same name", function (done) {
        var deserializer1 = new Deserializer(),
            deserializer2 = new Deserializer(),
            serialization = {
                root: {
                    prototype: "ui/main.reel"
                }
            },
            serializationString = JSON.stringify(serialization);

        require.loadPackage("spec/package-a").then(function (pkg1) {
            return require.loadPackage("spec/package-b").then(function (pkg2) {
                return deserializer1.init(serializationString, pkg1)
                .deserialize().then(function (object1) {
                    return deserializer2.init(serializationString, pkg2)
                    .deserialize().then(function (object2) {
                        expect(object1.root.name).toBe("A");
                        expect(object2.root.name).toBe("B");
                    });
                });
            }).finally(function () {
                done();
            });
        });
    });

    it("should deserialize null", function (done) {
        var serialization = {
            "a": {
                "value": null
            }
        },
        serializationString = JSON.stringify(serialization);

        deserializer.init(serializationString, require);
        deserializer.deserialize(serializationString).then(function (objects) {
            expect(objects.a).toBe(null);
        }).catch(function(reason) {
            console.log(reason.stack);
            expect("test").toBe("executed");
        }).finally(function () {
            done();
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

        it("should fail deserialize if serialization is malformed", function (done) {
            var serializationString = "{root:}";

            // return a promise when failling.
            deserializer.init(serializationString, require).deserialize().catch(function (ex) {
                expect(ex).toBeDefined();
            }).finally(function () {
                done();
            });
        });
    });

    describe("deserialization", function() {
        it("should deserialize a serialization string", function(done) {
            var serialization = {
                    "string": {
                        "value": "a string"
                    },

                    "number": {
                        "value": 42
                    },

                    "literal": {
                        "value": {
                            "string": "a string",
                            "number": 42
                        }
                    }
                },
                serializationString = JSON.stringify(serialization),
                expectedResult = {
                    string: "a string",
                    number: 42,
                    literal: {
                        string: "a string",
                        number: 42
                    }
                },
                deserializer = new Deserializer().init(serializationString, require);

            deserializer.deserialize().then(function(objects) {
                expect(objects).toEqual(jasmine.objectContaining(expectedResult));
            }).finally(function () {
                done();
            });
        });

        it("should deserialize an object from a serialization string", function(done) {
            var serialization = {
                    "root": {
                        "value": "a string"
                    }
                },
                serializationString = JSON.stringify(serialization),
                deserializer = new Deserializer().init(serializationString, require);

            deserializer.deserializeObject().then(function(object) {
                expect(object).toBe("a string");
            }).finally(function () {
                done();
            });
        });

        it("should deserialize an external object from a serialization string", function(done) {
            var serialization = {
                    "external": {}
                },
                userObjects = {
                    "external": {}
                },
                serializationString = JSON.stringify(serialization),
                deserializer = new Deserializer().init(serializationString, require);

            deserializer.deserialize(userObjects).then(function(objects) {
                expect(userObjects.external).toBe(objects.external);
            }).finally(function () {
                done();
            });
        });

        it("should fail deserializing a missing external object from a serialization string", function(done) {
            var serialization = {
                    "external": {}
                },
                serializationString = JSON.stringify(serialization),
                deserializer = new Deserializer().init(serializationString, require);

            deserializer.deserialize().then(function(objects) {
                expect("test").toBe("fail");
            }, function() {
                expect(true).toBe(true);
            }).finally(function () {
                done();
            });
        });

        it("should be oblivious to Object.prototype aditions", function(done) {
            Object.defineProperty(Object.prototype, "clear", {
                value: function() {},
                writable: true,
                configurable: true
            });

            var serialization = {
                    "clear": {
                        "value": "a string"
                    }
                },
                serializationString = JSON.stringify(serialization),
                deserializer = new Deserializer().init(serializationString, require);

            deserializer.deserialize().then(function(object) {
                delete Object.prototype.clear;
                expect(object.clear).toBe("a string");
            }).finally(function () {
                done();
            });
        });

        describe("shorthand", function() {
            it("should deserialize an object from a serialization string", function(done) {
                var serialization = {
                        "root": {
                            "value": "a string"
                        }
                    },
                    serializationString = JSON.stringify(serialization);

                deserialize(serializationString, require).then(function(object) {
                    expect(object).toEqual("a string");
                }).finally(function () {
                    done();
                });
            });
        });

        describe("errors", function() {
            it("should warn about invalid format", function(done) {
                // property name is missing quotes
                var serializationString = '{string: "a string"}';

                new Promise(function (resolve, reject) {
                    resolve(deserialize(serializationString, require)); // will fail
                }).then(function(objects) {
                    // never executed
                }, function(reason) {
                    expect(reason).toBeDefined();
                }).finally(function () {
                    done();
                });
            })
        });
    });
});
