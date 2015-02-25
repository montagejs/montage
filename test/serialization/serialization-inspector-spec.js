/* <copyright>
Copyright (c) 2013, António Afonso
All Rights Reserved.
</copyright> */
var Montage = require("montage").Montage,
    SerializationInspector = require("montage/core/serialization/serialization").SerializationInspector,
    Serialization = require("montage/core/serialization/serialization").Serialization;

describe("reel/serialization/serialization-inspector-spec", function () {
    var inspector;

    beforeEach(function () {
        inspector = new SerializationInspector();
    });

    describe("visitor", function () {
        it("should visit a number", function () {
            var object = {
                    "object": {
                        "value": 42
                    }
                },
                serialization = new Serialization().initWithObject(object),
                visitor = jasmine.createSpy('visitor'),
                args;

            inspector.initWithSerialization(serialization);
            inspector.visitSerialization(visitor);

            args = visitor.argsForCall[0];
            expect(args[0].type).toBe("number");
            expect(args[0].label).toBe("object");
            expect(args[0].data).toBe(object.object.value);
        });

        it("should visit a string", function () {
            var object = {
                    "object": {
                        "value": "a string"
                    }
                },
                serialization = new Serialization().initWithObject(object),
                visitor = jasmine.createSpy('visitor'),
                args;

            inspector.initWithSerialization(serialization);
            inspector.visitSerialization(visitor);

            args = visitor.argsForCall[0];
            expect(args[0].type).toBe("string");
            expect(args[0].label).toBe("object");
            expect(args[0].data).toBe(object.object.value);
        });

        it("should visit a regexp", function () {
            var object = {
                    "object": {
                        "value": {"/": {"source": "regexp"}}
                    }
                },
                serialization = new Serialization().initWithObject(object),
                visitor = jasmine.createSpy('visitor'),
                args;

            inspector.initWithSerialization(serialization);
            inspector.visitSerialization(visitor);

            args = visitor.argsForCall[0];
            expect(args[0].type).toBe("regexp");
            expect(args[0].label).toBe("object");
            expect(args[0].data).toEqual(object.object.value["/"]);
        });

        it("should visit a null", function () {
            var object = {
                    "object": {
                        "value": null
                    }
                },
                serialization = new Serialization().initWithObject(object),
                visitor = jasmine.createSpy('visitor'),
                args;

            inspector.initWithSerialization(serialization);
            inspector.visitSerialization(visitor);

            args = visitor.argsForCall[0];
            expect(args[0].type).toBe("null");
            expect(args[0].label).toBe("object");
            expect(args[0].data).toBe(object.object.value);
        });

        it("should visit an array", function () {
            var object = {
                    "object": {
                        "value": ["a string", 42]
                    }
                },
                serialization = new Serialization().initWithObject(object),
                visitor = jasmine.createSpy('visitor'),
                args;

            inspector.initWithSerialization(serialization);
            inspector.visitSerialization(visitor);

            args = visitor.argsForCall[0];
            expect(args[0].type).toBe("array");
            expect(args[0].label).toBe("object");
            expect(args[0].data).toEqual(object.object.value);

            args = visitor.argsForCall[1];
            expect(args[0].type).toBe("string");
            expect(args[0].name).toBe("0");
            expect(args[0].data).toBe(object.object.value[0]);

            args = visitor.argsForCall[2];
            expect(args[0].type).toBe("number");
            expect(args[0].name).toBe("1");
            expect(args[0].data).toBe(object.object.value[1]);
        });

        it("should visit an object", function () {
            var object = {
                    "object": {
                        "value": {
                            "name": "a string",
                            "id": 42
                        }
                    }
                },
                serialization = new Serialization().initWithObject(object),
                visitor = jasmine.createSpy('visitor'),
                args;

            inspector.initWithSerialization(serialization);
            inspector.visitSerialization(visitor);

            args = visitor.argsForCall[0];
            expect(args[0].type).toBe("object");
            expect(args[0].label).toBe("object");
            expect(args[0].data).toEqual(object.object.value);

            args = visitor.argsForCall[1];
            expect(args[0].type).toBe("string");
            expect(args[0].name).toBe("name");
            expect(args[0].data).toBe(object.object.value.name);

            args = visitor.argsForCall[2];
            expect(args[0].type).toBe("number");
            expect(args[0].name).toBe("id");
            expect(args[0].data).toBe(object.object.value.id);
        });

        it("should visit a reference", function () {
            var object = {
                    "object": {
                        "value": {"@": "label"}
                    }
                },
                serialization = new Serialization().initWithObject(object),
                visitor = jasmine.createSpy('visitor'),
                args;

            inspector.initWithSerialization(serialization);
            inspector.visitSerialization(visitor);

            args = visitor.argsForCall[0];
            expect(args[0].type).toBe("reference");
            expect(args[0].label).toBe("object");
            expect(args[0].data).toBe(object.object.value["@"]);
        });

        it("should visit an element", function () {
            var object = {
                    "object": {
                        "value": {"#": "label"}
                    }
                },
                serialization = new Serialization().initWithObject(object),
                visitor = jasmine.createSpy('visitor'),
                args;

            inspector.initWithSerialization(serialization);
            inspector.visitSerialization(visitor);

            args = visitor.argsForCall[0];
            expect(args[0].type).toBe("Element");
            expect(args[0].label).toBe("object");
            expect(args[0].data).toBe(object.object.value["#"]);
        });

        it("should visit a single object", function () {
            var object = {
                    "object": {
                        "value": {
                            "name": "a string",
                            "id": 42
                        }
                    },

                    "foo": {
                        "value": "a string"
                    },

                    "bar": {
                        "value": 42
                    }
                },
                serialization = new Serialization().initWithObject(object),
                visitor = jasmine.createSpy('visitor'),
                args;

            inspector.initWithSerialization(serialization);
            inspector.visitSerializationObject("foo", visitor);

            args = visitor.argsForCall[0];
            expect(args[0].type).toBe("string");
            expect(args[0].label).toBe("foo");
            expect(args[0].data).toEqual(object.foo.value);
        });

        it("should visit a montage object", function () {
            var object = {
                    "text": {
                        "prototype": "montage/ui/text.reel",
                        "properties": {
                            "identifier": "text"
                        }
                    }
                },
                serialization = new Serialization().initWithObject(object),
                visitorSpy;

            visitorSpy = jasmine.createSpy('visitor');

            inspector.initWithSerialization(serialization);
            inspector.visitSerialization(visitorSpy);

            args = visitorSpy.argsForCall[0];
            expect(args[0].type).toBe("montageObject");
            expect(args[0].data).toEqual(object.text);

            args = visitorSpy.argsForCall[1];
            expect(args[0].type).toBe("object");
            expect(args[0].data).toEqual(object.text.properties);

            args = visitorSpy.argsForCall[2];
            expect(args[0].type).toBe("string");
            expect(args[0].data).toEqual(object.text.properties.identifier);
        });

        it("should visit bindings", function () {
            var object = {
                    "text": {
                        "prototype": "montage/ui/text.reel",
                        "bindings": {
                            "value": {"<-": "path"}
                        }
                    }
                },
                serialization = new Serialization().initWithObject(object),
                visitorSpy;

            visitorSpy = jasmine.createSpy('visitor');

            inspector.initWithSerialization(serialization);
            inspector.visitSerialization(visitorSpy);

            args = visitorSpy.argsForCall[1];
            expect(args[0].type).toBe("bindings");
            expect(args[0].data).toEqual(object.text.bindings);
        });

        it("should visit a binding", function () {
            var object = {
                    "text": {
                        "prototype": "montage/ui/text.reel",
                        "bindings": {
                            "value": {"<-": "path"}
                        }
                    }
                },
                serialization = new Serialization().initWithObject(object),
                visitorSpy;

            visitorSpy = jasmine.createSpy('visitor');

            inspector.initWithSerialization(serialization);
            inspector.visitSerialization(visitorSpy);

            args = visitorSpy.argsForCall[2];
            expect(args[0].type).toBe("binding");
            expect(args[0].name).toBe("value");
            expect(args[0].data).toEqual(object.text.bindings.value);
        });

        it("should visit a binding reference", function () {
            var object = {
                    "text": {
                        "prototype": "montage/ui/text.reel",
                        "bindings": {
                            "value": {"<-": "@object"}
                        }
                    }
                },
                serialization = new Serialization().initWithObject(object),
                visitorSpy;

            visitorSpy = jasmine.createSpy('visitor');

            inspector.initWithSerialization(serialization);
            inspector.visitSerialization(visitorSpy);

            args = visitorSpy.argsForCall[3];
            expect(args[0].type).toBe("reference");
            expect(args[0].data).toBe("object");
        });

        it("should visit complex binding references", function () {
            var object = {
                    "text": {
                        "prototype": "montage/ui/text.reel",
                        "bindings": {
                            "value": {"<-": "@objects.filter{@owner.selected}"}
                        }
                    }
                },
                serialization = new Serialization().initWithObject(object),
                visitorSpy;

            visitorSpy = jasmine.createSpy('visitor');

            inspector.initWithSerialization(serialization);
            inspector.visitSerialization(visitorSpy);

            args = visitorSpy.argsForCall[3];
            expect(args[0].type).toBe("reference");
            expect(args[0].data).toBe("objects");

            args = visitorSpy.argsForCall[4];
            expect(args[0].type).toBe("reference");
            expect(args[0].data).toBe("owner");
        });

        it("should visit a binding converter", function () {
            var serialization = new Serialization().initWithObject({
                    "text": {
                        "prototype": "montage/ui/text.reel",
                        "bindings": {
                            "value": {
                                "<-": "@object",
                                "converter": {"@": "converter"}
                            }
                        }
                    }
                }),
                visitorSpy;

            visitorSpy = jasmine.createSpy('visitor');

            inspector.initWithSerialization(serialization);
            inspector.visitSerialization(visitorSpy);

            args = visitorSpy.argsForCall[4];
            expect(args[0].type).toBe("reference");
            expect(args[0].data).toBe("converter");
        });

        it("should visit localizations", function () {
            var object = {
                    "text": {
                        "prototype": "montage/ui/text.reel",
                        "localizations": {
                            "value": {"key": "hello"}
                        }
                    }
                },
                serialization = new Serialization().initWithObject(object),
                visitorSpy;

            visitorSpy = jasmine.createSpy('visitor');

            inspector.initWithSerialization(serialization);
            inspector.visitSerialization(visitorSpy);

            args = visitorSpy.argsForCall[1];
            expect(args[0].type).toBe("localizations");
            expect(args[0].data).toEqual(object.text.localizations);
        });

        it("should visit a localization", function () {
            var object = {
                    "text": {
                        "prototype": "montage/ui/text.reel",
                        "localizations": {
                            "value": {"key": "hello"}
                        }
                    }
                },
                serialization = new Serialization().initWithObject(object),
                visitorSpy;

            visitorSpy = jasmine.createSpy('visitor');

            inspector.initWithSerialization(serialization);
            inspector.visitSerialization(visitorSpy);

            args = visitorSpy.argsForCall[2];
            expect(args[0].type).toBe("localization");
            expect(args[0].name).toBe("value");
            expect(args[0].data).toEqual(object.text.localizations.value);
        });

        it("should visit localization references", function () {
            var object = {
                    "text": {
                        "prototype": "montage/ui/text.reel",
                        "localizations": {
                            "value": {
                                "key": {"<-": "@owner.value"}
                            }
                        }
                    }
                },
                serialization = new Serialization().initWithObject(object),
                visitorSpy;

            visitorSpy = jasmine.createSpy('visitor');

            inspector.initWithSerialization(serialization);
            inspector.visitSerialization(visitorSpy);

            args = visitorSpy.argsForCall[3];
            expect(args[0].type).toBe("reference");
            expect(args[0].data).toEqual("owner");
        });
    });

    describe("modifications", function () {
        it("should modify a number", function () {
            var serialization = new Serialization().initWithObject({
                    "object": {
                        "value": 42
                    }
                }),
                expectedSerialization = {
                    "object": {
                        "value": 3.14
                    }
                },
                visitor,
                visitorSpy,
                args;

            visitor = function (node) {
                node.data = 3.14;
            };

            visitorSpy = jasmine.createSpy('visitor').andCallFake(visitor);

            inspector.initWithSerialization(serialization);
            inspector.visitSerialization(visitorSpy);

            expect(serialization.getSerializationObject())
                .toEqual(expectedSerialization);
        });

        it("should modify a string", function () {
            var serialization = new Serialization().initWithObject({
                    "object": {
                        "value": "a string"
                    }
                }),
                expectedSerialization = {
                    "object": {
                        "value": "another string"
                    }
                },
                visitor,
                visitorSpy,
                args;

            visitor = function (node) {
                node.data = "another string";
            };

            visitorSpy = jasmine.createSpy('visitor').andCallFake(visitor);

            inspector.initWithSerialization(serialization);
            inspector.visitSerialization(visitorSpy);

            expect(serialization.getSerializationObject())
                .toEqual(expectedSerialization);
        });

        it("should modify a regexp", function () {
            var serialization = new Serialization().initWithObject({
                    "object": {
                        "value": {"/": {"source": "regexp"}}
                    }
                }),
                expectedSerialization = {
                    "object": {
                        "value": {"/": {"source": "regexp", "flags": "gi"}}
                    }
                },
                visitor,
                visitorSpy,
                args;

            visitor = function (node) {
                node.data.flags = "gi";
            };

            visitorSpy = jasmine.createSpy('visitor').andCallFake(visitor);

            inspector.initWithSerialization(serialization);
            inspector.visitSerialization(visitorSpy);

            expect(serialization.getSerializationObject())
                .toEqual(expectedSerialization);
        });

        it("should modify a null", function () {
            var serialization = new Serialization().initWithObject({
                    "object": {
                        "value": null
                    }
                }),
                expectedSerialization = {
                    "object": {
                        "value": "not a null"
                    }
                },
                visitor,
                visitorSpy,
                args;

            visitor = function (node) {
                node.data = "not a null";
            };

            visitorSpy = jasmine.createSpy('visitor').andCallFake(visitor);

            inspector.initWithSerialization(serialization);
            inspector.visitSerialization(visitorSpy);

            expect(serialization.getSerializationObject())
                .toEqual(expectedSerialization);
        });

        it("should modify an array", function () {
            var serialization = new Serialization().initWithObject({
                    "object": {
                        "value": [1, 2, 3]
                    }
                }),
                expectedSerialization = {
                    "object": {
                        "value": [4, 5, 6]
                    }
                },
                visitor,
                visitorSpy,
                args;

            visitor = function (node) {
                if (node.type === "array") {
                    node.data = [4, 5, 6];
                }
            };

            visitorSpy = jasmine.createSpy('visitor').andCallFake(visitor);

            inspector.initWithSerialization(serialization);
            inspector.visitSerialization(visitorSpy);

            expect(serialization.getSerializationObject())
                .toEqual(expectedSerialization);
        });

        it("should modify an object", function () {
            var serialization = new Serialization().initWithObject({
                    "object": {
                        "value": {
                            "string": "a string"
                        }
                    }
                }),
                expectedSerialization = {
                    "object": {
                        "value": {
                            "number": 42
                        }
                    }
                },
                visitor,
                visitorSpy,
                args;

            visitor = function (node) {
                if (node.type === "object") {
                    node.data = {number: 42};
                }
            };

            visitorSpy = jasmine.createSpy('visitor').andCallFake(visitor);

            inspector.initWithSerialization(serialization);
            inspector.visitSerialization(visitorSpy);

            expect(serialization.getSerializationObject())
                .toEqual(expectedSerialization);
        });

        it("should modify a reference", function () {
            var serialization = new Serialization().initWithObject({
                    "object": {
                        "value": {"@": "string"}
                    }
                }),
                expectedSerialization = {
                    "object": {
                        "value": {"@": "number"}
                    }
                },
                visitor,
                visitorSpy,
                args;

            visitor = function (node) {
                node.data = "number";
            };

            visitorSpy = jasmine.createSpy('visitor').andCallFake(visitor);

            inspector.initWithSerialization(serialization);
            inspector.visitSerialization(visitorSpy);

            expect(serialization.getSerializationObject())
                .toEqual(expectedSerialization);
        });

        it("should modify a label", function () {
            var serialization = new Serialization().initWithObject({
                    "object1": {
                        "value": {
                            "string": "a string 1"
                        }
                    },
                    "object2": {
                        "value": {
                            "string": "a string 2"
                        }
                    }
                }),
                expectedSerialization = {
                    "object": {
                        "value": {
                            "string": "a string 1"
                        }
                    },
                    "object2": {
                        "value": {
                            "string": "a string 2"
                        }
                    }
                },
                visitor,
                visitorSpy,
                args;

            visitor = function (node) {
                if (node.label === "object1") {
                    node.label = "object";
                }
            };

            visitorSpy = jasmine.createSpy('visitor').andCallFake(visitor);

            inspector.initWithSerialization(serialization);
            inspector.visitSerialization(visitorSpy);

            expect(serialization.getSerializationObject())
                .toEqual(expectedSerialization);
        });

        it("should modify a label of a montage object", function () {
            var serialization = new Serialization().initWithObject({
                    "object1": {
                        "prototype": "montage/ui/text.reel"
                    }
                }),
                expectedSerialization = {
                    "object": {
                        "prototype": "montage/ui/text.reel"
                    }
                },
                visitor,
                visitorSpy,
                args;

            visitor = function (node) {
                if (node.label === "object1") {
                    node.label = "object";
                }
            };

            visitorSpy = jasmine.createSpy('visitor').andCallFake(visitor);

            inspector.initWithSerialization(serialization);
            inspector.visitSerialization(visitorSpy);

            expect(serialization.getSerializationObject())
                .toEqual(expectedSerialization);
        });

        it("should modify binding references", function () {
            var serialization = new Serialization().initWithObject({
                    "text": {
                        "prototype": "montage/ui/text.reel",
                        "bindings": {
                            "value": {"<-": "@object"}
                        }
                    }
                }),
                expectedSerialization = {
                    "text": {
                        "prototype": "montage/ui/text.reel",
                        "bindings": {
                            "value": {"<-": "@array"}
                        }
                    }
                },
                visitorSpy,
                visitor;

            visitor = function (node) {
                if (node.type === "reference") {
                    node.data = "array";
                }
            }

            visitorSpy = jasmine.createSpy('visitor').andCallFake(visitor);

            inspector.initWithSerialization(serialization);
            inspector.visitSerialization(visitorSpy);
            expect(serialization.getSerializationObject())
                .toEqual(expectedSerialization);
        });

        it("should modify complex binding references", function () {
            var serialization = new Serialization().initWithObject({
                    "text": {
                        "prototype": "montage/ui/text.reel",
                        "bindings": {
                            "value": {"<-": "@objects.filter{@owner.selected}"}
                        }
                    }
                }),
                expectedSerialization = {
                    "text": {
                        "prototype": "montage/ui/text.reel",
                        "bindings": {
                            "value": {"<-": "@objects2.filter{@owner2.selected}"}
                        }
                    }
                },
                visitorSpy,
                visitor;

            visitor = function (node) {
                if (node.type === "reference") {
                    if (node.data == "objects") {
                        node.data = "objects2";
                    } else if (node.data == "owner") {
                        node.data = "owner2";
                    }
                }
            };

            visitorSpy = jasmine.createSpy('visitor').andCallFake(visitor);

            inspector.initWithSerialization(serialization);
            inspector.visitSerialization(visitorSpy);
            expect(serialization.getSerializationObject())
                .toEqual(expectedSerialization);
        });

        it("should modify a binding converter label", function () {
            var serialization = new Serialization().initWithObject({
                    "text": {
                        "prototype": "montage/ui/text.reel",
                        "bindings": {
                            "value": {
                                "<-": "@object",
                                "converter": {"@": "converter"}
                            }
                        }
                    }
                }),
                expectedSerialization = {
                    "text": {
                        "prototype": "montage/ui/text.reel",
                        "bindings": {
                            "value": {
                                "<-": "@object",
                                "converter": {"@": "converterNewLabel"}
                            }
                        }
                    }
                },
                visitorSpy,
                visitor;

            visitor = function (node) {
                if (node.type === "reference") {
                    if (node.data == "converter") {
                        node.data = "converterNewLabel";
                    }
                }
            };

            visitorSpy = jasmine.createSpy('visitor').andCallFake(visitor);

            inspector.initWithSerialization(serialization);
            inspector.visitSerialization(visitorSpy);
            expect(serialization.getSerializationObject())
                .toEqual(expectedSerialization);
        });

        it("should modify a localization reference", function () {
            var serialization = new Serialization().initWithObject({
                    "text": {
                        "prototype": "montage/ui/text.reel",
                        "localizations": {
                            "value": {
                                "key": {"<-": "@owner.value"}
                            }
                        }
                    }
                }),
                expectedSerialization = {
                    "text": {
                        "prototype": "montage/ui/text.reel",
                        "localizations": {
                            "value": {
                                "key": {"<-": "@foo.value"}
                            }
                        }
                    }
                },
                visitorSpy,
                visitor;

            visitor = function (node) {
                if (node.type === "reference") {
                    node.data = "foo";
                }
            }

            visitorSpy = jasmine.createSpy('visitor').andCallFake(visitor);

            inspector.initWithSerialization(serialization);
            inspector.visitSerialization(visitorSpy);
            expect(serialization.getSerializationObject())
                .toEqual(expectedSerialization);
        });
    });
});
