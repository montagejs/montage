/* <copyright>
Copyright (c) 2013, António Afonso
All Rights Reserved.
</copyright> */
var Montage = require("montage").Montage,
    SerializationExtractor = require("montage/core/serialization/deserializer/serialization-extractor").SerializationExtractor,
    Promise = require("montage/q");

describe("reel/serialization/serialization-extractor-spec", function() {
    var serializationExtractor;

    beforeEach(function() {
        serializationExtractor = SerializationExtractor.create();
    });

    it("should extract an object", function() {
        var objects = {
                "one": {
                    "properties": {
                        "element": {"#": "oneId"}
                    }
                },

                "two": {
                    "properties": {
                        "element": {"#": "twoId"}
                    }
                },

                "three": {
                    "properties": {
                        "element": {"#": "threeId"}
                    }
                }
            },
            expectedObjects = {},
            extractedObjects,
            labels = ["one"];

        expectedObjects.one = objects.one;

        serializationExtractor.initWithSerialization(objects);
        extractedObjects = serializationExtractor.extractObjects(labels);

        expect(extractedObjects).toEqual(expectedObjects);
    });

    it("should extract an object and add a defined external", function() {
        var objects = {
                "one": {
                    "properties": {
                        "element": {"#": "oneId"}
                    }
                },

                "owner": {}
            },
            expectedObjects = {},
            extractedObjects,
            labels = ["one"],
            externalLabels = ["owner"];

        expectedObjects.one = objects.one;
        expectedObjects.owner = {};

        serializationExtractor.initWithSerialization(objects);
        extractedObjects = serializationExtractor.extractObjects(labels, externalLabels);

        expect(extractedObjects).toEqual(expectedObjects);
    });

    it("should extract an object with its object dependencies as external objects", function() {
        var objects = {
                "one": {
                    "properties": {
                        "element": {"#": "oneId"},
                        "three": {"@": "three"}
                    }
                },

                "two": {
                    "properties": {
                        "element": {"#": "twoId"}
                    }
                },

                "three": {
                    "properties": {
                        "element": {"#": "threeId"}
                    }
                }
            },
            expectedObjects = {},
            extractedObjects,
            labels = ["one"];

        expectedObjects.one = objects.one;
        expectedObjects.three = {};

        serializationExtractor.initWithSerialization(objects);
        extractedObjects = serializationExtractor.extractObjects(labels);

        expect(extractedObjects).toEqual(expectedObjects);
    });

    it("should extract objects with dependencies between them", function() {
        var objects = {
                "one": {
                    "properties": {
                        "element": {"#": "oneId"},
                        "three": {"@": "three"}
                    }
                },

                "two": {
                    "properties": {
                        "element": {"#": "twoId"}
                    }
                },

                "three": {
                    "properties": {
                        "element": {"#": "threeId"}
                    }
                }
            },
            expectedObjects = {},
            extractedObjects,
            labels = ["one", "three"];

        expectedObjects.one = objects.one;
        expectedObjects.three = objects.three;

        serializationExtractor.initWithSerialization(objects);
        extractedObjects = serializationExtractor.extractObjects(labels);

        expect(extractedObjects).toEqual(expectedObjects);
    });

    it("should extract two objects even when one of them is a defined external", function() {
        var objects = {
                "one": {
                    "properties": {
                        "element": {"#": "oneId"},
                        "two": {"@": "two"}
                    }
                },

                "two": {
                    "properties": {
                        "element": {"#": "twoId"}
                    }
                },
            },
            expectedObjects = {},
            extractedObjects,
            labels = ["one", "two"],
            externalLabels = ["two"];

        expectedObjects.one = objects.one;
        expectedObjects.two = objects.two;

        serializationExtractor.initWithSerialization(objects);
        extractedObjects = serializationExtractor.extractObjects(labels, externalLabels);

        expect(extractedObjects).toEqual(expectedObjects);
    });

    it("should extract two objects even if one of them is an external reference", function() {
        var objects = {
                "one": {
                    "properties": {
                        "element": {"#": "oneId"},
                        "two": {"@": "two"}
                    }
                },

                "two": {},
            },
            expectedObjects = {},
            extractedObjects,
            labels = ["one", "two"];

        expectedObjects.one = objects.one;
        expectedObjects.two = objects.two;

        serializationExtractor.initWithSerialization(objects);
        extractedObjects = serializationExtractor.extractObjects(labels);

        expect(extractedObjects).toEqual(expectedObjects);
    });

    it("should ignore passed external objects that do not exist", function() {
        var objects = {
                "one": {
                    "properties": {
                        "element": {"#": "oneId"}
                    }
                }
            },
            expectedObjects = {},
            extractedObjects,
            labels = ["one"],
            externalLabels = ["two"];

        expectedObjects.one = objects.one;

        serializationExtractor.initWithSerialization(objects);
        extractedObjects = serializationExtractor.extractObjects(labels, externalLabels);

        expect(extractedObjects).toEqual(expectedObjects);
    });

    it("should extract an object and its one way bindings as external objects", function() {
        var objects = {
                "one": {
                    "properties": {
                        "element": {"#": "oneId"},
                    },
                    "bindings": {
                        "name": {"<-": "@two.name"}
                    }
                },

                "two": {
                    "properties": {
                        "element": {"#": "twoId"},
                        "name": "two"
                    }
                }
            },
            expectedObjects = {},
            extractedObjects,
            labels = ["one"];

        expectedObjects.one = objects.one;
        expectedObjects.two = {};

        serializationExtractor.initWithSerialization(objects);
        extractedObjects = serializationExtractor.extractObjects(labels);

        expect(extractedObjects).toEqual(expectedObjects);
    });

    it("should extract an object and its two way bindings as external objects", function() {
        var objects = {
                "one": {
                    "properties": {
                        "element": {"#": "oneId"},
                    },
                    "bindings": {
                        "name": {"<->": "@two.name"}
                    }
                },

                "two": {
                    "properties": {
                        "element": {"#": "twoId"},
                        "name": "two"
                    }
                }
            },
            expectedObjects = {},
            extractedObjects,
            labels = ["one"];

        expectedObjects.one = objects.one;
        expectedObjects.two = {};

        serializationExtractor.initWithSerialization(objects);
        extractedObjects = serializationExtractor.extractObjects(labels);

        expect(extractedObjects).toEqual(expectedObjects);
    });

    it("should extract an object and its listeners as external objects", function() {
        var objects = {
                "one": {
                    "properties": {
                        "element": {"#": "oneId"},
                    },
                    "listeners": [{
                        "type": "action",
                        "listener": {"@": "two"},
                    }]
                },

                "two": {
                    "properties": {
                        "element": {"#": "twoId"}
                    }
                }
            },
            expectedObjects = {},
            extractedObjects,
            labels = ["one"];

        expectedObjects.one = objects.one;
        expectedObjects.two = {};

        serializationExtractor.initWithSerialization(objects);
        extractedObjects = serializationExtractor.extractObjects(labels);

        expect(extractedObjects).toEqual(expectedObjects);
    });
});