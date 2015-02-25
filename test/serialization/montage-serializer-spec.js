var Montage = require("montage/core/core").Montage,
    MontageSerializer = require("montage/core/serialization").Serializer,
    objects = require("serialization/testobjects-v2").objects,
    ModuleReference = require("montage/core/module-reference").ModuleReference,
    Alias = require("montage/core/serialization/alias").Alias;

    function fakeGetSerializablePropertyNames(object, returnValues) {
        getSerializablePropertyNames = Montage.getSerializablePropertyNames;

        spyOn(Montage, "getSerializablePropertyNames")
        .andCallFake(function (obj) {
            if (obj === object) {
                return returnValues;
            } else {
                return getSerializablePropertyNames.apply(Montage, arguments);
            }
        });
    }

    function createFakeElement(id) {
        var isElement = Element.isElement,
            element = {
                getAttribute: function (attributeName) {
                    if (attributeName === "data-montage-id") {
                        return id;
                    }
                }
            };

        spyOn(Element, "isElement")
        .andCallFake(function (obj) {
            if (obj === element) {
                return true;
            } else {
                return isElement.apply(Element, arguments);
            }
        });

        return element;
    }

    function createFakeModuleReference(id, _require) {
        return new ModuleReference().initWithIdAndRequire(id, _require || require);
    }

describe("serialization/montage-serializer-spec", function () {
    var serializer;
    var originalUnits;

    beforeEach(function () {
        originalUnits = MontageSerializer._units;
        MontageSerializer._units = {};
        serializer = new MontageSerializer().initWithRequire(require);
        serializer.setSerializationIndentation(4);
    });

    afterEach(function () {
        MontageSerializer._units = originalUnits;
    });

    it("should still serialize native types", function () {
        var object = {
                string: "string",
                number: 42,
                regexp: /regexp/gi,
                array: [1, 2, 3],
                boolean: true,
                nil: null
            },
            expectedSerialization,
            serialization;

        expectedSerialization = {
            object: {
                value: {
                    string: "string",
                    number: 42,
                    regexp: {"/": {source: "regexp", flags: "gi"}},
                    array: {"@": "array"},
                    boolean: true,
                    nil: null,
                    object: {"@": "object"}
                }
            },
            array: {
                value: [1, 2, 3]
            },
            string: {
                value: "string"
            },
            number: {
                value: 42
            },
            regexp: {
                value: {"/": {source: "regexp", flags: "gi"}}
            },
            boolean: {
                value: true
            },
            nil: {
                value: null
            }
        };

        object.object = object;

        serialization = serializer.serialize(object);
        expect(JSON.parse(serialization))
            .toEqual(expectedSerialization);
    });

    describe("Montage objects serialization", function () {

        describe("types", function () {
            it("should serialize an empty class object", function () {
                var object = objects.Empty,
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        object: "serialization/testobjects-v2[Empty]",
                        properties: {
                            identifier: null
                        }
                    }
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize an empty instance object", function () {
                var object = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "serialization/testobjects-v2[Empty]",
                        properties: {
                            identifier: null
                        }
                    }
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize without the object name", function () {
                var object = objects.TestobjectsV2.create(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "serialization/testobjects-v2",
                        properties: {
                            identifier: null
                        }
                    }
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });
        });

        describe("elements", function () {
            it("should serialize an element", function () {
                var object = createFakeElement("id"),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        value: {"#": "id"}
                    }
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize an element as an object property", function () {
                var object = new objects.OneProp(),
                    element = createFakeElement("id"),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "serialization/testobjects-v2[OneProp]",
                        properties: {
                            identifier: null,
                            prop: {"#": "id"}
                        }
                    }
                };

                object.prop = element;

                serialization = serializer.serializeObject(object);

                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize an element multiple times", function () {
                var object = new objects.TwoProps(),
                    element = createFakeElement("id"),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "serialization/testobjects-v2[TwoProps]",
                        properties: {
                            identifier: null,
                            prop1: {"#": "id"},
                            prop2: {"#": "id"}
                        }
                    }
                };

                object.prop1 = element;
                object.prop2 = element;

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize an element from a different document", function () {
                var context = createJavaScriptContext(),
                    object = context.document.createElement("div"),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        value: {"#": "id"}
                    }
                };

                object.setAttribute("data-montage-id", "id");

                serialization = serializer.serializeObject(object);

                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });
        });

        describe("modules", function () {
            it("should serialize a module reference", function () {
                var object = createFakeModuleReference("pass"),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        value: {"%": "pass"}
                    }
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize an module reference as an object property", function () {
                var object = new objects.OneProp(),
                    ref = createFakeModuleReference("pass"),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "serialization/testobjects-v2[OneProp]",
                        properties: {
                            identifier: null,
                            prop: {"%": "pass"}
                        }
                    }
                };

                object.prop = ref;

                serialization = serializer.serializeObject(object);

                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize an module reference multiple times", function () {
                var object = new objects.TwoProps(),
                    ref = createFakeModuleReference("pass"),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "serialization/testobjects-v2[TwoProps]",
                        properties: {
                            identifier: null,
                            prop1: {"%": "pass"},
                            prop2: {"%": "pass"}
                        }
                    }
                };

                object.prop1 = ref;
                object.prop2 = ref;

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize a module reference from a different package", function () {
                var montageRequire = require.getPackage({name: "montage"}),
                    object = createFakeModuleReference("core/module-reference", montageRequire),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        value: {"%": "montage/core/module-reference"}
                    }
                };

                serialization = serializer.serializeObject(object);

                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should throw when there is no mapping to the module from a different package", function () {
                var montageRequire = require.getPackage({name: "montage"}),
                    object = createFakeModuleReference("pass", require),
                    serialization;

                // montageRequire has no mapping to this package, and so the
                // module reference cannot be serialized
                serializer = new MontageSerializer().initWithRequire(montageRequire);
                serializer.setSerializationIndentation(4);

                expect(function () {
                    serialization = serializer.serializeObject(object);
                }).toThrow();
            });
        });

        describe("properties", function () {
            it("shouldn't serialize undefined values", function () {
                var object = new objects.OneProp(),
                    undefined,
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "serialization/testobjects-v2[OneProp]",
                        properties: {
                            identifier: null
                        }
                    }
                };

                object.prop = undefined;

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize an instance object with an array property", function () {
                var object = new objects.OneProp(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "serialization/testobjects-v2[OneProp]",
                        properties: {
                            identifier: null,
                            prop: [1, 2, 3, 4, 5]
                        }
                    }
                };

                object.prop = [1, 2, 3, 4, 5];

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize an instance object with a distinct array property", function () {
                var object = new objects.DistinctArrayProp(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "serialization/testobjects-v2[DistinctArrayProp]",
                        properties: {
                            identifier: null,
                            prop: []
                        }
                    }
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization)).toEqual(expectedSerialization);
            });

            it("should serialize an instance object with a distinct literal property", function () {
                var object = new objects.DistinctLiteralProp(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "serialization/testobjects-v2[DistinctLiteralProp]",
                        properties: {
                            identifier: null,
                            prop: {}
                        }
                    }
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize an instance object with native type properties", function () {
                var object = new objects.Simple(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "serialization/testobjects-v2[Simple]",
                        properties: {
                            identifier: null,
                            number: 42,
                            string: "string"
                        }
                    }
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize according to the 'serializer' attribute", function () {
                var object = new objects.SerializableAttribute(),
                    prop1 = new objects.OneProp(),
                    prop2 = new objects.OneProp(),
                    expectedSerialization,
                    serialization;

                expectedSerialization = {
                    root: {
                        prototype: "serialization/testobjects-v2[SerializableAttribute]",
                        properties: {
                            prop1a: {"@": "oneprop"},
                            prop1b: {"@": "oneprop"},
                            prop2a: {"@": "oneprop2"},
                            prop2b: {"@": "oneprop2"},
                            identifier: null
                        }
                    },

                    oneprop: {
                        prototype: "serialization/testobjects-v2[OneProp]",
                        properties: {
                            prop: "prop1",
                            identifier: null
                        }
                    },

                    oneprop2: {}
                };

                prop1.prop = "prop1";
                prop2.prop = "prop2";
                object.prop1a = object.prop1b = prop1;
                object.prop2a = object.prop2b = prop2;

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });
        });

        describe("multiple references to the same object", function () {
            it("should serialize the same object first as reference then value", function () {
                var object = new objects.SerializableAttribute(),
                    empty = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                fakeGetSerializablePropertyNames(object, ["prop1a", "prop2a"]);

                expectedSerialization = {
                    root: {
                        prototype: "serialization/testobjects-v2[SerializableAttribute]",
                        properties: {
                            prop1a: {"@": "empty"},
                            prop2a: {"@": "empty"}
                        }
                    },
                    empty: {
                        prototype: "serialization/testobjects-v2[Empty]",
                        properties: {
                            identifier: null
                        }
                    }
                };

                object.prop1a = empty;
                object.prop2a = empty;
                serialization = serializer.serializeObject(object);

                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize the same object first as value then reference", function () {
                var object = new objects.SerializableAttribute(),
                    empty = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                fakeGetSerializablePropertyNames(object, ["prop2a", "prop1a"]);

                expectedSerialization = {
                    root: {
                        prototype: "serialization/testobjects-v2[SerializableAttribute]",
                        properties: {
                            prop2a: {"@": "empty"},
                            prop1a: {"@": "empty"}
                        }
                    },
                    empty: {
                        prototype: "serialization/testobjects-v2[Empty]",
                        properties: {
                            identifier: null
                        }
                    }
                };

                object.prop1a = empty;
                object.prop2a = empty;
                serialization = serializer.serializeObject(object);

                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });
        });

        it("should serialize two connected objects", function () {
            var object = new objects.OneProp(),
                simple = new objects.Simple(),
                serialization,
                expectedSerialization;

            expectedSerialization = {
                root: {
                    prototype: "serialization/testobjects-v2[OneProp]",
                    properties: {
                        identifier: null,
                        prop: {"@": "simple"}
                    }
                },

                simple: {
                    prototype: "serialization/testobjects-v2[Simple]",
                    properties: {
                        identifier: null,
                        number: 42,
                        string: "string"
                    }
                }
            };

            object.prop = simple;

            serialization = serializer.serializeObject(object);
            expect(JSON.parse(serialization)).toEqual(expectedSerialization);
        });

        it("should serialize two disconnected objects", function () {
            var object = new objects.Empty(),
                simple = new objects.Simple(),
                serialization,
                expectedSerialization;

            expectedSerialization = {
                anObject: {
                    prototype: "serialization/testobjects-v2[Empty]",
                    properties: {
                        identifier: null
                    }
                },

                anotherObject: {
                    prototype: "serialization/testobjects-v2[Simple]",
                    properties: {
                        identifier: null,
                        number: 42,
                        string: "string"
                    }
                }
            };

            object.prop = simple;

            serialization = serializer.serialize({anObject: object, anotherObject: simple});
            expect(JSON.parse(serialization)).toEqual(expectedSerialization);
        });

        describe("cycles", function () {
            it("should serialize an instance object that references itself", function () {
                var object = new objects.OneProp(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "serialization/testobjects-v2[OneProp]",
                        properties: {
                            identifier: null,
                            prop: {"@": "root"}
                        }
                    }
                };

                object.prop = object;

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize two instance objects with a mutual dependence", function () {
                var object = new objects.OneProp(),
                    oneProp = new objects.OneProp(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "serialization/testobjects-v2[OneProp]",
                        properties: {
                            identifier: null,
                            prop: {"@": "oneprop"}
                        }
                    },

                    oneprop: {
                        prototype: "serialization/testobjects-v2[OneProp]",
                        properties: {
                            prop: {"@": "root"},
                            identifier: null
                        }
                    }
                };

                object.prop = oneProp;
                oneProp.prop = object;

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });
        });

        describe("serializeProperties delegate", function () {
            it("should serialize native type property", function () {
                var object = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "serialization/testobjects-v2[Empty]",
                        properties: {
                            number: 42
                        }
                    }
                };

                object.serializeProperties = function (serializer) {
                    serializer.set("number", 42);
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize an object property", function () {
                var object = new objects.Empty(),
                    empty = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "serialization/testobjects-v2[Empty]",
                        properties: {
                            object: {"@": "empty"}
                        }
                    },

                    empty: {
                        prototype: "serialization/testobjects-v2[Empty]",
                        properties: {
                            identifier: null
                        }
                    }
                };

                object.serializeProperties = function (serializer) {
                    serializer.set("object", empty);
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize an object property as an external reference", function () {
                var object = new objects.Empty(),
                    empty = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "serialization/testobjects-v2[Empty]",
                        properties: {
                            object: {"@": "empty"}
                        }
                    },
                    empty: {}
                };

                object.serializeProperties = function (serializer) {
                    serializer.set("object", empty, "reference");
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize an external reference to an object that implements serializeSelf", function () {
                var object = new objects.Empty(),
                    empty = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "serialization/testobjects-v2[Empty]",
                        properties: {
                            object: {"@": "empty"}
                        }
                    },
                    empty: {}
                };

                object.serializeProperties = function (serializer) {
                    serializer.set("object", empty, "reference");
                };

                empty.serializeSelf = function (serializer) {
                    serializer.setProperty("object", {});
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize all properties", function () {
                var object = new objects.CustomAllProperties(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "serialization/testobjects-v2[CustomAllProperties]",
                        properties: {
                            identifier: null,
                            manchete: 42,
                            rodriguez: {"@": "empty"},
                            luz: {"@": "empty2"}
                        }
                    },
                    empty: {},
                    empty2: {
                        prototype: "serialization/testobjects-v2[Empty]",
                        properties: {
                            identifier: null
                        }
                    }
                };

                serialization = serializer.serializeObject(object);

                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize references to native types as value", function () {
                var object = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "serialization/testobjects-v2[Empty]",
                        properties: {
                            string: "string",
                            number: 42,
                            boolean: true,
                            nil: null
                        }
                    }
                };

                object.serializeProperties = function (serializer) {
                    serializer.set("string", "string", "reference");
                    serializer.set("number", 42, "reference");
                    serializer.set("boolean", true, "reference");
                    serializer.set("nil", null, "reference");
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should add objects", function () {
                var object = new objects.Empty(),
                    empty = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "serialization/testobjects-v2[Empty]"
                    },

                    empty: {
                        prototype: "serialization/testobjects-v2[Empty]",
                        properties: {
                            identifier: null
                        }
                    }
                };

                object.serializeProperties = function (serializer) {
                    serializer.addObject(empty);
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should ignore adding a native type as an object", function () {
                var object = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "serialization/testobjects-v2[Empty]"
                    }
                };

                object.serializeProperties = function (serializer) {
                    serializer.addObject("string");
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });
        });

        describe("serializeSelf delegate", function () {
            beforeEach(function () {
                MontageSerializer.defineSerializationUnit("unitA",
                function (serializer, object) {
                    if (object._unitA) {
                        return {
                            content: object._unitA
                        };
                    }
                });
                MontageSerializer.defineSerializationUnit("unitB",
                function (serializer, object) {
                    if (object._unitB) {
                        return {
                            content: object._unitB
                        };
                    }
                });
                MontageSerializer.initWithRequire(require);

                serializeSelfTestObject = new objects.TwoProps();
                serializeSelfTestObject.prop1 = "prop1";
                serializeSelfTestObject.prop2 = "prop2";
                serializeSelfTestObject._unitA = "unit-a content";
                serializeSelfTestObject._unitB = "unit-b content";
            });

            it("should only serialize the type", function () {
                var object = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "serialization/testobjects-v2[Empty]"
                    }
                };

                object.serializeSelf = function (serializer) {
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should only serialize the the properties", function () {
                var object = serializeSelfTestObject,
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "serialization/testobjects-v2[TwoProps]",
                        properties: {
                            identifier: null,
                            prop1: "prop1",
                            prop2: "prop2"
                        }
                    }
                };

                object.serializeSelf = function (serializer) {
                    serializer.setAllProperties();
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should only serialize unit A", function () {
                var object = serializeSelfTestObject,
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "serialization/testobjects-v2[TwoProps]",
                        unitA: {
                            content: "unit-a content"
                        }
                    }
                };

                object.serializeSelf = function (serializer) {
                    serializer.setUnit("unitA");
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should only serialize unit A and unit B explicitly", function () {
                var object = serializeSelfTestObject,
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "serialization/testobjects-v2[TwoProps]",
                        unitA: {
                            content: "unit-a content"
                        },
                        unitB: {
                            content: "unit-b content"
                        }
                    }
                };

                object.serializeSelf = function (serializer) {
                    serializer.setUnit("unitA");
                    serializer.setUnit("unitB");
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should only serialize all units", function () {
                var object = serializeSelfTestObject,
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "serialization/testobjects-v2[TwoProps]",
                        unitA: {
                            content: "unit-a content"
                        },
                        unitB: {
                            content: "unit-b content"
                        }
                    }
                };

                object.serializeSelf = function (serializer) {
                    serializer.setAllUnits();
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize a native type property", function () {
                var object = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "serialization/testobjects-v2[Empty]",
                        properties: {
                            manchete: 42
                        }
                    }
                };

                object.serializeSelf = function (serializer) {
                    serializer.setProperty("manchete", 42);
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize an object property", function () {
                var object = new objects.Empty(),
                    empty = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "serialization/testobjects-v2[Empty]",
                        properties: {
                            object: {"@": "empty"}
                        }
                    },

                    empty: {
                        prototype: "serialization/testobjects-v2[Empty]",
                        properties: {
                            identifier: null
                        }
                    }
                };

                object.serializeSelf = function (serializer) {
                    serializer.setProperty("object", empty);
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize an object property as an external reference", function () {
                var object = new objects.Empty(),
                    empty = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "serialization/testobjects-v2[Empty]",
                        properties: {
                            object: {"@": "empty"}
                        }
                    },
                    empty: {}
                };

                object.serializeSelf = function (serializer) {
                    serializer.setProperty("object", empty, "reference");
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize a subtitute object", function () {
                var object = new objects.Simple(),
                    empty = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "serialization/testobjects-v2[Empty]",
                        properties: {
                            identifier: null
                        }
                    }
                };

                object.serializeSelf = function (serializer) {
                    return empty;
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize a subtitute object that is an object literal", function () {
                var object = new objects.Simple(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        value: {
                            substituteObject: true
                        }
                    }
                };

                object.serializeSelf = function (serializer) {
                    return {
                        substituteObject: true
                    };
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize a substitute object that has already been serialized", function () {
                var object = new objects.TwoProps(),
                    simple = new objects.Simple(),
                    empty = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "serialization/testobjects-v2[TwoProps]",
                        properties: {
                            prop1: {"@": "simple"},
                            prop2: {"@": "simple"}
                        }
                    },
                    simple: {
                        prototype: "serialization/testobjects-v2[Simple]",
                        properties: {
                            identifier: null,
                            number: 42,
                            string: "string"
                        }
                    }
                };

                object.serializeProperties = function (serializer) {
                    serializer.set("prop1", simple);
                    serializer.set("prop2", empty);
                };

                empty.serializeSelf = function (serializer) {
                    return simple;
                };

                serialization = serializer.serializeObject(object);

                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize a reference to a substitute object, when serializing a reference to the proxy object, that has already been serialized", function () {
                var object = new objects.TwoProps(),
                    simple = new objects.Simple(),
                    empty = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "serialization/testobjects-v2[TwoProps]",
                        properties: {
                            prop1: {"@": "simple"},
                            prop2: {"@": "simple"}
                        }
                    },
                    simple: {
                        prototype: "serialization/testobjects-v2[Simple]",
                        properties: {
                            identifier: null,
                            number: 42,
                            string: "string"
                        }
                    }
                };

                object.serializeProperties = function (serializer) {
                    serializer.set("prop1", empty);
                    serializer.set("prop2", empty, "reference");
                };

                empty.serializeSelf = function (serializer) {
                    return simple;
                };

                serialization = serializer.serializeObject(object);

                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize a substitute object for an object that has a user defined label", function () {
                var object = new objects.Simple(),
                    empty = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    object: {
                        prototype: "serialization/testobjects-v2[Empty]",
                        properties: {
                            identifier: null
                        }
                    }
                };

                object.serializeSelf = function (serializer) {
                    return empty;
                };

                serialization = serializer.serialize({object: object});
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize a substitute object, with a self reference, for an object that has a user defined label", function () {
                var object = new objects.Simple(),
                    oneProp = new objects.OneProp(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "serialization/testobjects-v2[OneProp]",
                        properties: {
                            identifier: null,
                            prop: {"@": "root"}
                        }
                    }
                };

                object.serializeSelf = function (serializer) {
                    return oneProp;
                };

                oneProp.prop = oneProp;

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize a substitute object, with a reference to the substituted object, for an object that has a user defined label", function () {
                var object = new objects.Simple(),
                    oneProp = new objects.OneProp(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "serialization/testobjects-v2[OneProp]",
                        properties: {
                            identifier: null,
                            prop: {"@": "root"}
                        }
                    }
                };

                object.serializeSelf = function (serializer) {
                    return oneProp;
                };

                oneProp.prop = object;

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize a substitute object, that has already been serialized, for an object that has a user defined label", function () {
                var object = new objects.TwoProps(),
                    simple = new objects.Simple(),
                    empty = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "serialization/testobjects-v2[TwoProps]",
                        properties: {
                            prop1: {"@": "empty"},
                            prop2: {"@": "empty"}
                        }
                    },
                    empty: {
                        prototype: "serialization/testobjects-v2[Simple]",
                        properties: {
                            identifier: null,
                            number: 42,
                            string: "string"
                        }
                    }
                };

                object.serializeProperties = function (serializer) {
                    serializer.set("prop1", simple);
                    serializer.set("prop2", empty);
                };

                empty.serializeSelf = function (serializer) {
                    return simple;
                };

                serialization = serializer.serialize({root: object, empty: empty});
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize a substitute object for an object where both object and substitute object have a user defined label", function () {
                var object = new objects.Simple(),
                    empty = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    empty: {
                        prototype: "serialization/testobjects-v2[Empty]",
                        properties: {
                            identifier: null
                        }
                    }
                };

                object.serializeSelf = function (serializer) {
                    return empty;
                };

                serialization = serializer.serialize({object: object, empty: object});
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize a substitute object of an object that was added with serializeProperties' addObject", function () {
                var object = new objects.Empty(),
                    simple = new objects.Simple(),
                    empty = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "serialization/testobjects-v2[Empty]"
                    },

                    simple: {
                        prototype: "serialization/testobjects-v2[Simple]",
                        properties: {
                            identifier: null,
                            number: 42,
                            string: "string"
                        }
                    }
                };

                object.serializeProperties = function (serializer) {
                    serializer.addObject(empty);
                };

                empty.serializeSelf = function (serializer) {
                    return simple;
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize a substitute object of an object that was added with serializeSelf's addObject", function () {
                var object = new objects.Empty(),
                    simple = new objects.Simple(),
                    empty = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "serialization/testobjects-v2[Empty]"
                    },

                    simple: {
                        prototype: "serialization/testobjects-v2[Simple]",
                        properties: {
                            identifier: null,
                            number: 42,
                            string: "string"
                        }
                    }
                };

                object.serializeSelf = function (serializer) {
                    serializer.addObject(empty);
                };

                empty.serializeSelf = function (serializer) {
                    return simple;
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize a chain of substitute objects", function () {
                var object = new objects.Empty(),
                    simple = new objects.Simple(),
                    oneProp = new objects.OneProp(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "serialization/testobjects-v2[OneProp]",
                        properties: {
                            identifier: null,
                            prop: null
                        }
                    }
                };

                object.serializeSelf = function (serializer) {
                    return simple;
                };

                simple.serializeSelf = function (serializer) {
                    return oneProp;
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should add objects", function () {
                var object = new objects.Empty(),
                    empty = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "serialization/testobjects-v2[Empty]"
                    },

                    empty: {
                        prototype: "serialization/testobjects-v2[Empty]",
                        properties: {
                            identifier: null
                        }
                    }
                };

                object.serializeSelf = function (serializer) {
                    serializer.addObject(empty);
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should ignore adding a native type as an object", function () {
                var object = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "serialization/testobjects-v2[Empty]"
                    }
                };

                object.serializeSelf = function (serializer) {
                    serializer.addObject("string");
                };

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize a substitute object when both object and substitute object have a user defined label", function () {
                var object = new objects.TwoProps(),
                    simple = new objects.Simple(),
                    empty = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "serialization/testobjects-v2[TwoProps]",
                        properties: {
                            prop1: {"@": "empty"},
                            prop2: {"@": "empty"}
                        }
                    },
                    simple: {
                        value: {"@": "empty"}
                    },
                    empty: {
                        prototype: "serialization/testobjects-v2[Simple]",
                        properties: {
                            identifier: null,
                            number: 42,
                            string: "string"
                        }
                    }
                };

                object.serializeProperties = function (serializer) {
                    serializer.set("prop1", simple);
                    serializer.set("prop2", empty);
                };

                empty.serializeSelf = function (serializer) {
                    return simple;
                };

                serialization = serializer.serialize({root: object, empty: empty, simple: simple});
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });
        });

        describe("labels", function () {
            it("should serialize an object using its identifier property as the label", function () {
                var object = new objects.OneProp(),
                    empty = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "serialization/testobjects-v2[OneProp]",
                        properties: {
                            identifier: null,
                            prop: {"@": "anObject"}
                        }
                    },

                    anObject: {
                        prototype: "serialization/testobjects-v2[Empty]",
                        properties: {
                            identifier: "anObject"
                        }
                    }
                };

                object.prop = empty;
                empty.identifier = "anObject";

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should not serialize an object using its identifier property as the label if it's invalid", function () {
                var object = new objects.OneProp(),
                    empty = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "serialization/testobjects-v2[OneProp]",
                        properties: {
                            identifier: null,
                            prop: {"@": "empty"}
                        }
                    },

                    empty: {
                        prototype: "serialization/testobjects-v2[Empty]",
                        properties: {
                            identifier: "an-object"
                        }
                    }
                };

                object.prop = empty;
                empty.identifier = "an-object";

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should avoid name clashes between given labels and generated labels from identifier", function () {
                var object = new objects.OneProp(),
                    empty = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    generated: {
                        prototype: "serialization/testobjects-v2[OneProp]",
                        properties: {
                            prop: {"@": "generated2"},
                            identifier: null
                        }
                    },

                    generated2: {
                        prototype: "serialization/testobjects-v2[Empty]",
                        properties: {
                            identifier: "generated"
                        }
                    }
                };

                object.prop = empty;
                empty.identifier = "generated";

                serialization = serializer.serialize({generated: object});
                expect(JSON.parse(serialization))
                    .toEqual(expectedSerialization);
            });
        });

        describe("external references", function () {
            it("should serialize an external reference", function () {
                var object = new objects.OneReferenceProp(),
                    empty = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "serialization/testobjects-v2[OneReferenceProp]",
                        properties: {
                            identifier: null,
                            referenceProp: {"@": "empty"}
                        }
                    },
                    empty: {}
                };

                object.referenceProp = empty;
                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should not consider an object that was referenced and then serialized as an external object", function () {
                var object = new objects.OneProp(),
                    oneProp = new objects.OneProp(),
                    externalObjects,
                    serialization;

                object.serializeProperties = function (serializer) {
                    serializer.set("object1", oneProp, "reference");
                    serializer.set("object2", oneProp);
                };

                serialization = serializer.serializeObject(object);
                externalObjects = serializer.getExternalObjects();

                expect(Object.keys(externalObjects).length).toBe(0);
            });

            it("should return all external objects", function () {
                var object = new objects.Empty(),
                    empty = new objects.Empty(),
                    simple = new objects.Simple(),
                    serialization,
                    externalObjects;

                object.serializeSelf = function (serializer) {
                    serializer.setProperty("external", simple, "reference");
                    serializer.setProperty("internal", empty);
                };

                serialization = serializer.serializeObject(object);
                externalObjects = serializer.getExternalObjects();

                expect(Object.keys(externalObjects).length).toBe(1);
                expect(externalObjects.simple).toBe(simple);
            })
        });

        describe("serialization units", function () {
            it("should serialize native values in serialization unit", function () {
                var object = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "serialization/testobjects-v2[Empty]",
                        properties: {
                            identifier: null
                        },
                        testing: {
                            number: 42,
                            string: "string"
                        }
                    }
                };

                MontageSerializer.defineSerializationUnit("testing", function (serializer, object) {
                    return {
                        number: 42,
                        string: "string"
                    };
                });
                serializer.initWithRequire(require);

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize references in serialization unit", function () {
                var object = new objects.Empty(),
                    simple = new objects.Simple(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "serialization/testobjects-v2[Empty]",
                        properties: {
                            identifier: null
                        },
                        testing: {
                            simpleRef1: {"@": "simple"},
                            simpleRef2: {"@": "simple"}
                        }
                    },
                    simple: {}
                };

                MontageSerializer.defineSerializationUnit("testing", function (serializer, object) {
                    var simpleRef = serializer.addObjectReference(simple);

                    return {
                        simpleRef1: simpleRef,
                        simpleRef2: simpleRef
                    };
                });
                serializer.initWithRequire(require);

                serialization = serializer.serializeObject(object);

                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should first serialize the object then a reference in serialization unit", function () {
                var object = new objects.Empty(),
                    simple = new objects.Simple(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "serialization/testobjects-v2[Empty]",
                        properties: {
                            identifier: null
                        },
                        testing: {
                            simpleRef: {"@": "simple"},
                            simple: {"@": "simple"}
                        }
                    },
                    simple: {
                        prototype: "serialization/testobjects-v2[Simple]",
                        properties: {
                            identifier: null,
                            number: 42,
                            string: "string"
                        }
                    }
                };

                MontageSerializer.defineSerializationUnit("testing", function (serializer, _object) {
                    if (_object !== object) {
                        return;
                    }

                    var simpleRef = serializer.addObjectReference(simple);

                    return {
                        simpleRef: simpleRef,
                        simple: simple
                    };
                });
                serializer.initWithRequire(require);

                serialization = serializer.serializeObject(object);

                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should first serialize a reference then the object in serialization unit", function () {
                var object = new objects.Empty(),
                    simple = new objects.Simple(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "serialization/testobjects-v2[Empty]",
                        properties: {
                            identifier: null
                        },
                        testing: {
                            simpleRef: {"@": "simple"},
                            simple: {"@": "simple"}
                        }
                    },
                    simple: {
                        prototype: "serialization/testobjects-v2[Simple]",
                        properties: {
                            identifier: null,
                            number: 42,
                            string: "string"
                        }
                    }
                };

                MontageSerializer.defineSerializationUnit("testing", function (serializer, _object) {
                    if (_object !== object) {
                        return;
                    }

                    var simpleRef = serializer.addObjectReference(simple);

                    return {
                        simple: simple,
                        simpleRef: simpleRef
                    };
                });
                serializer.initWithRequire(require);

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

            it("should serialize a parentless object in serialization unit", function () {
                var object = new objects.Simple(),
                    empty = new objects.Empty(),
                    serialization,
                    expectedSerialization;

                expectedSerialization = {
                    root: {
                        prototype: "serialization/testobjects-v2[Simple]",
                        properties: {
                            identifier: null,
                            number: 42,
                            string: "string"
                        }
                    },
                    empty: {
                        prototype: "serialization/testobjects-v2[Empty]",
                        properties: {
                            identifier: null
                        }
                    }
                };

                MontageSerializer.defineSerializationUnit("testing", function (serializer, _object) {
                    if (_object !== object) {
                        return;
                    }

                    serializer.addObject(empty);
                });
                serializer.initWithRequire(require);

                serialization = serializer.serializeObject(object);
                expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
            });

        });
    });

    describe("Template properties serialization", function () {
        it("should serialize a template property alias", function () {
            var object = {
                    ":templateProperty": new Alias().init("@component:propertyName")
                },
                expectedSerialization,
                serialization;

            expectedSerialization = {
                ":templateProperty": {
                    "alias": "@component:propertyName"
                }
            };

            serialization = serializer.serialize(object);
            expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
        });

        it("should not serialize a alias outside a template property", function () {
            var object = {
                    "property": new Alias().init("@component:propertyName")
                };

            expect(function () {
                serializer.serialize(object);
            }).toThrow();
        });

        it("should not serialize a value with a template property label", function () {
            var object = {
                ":property": 42
            };

            expect(function () {
                serializer.serialize(object);
            }).toThrow();
        });

        it("should not serialize an object literal with a template property label", function () {
            var object = {
                ":property": {}
            };

            expect(function () {
                serializer.serialize(object);
            }).toThrow();
        });

        it("should not serialize a regexp with a template property label", function () {
            var object = {
                ":property": /regexp/
            };

            expect(function () {
                serializer.serialize(object);
            }).toThrow();
        });

        it("should not serialize a montage object with a template property label", function () {
            var object = {
                ":property": objects.Empty
            };

            expect(function () {
                serializer.serialize(object);
            }).toThrow();
        });
    });
});
