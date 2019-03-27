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
                        "values": {
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
                fail(reason);
            }).finally(function () {
                done();
            });
        });

        it("should deserialize two class instance objects", function (done) {
            var serialization = {
                    "root": {
                        "prototype": "montage",
                        "values": {
                            "oneprop": {"@": "oneprop"}
                        }
                    },

                    "oneprop": {
                        "prototype": "montage",
                        "values": {
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
                        "values": {
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
                fail(reason);
            }).finally(function () {
                done();
            });
        });

        it("should deserialize an object as another by providing an instance", function (done) {
            var serialization = {
                    "root": {
                        "prototype": "montage",
                        "values": {
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

            deserializer.init(serializationString, require);

            deserializer.deserializeObject(instances).then(function (root) {
                expect(root.simple).toBe(simple);
            }).catch(function(reason) {
                fail(reason);
            }).finally(function () {
                done();
            });
        });

        it("should deserialize to a different object", function (done) {
            var serialization = {
                    "root": {
                        "prototype": "spec/serialization/testobjects-v2[Singleton]",
                        "values": {
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
                fail(reason);
            }).finally(function () {
                done();
            });
        });

        it("should deserialize an object's properties when an instance is given for that object", function (done) {
            var serialization = {
                    "root": {
                        "prototype": "montage",
                        "values": {
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
                fail(reason);
            }).finally(function () {
                done();
            });
        });

        it("should deserialize an object's properties when an instance is given for that object even when the serialization doesn't have a prototype or object property", function (done) {
            var serialization = {
                    "owner": {
                        "values": {
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
                fail(reason);
            }).finally(function () {
                done();
            });
        });

        it("should deserialize a complex key assignment", function (done) {
            var serialization = {
                "root": {
                    "value": {
                        "bar": {}
                    },
                    "values": {
                        "foo": 10,
                        "bar.quz": 42
                    }
                }
            },
                serializationString = JSON.stringify(serialization);
            deserialize(serializationString, require).then(function (object) {
                expect(object.foo).toBe(10);
                expect(object.bar.quz).toBe(42);
            }).finally(function () {
                done();
            });
        });

        it("should deserialize a simple one-time assignment in normal form", function (done) {
            var serialization = {
                "root": {
                    "prototype": "montage",
                    "values": {
                        "foo": 10,
                        "bar": { "=": "foo" }
                    }
                }
            },
                serializationString = JSON.stringify(serialization);
            deserialize(serializationString, require).then(function (object) {
                expect(object.foo).toBe(10);
                expect(object.bar).toBe(10);
                object.foo = 20;
                expect(object.bar).toBe(10);
            }).finally(function () {
                done();
            });
        });

        it("should deserialize a simple one-time assignment with a component reference", function (done) {
            var serialization = {
                "root": {
                    "prototype": "montage",
                    "values": {
                        "foo": 10,
                        "bar": { "=": "@root.foo" }
                    }
                }
            },
                serializationString = JSON.stringify(serialization);

            deserialize(serializationString, require).then(function (object) {
                expect(object.foo).toBe(10);
                expect(object.bar).toBe(10);
                object.foo = 20;
                expect(object.bar).toBe(10);
            }).finally(function () {
                done();
            });
        });

        it("should deserialize a complex one-time assignment", function (done) {
            var serialization = {
                "root": {
                    "prototype": "montage",
                    "values": {
                        "foo": {
                            "qux": 10
                        },
                        "a": {
                            "b": 10,
                            "c": 20
                        },
                        "corge": [ 1, 2, 3, 4, 5 ],
                        "bar": { "=": "foo.qux" },
                        "qux": { "=": "foo.qux + 10" },
                        "quuz": { "=": "foo.qux + bar + @root.bar" },
                        "quux": { "=": "corge.sum()" },
                        "quuxz": { "=": 75.5 },
                        "quuxzz": { "=": true },
                        "a.b": { "=": 1 },
                        "a.c": 2
                    }
                }
            },
                serializationString = JSON.stringify(serialization);

            deserialize(serializationString, require).then(function (object) {
                expect(object.foo.qux).toBe(10);
                expect(object.bar).toBe(10);
                expect(object.qux).toBe(20);
                expect(object.quuz).toBe(30);
                expect(object.quux).toBe(15);
                object.foo.qux = 20;
                expect(object.bar).toBe(10);
                expect(object.qux).toBe(20);
                expect(object.quuxz).toBe(75.5);
                expect(object.quuxzz).toBe(true);
                expect(object.quuxzz).toBe(true);
                expect(object.a.b).toBe(1);
                expect(object.a.c).toBe(2);
                done();
            });
        });

        it("should fail deserializing an one-time assignment to a non existing object", function (done) {
            var serialization = {
                "root": {
                    "prototype": "montage",
                    "values": {
                        "foo": 10,
                        "bar": { "=": "@unknown.foo" }
                    }
                }
            },
                serializationString = JSON.stringify(serialization);

            deserialize(serializationString, require).then(function (object) {
                expect("deserialization").toBe("fail");
            }).catch(function (err) {
                expect(err).toBeDefined();
            }).finally(function () {
                done();
            });
        });


        it("should call deserializedFromSerialization function on the instantiated objects", function (done) {
            var serialization = {
                    "root": {
                        "prototype": "spec/serialization/testobjects-v2[OneProp]",
                        "values": {
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
                fail(reason);
            }).finally(function () {
                done();
            });
        });

        // TODO Deprecated ?
        xit("should call deserializedFromSerialization function on the instantiated objects even if they were given as null instances", function (done) {
           var latch;
           var instances = {root: null};
           var exports;

           deserializer.init({
               root: {
                   module: "serialization/testobjects-v2",
                   name: "OneProp",
                   values: {
                       prop: {"@": "oneprop"}
                   }
               },
               oneprop: {
                   module: "serialization/testobjects-v2",
                   name: "OneProp"
               }
           }, require).deserializeObject(instances, function (objs) {
               latch = true;
               exports = objs;

               expect(exports.root.deserializedFromSerializationCount).toBe(1);
               done();
           });
        });

        it("should have isDeserializing set to true during units deserialization", function (done) {
            var serialization = {
                    "root": {
                        "prototype": "spec/serialization/testobjects-v2[OneProp]",
                        "values": {
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
                fail(reason);
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
                        "values": {
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
                fail(reason);
            }).finally(function () {
                done();
            });
        });

        it("should deserialize using prototype: module", function (done) {
            var serialization = {
                    "root": {
                        "prototype": "spec/serialization/testobjects-v2",
                        "values": {
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
                fail(reason);
            }).finally(function () {
                done();
            });
        });

        it("should deserialize using prototype: module-name.reel", function (done) {
            var serialization = {
                    "root": {
                        "prototype": "spec/serialization/module-name.reel",
                        "values": {
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
                fail(reason);
            }).finally(function () {
                done();
            });
        });

        it("should deserialize using object: module[name]", function (done) {
            var serialization = {
                    "root": {
                        "object": "spec/serialization/testobjects-v2[TestobjectsV2]",
                        "values": {
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
                fail(reason);
            }).finally(function () {
                done();
            });
        });

        it("should deserialize using object: module", function (done) {
            var serialization = {
                    "root": {
                        "object": "spec/serialization/testobjects-v2",
                        "values": {
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
                fail(reason);
            }).finally(function () {
                done();
            });
        });

        it("should deserialize only when children are deserialized", function (done) {
            var serialization = {
                    "root": {
                        "prototype": "spec/serialization/testobjects-v2[SelfDeserializer]",
                        "properties": {
                            "stringProperty": "Parent",
                            "array": [
                                {"@": "test"},
                                {"@": "test2"}
                            ]
                        }
                    },
                    "test": {
                        "prototype": "spec/serialization/testobjects-v2[SelfDeserializer]",
                        "properties": {
                            "stringProperty": "Child",
                            "objectProperty": {"@": "descriptor"},
                            "parent": {"@": "root"}
                        }
                    },
                    "test2": {
                        "prototype": "spec/serialization/testobjects-v2[SelfDeserializer]",
                        "properties": {
                            "stringProperty": "Child2",
                            "objectProperty": {"@": "descriptor"},
                            "parent": {"@": "root"}
                        }
                    },
                    "descriptor": {
                        "object": "spec/serialization/testmjson2.mjson"
                    }
                },
                serializationString = JSON.stringify(serialization);

            deserializer.init(serializationString, require);
            deserializer.deserializeObject().then(function (root) {
                console.log("root", root);
                expect(root).toBeDefined();
            }).catch(function(reason) {
                fail(reason);
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
            }).catch(function(reason) {
                fail(reason);
            }).finally(function () {
                done();
            });
        });

        it("should deserialize using prototype: module.mjson", function (done) {
            //The fact that this is a string created in montage-deserializer-spec
            //makes harder to assess what moduleId should really be expected.
            var serialization = {
                    "root": {
                        "prototype": "spec/serialization/testmjson.mjson",
                        "values": {
                            "number": 42,
                            "string": {"<-": "'a string'"}
                        }
                    }
                },
                serializationString = JSON.stringify(serialization);

            deserializer.init(serializationString, require);
            deserializer.deserializeObject().then(function (root) {
                var info = Montage.getInfoForObject(root);
                expect(info.moduleId).toBe("spec/serialization/testmjson.mjson");
                expect(info.isInstance).toBe(true);
                expect(root.type).toBeUndefined();
                expect(root.name).toBe("RootObjectDescriptor");
                expect(root.number).toBe(42);
                expect(root.string).toBe("a string");
            }).catch(function (reason) {
                fail(reason);
            }).finally(function () {
                done();
            });
        });

        it("should deserialize instances using prototype: module.mjson", function (done) {
            var serialization = {
                    "root": {
                        "prototype": "montage",
                        "values": {
                            "bar": { "@": "bar" },
                            "foo": { "@": "foo" }
                        }
                    },
                    "bar": {
                        "prototype": "spec/serialization/testmjson.mjson"
                    },
                    "foo": {
                        "prototype": "spec/serialization/testmjson.mjson"
                    }
                },
                serializationString = JSON.stringify(serialization);

            deserializer.init(serializationString, require);
            deserializer.deserializeObject().then(function (root) {
                expect(root.foo).not.toBe(root.bar);
            }).catch(function (reason) {
                fail(reason);
            }).finally(function () {
                done();
            });
        });

        it("should deserialize using object: module.mjson", function (done) {
            var serialization = {
                    "root": {
                        "object": "spec/serialization/testmjson.mjson",
                        "values": {
                            "number": 42,
                            "string": {"<-": "'a string'"}
                        }
                    }
                },
                serializationString = JSON.stringify(serialization);

            deserializer.init(serializationString, require);
            deserializer.deserializeObject().then(function (root) {
                var info = Montage.getInfoForObject(root);
                expect(info.moduleId).toBe("spec/serialization/testmjson.mjson");
                expect(info.isInstance).toBe(true);
                expect(root.type).toBeUndefined();
                expect(root.name).toBe("RootObjectDescriptor");
                expect(root.number).toBe(42);
                expect(root.string).toBe("a string");
            }).catch(function (reason) {
                fail(reason);
            }).finally(function () {
                done();
            });
        });

        //TODO
        it("should deserialize using object: module.mjson, object created", function (done) {
            var serialization = {
                    "root": {
                        "object": "spec/serialization/test-object-mjson.mjson",
                        "values": {
                            "number": 42,
                            "string": {"<-": "'a string'"}
                        }
                    }
                },
                serializationString = JSON.stringify(serialization);

            deserializer.init(serializationString, require);
            deserializer.deserializeObject().then(function (root) {
                var info = Montage.getInfoForObject(root);
                expect(info.moduleId).toBe("core/core");
                expect(info.isInstance).toBe(true);
                expect(root.type).toBeUndefined();
                expect(root.blah).toBe("RootObjectDescriptor");
                expect(root.number).toBe(42);
                expect(root.string).toBe("a string");
            }).catch(function (reason) {
                fail(reason);
            }).finally(function () {
                done();
            });
        });


        it("should deserialize singleton using object: module.mjson", function (done) {
            var serialization = {
                    "root": {
                        "prototype": "montage",
                        "values": {
                            "bar": { "@": "bar" },
                            "foo": { "@": "foo" }
                        }
                    },
                    "bar": {
                        "object": "spec/serialization/testmjson.mjson"
                    },
                    "foo": {
                        "object": "spec/serialization/testmjson.mjson"
                    }
                },
                serializationString = JSON.stringify(serialization);

            deserializer.init(serializationString, require);
            deserializer.deserializeObject().then(function (root) {
                expect(root.foo).toBe(root.foo);
            }).catch(function (reason) {
                fail(reason);
            }).finally(function () {
                done();
            });
        });

        it("should deserialize singleton using the folowing syntax: require('[path].mjson')", function (done) {
            require.async('spec/serialization/testmjson.mjson').then(function (module) {
                expect(module.montageObject).toBeDefined();
                expect(module.montageObject.name).toBe("RootObjectDescriptor");
                done();
            });
        });

        it("should deserialize using instance after compilation", function (done) {
           var latch, objects;

            deserializer.init({
               root: {
                   prototype: "montage",
                   values: {
                       number: 15,
                       string: "string"
                   }
               }
            }, require).deserialize().then(function (objs) {
               latch = true;
               objects = objs;

               var root = objects.root,
                   info = Montage.getInfoForObject(root);

               expect(Montage.isPrototypeOf(root));
               expect(info.moduleId).toBe("core/core");
               expect(info.objectName).toBe("Montage");
               expect(info.isInstance).toBe(true);
            }).catch(function(reason) {
                fail(reason);
            }).finally(function () {
                done();
            });
        });

        it("should deserialize using type after compilation", function (done) {
           var latch, objects;

           deserializer.init({
               root: {
                   object: "montage",
                   values: {
                       number: 15,
                       string: "string"
                   }
               }
           }, require).deserialize().then(function (objs) {
               latch = true;
               objects = objs;

               var root = objects.root,
                   info = Montage.getInfoForObject(root);

               expect(root).toBe(Montage);
               expect(info.moduleId).toBe("core/core");
               expect(info.objectName).toBe("Montage");
               expect(info.isInstance).toBe(false);
            }).catch(function(reason) {
                fail(reason);
            }).finally(function () {
                done();
            });
        });
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
            }).catch(function(reason) {
                fail(reason);
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
                    "values": {
                        "prop1": 3.14,
                        "prop2": {"<-": "@oneprop.prop"}
                    },
                    "listeners": [{
                        "type": "action",
                        "listener": {"@": "oneprop"}
                    }]
                },

                "oneprop": {
                    "prototype": "spec/serialization/testobjects-v2[OneProp]",
                    "values": {
                        "prop": 42
                    }
                }
            };

        it("Empty deserializeSelf should only create the object and not set values", function (done) {
            var serializationString = JSON.stringify(serialization);

            deserializer.init(
                serializationString, require);

            customDeserialization.prototype.deserializeSelf = function (deserializer) {

            };

            deserializer.deserializeObject().then(function (root) {
                expect(root.prop1).toBeNull();
                expect(root._bindingDescriptors).toBeFalsy();
            }).catch(function(reason) {
                fail(reason);
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
                fail(reason);
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
                fail(reason);
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
                fail(reason);
            }).finally(function () {
                done();
            });
        });

        it("should only deserialize properties", function (done) {
            var serializationString = JSON.stringify(serialization);

            deserializer.init(
                serializationString, require);

            customDeserialization.prototype.deserializeSelf = function (deserializer) {
                deserializer.deserializeValues();
            };

            deserializer.deserializeObject().then(function (root) {
                expect(root.prop1).toBe(3.14);
                expect(root._bindingDescriptors).toBeFalsy();
            }).catch(function(reason) {
                fail(reason);
            }).finally(function () {
                done();
            });
        });

        xit("should deserialize properties and listeners", function (done) {
            var serializationString = JSON.stringify(serialization);

            deserializer.init(
                serializationString, require);

            customDeserialization.prototype.deserializeSelf = function (deserializer) {
                deserializer.deserializeValues();
                deserializer.deserializeUnit("listeners");
            };

            deserializer.deserializeObject().then(function (root) {
                expect(root.prop1).toBe(3.14);
                expect(root._bindingDescriptors).toBeFalsy();
            }).catch(function(reason) {
                fail(reason);
            }).finally(function () {
                done();
            });
        });

        it("should deserialize properties and bindings", function (done) {
            var serializationString = JSON.stringify(serialization);

            deserializer.init(
                serializationString, require);

            customDeserialization.prototype.deserializeSelf = function (deserializer) {
                deserializer.deserializeValues();
                deserializer.deserializeUnit("bindings");
            };

            deserializer.deserializeObject().then(function (root) {
                expect(root.prop1).toBe(3.14);
                expect(Bindings.getBindings(root).size).toBeGreaterThan(0);
            }).catch(function(reason) {
                fail(reason);
            }).finally(function () {
                done();
            });
        });

        it("should deserialize properties and all units", function (done) {
            var serializationString = JSON.stringify(serialization);

            deserializer.init(
                serializationString, require);

            customDeserialization.prototype.deserializeSelf = function (deserializer) {
                deserializer.deserializeValues();
                deserializer.deserializeUnits();
            };

            deserializer.deserializeObject().then(function (root) {
                expect(root.prop1).toBe(3.14);
                expect(Bindings.getBindings(root).size).toBeGreaterThan(0);
            }).catch(function(reason) {
                fail(reason);
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
                fail(reason);
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
            fail(reason);
        }).finally(function () {
            done();
        });
    });

    describe("errors", function () {
        it("should fail if no require was given", function () {
            var serialization = {
                    "root": {
                        "prototype": "montage",
                        "values": {
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

    it("handles circular references", function (done) {
        var serialization = {
            "root": {
                "object": "spec/serialization/circular/a.mjson"
            }
        };
        var deserializer = new Deserializer().init(JSON.stringify(serialization), require);
        deserializer.deserializeObject()
            .then(function (result) {
                expect(result.bRef.myBProp).toBe("bar");
                expect(result.bRef.aRef).toBe(result);
            }).catch(function (err) {
                fail(err);
            }).finally(function () {
                done();
            });
    });

    describe("sync option", function () {
        it("deserializes objects synchronously if all needed modules are available", function () {
            var serialization = {
                    "component": {
                        "prototype": "montage/ui/component"
                    }
                },
                serializationString = JSON.stringify(serialization),
                deserializer = new Deserializer().init(serializationString, require, undefined, undefined, true);

            var objects = deserializer.deserialize();
            if (Promise.is(objects)) {
                throw new Error("Expected deserialize() not to return a promise");
            }
            expect(objects.component).toBeTruthy();
        });

        it("throws an error if some needed modules are not available", function () {
            var serialization = {
                    "bar": {
                        "prototype": "foo/bar"
                    }
                },
                serializationString = JSON.stringify(serialization),
                deserializer = new Deserializer().init(serializationString, require, undefined, undefined, true);

            try {
                deserializer.deserialize();
                throw new Error("expected to throw");
            } catch (err) {
                expect(err.message.indexOf("synchronous")).toBeGreaterThan(-1);
            }
        });
    });
});
