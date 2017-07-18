/* <copyright>
Copyright (c) 2013, António Afonso
All Rights Reserved.
</copyright> */
var Montage = require("montage").Montage,
    SerializationExtractor = require("montage/core/serialization/serialization").SerializationExtractor,
    Serialization = require("montage/core/serialization/serialization").Serialization,
    Promise = require("montage/core/promise").Promise;

describe("reel/serialization/serialization-extractor-spec", function () {
    var serializationExtractor;

    beforeEach(function () {
        serializationExtractor = new SerializationExtractor();
    });

    it("should extract an object", function () {
        var objects = {
                "one": {
                    "values": {
                        "element": {"#": "oneId"}
                    }
                },

                "two": {
                    "values": {
                        "element": {"#": "twoId"}
                    }
                },

                "three": {
                    "values": {
                        "element": {"#": "threeId"}
                    }
                }
            },
            serialization = new Serialization().initWithObject(objects),
            expectedObjects = {},
            extractedSerialization,
            labels = ["one"];

        expectedObjects.one = objects.one;

        serializationExtractor.initWithSerialization(serialization);
        extractedSerialization = serializationExtractor
            .extractSerialization(labels);

        expect(extractedSerialization.getSerializationObject())
            .toEqual(expectedObjects);
    });

    it("should extract an object and add a defined external", function () {
        var objects = {
                "one": {
                    "values": {
                        "element": {"#": "oneId"}
                    }
                },

                "owner": {}
            },
            serialization = new Serialization().initWithObject(objects),
            expectedObjects = {},
            extractedSerialization,
            labels = ["one"],
            externalLabels = ["owner"];

        expectedObjects.one = objects.one;
        expectedObjects.owner = {};

        serializationExtractor.initWithSerialization(serialization);
        extractedSerialization = serializationExtractor
            .extractSerialization(labels, externalLabels);

        expect(extractedSerialization.getSerializationObject())
            .toEqual(expectedObjects);
    });

    it("should extract an object with its object dependencies as external objects", function () {
        var objects = {
                "one": {
                    "values": {
                        "element": {"#": "oneId"},
                        "three": {"@": "three"}
                    }
                },

                "two": {
                    "values": {
                        "element": {"#": "twoId"}
                    }
                },

                "three": {
                    "values": {
                        "element": {"#": "threeId"}
                    }
                }
            },
            serialization = new Serialization().initWithObject(objects),
            expectedObjects = {},
            extractedSerialization,
            labels = ["one"];

        expectedObjects.one = objects.one;
        expectedObjects.three = {};

        serializationExtractor.initWithSerialization(serialization);
        extractedSerialization = serializationExtractor
            .extractSerialization(labels);

        expect(extractedSerialization.getSerializationObject())
            .toEqual(expectedObjects);
    });

    it("should extract objects with dependencies between them", function () {
        var objects = {
                "one": {
                    "values": {
                        "element": {"#": "oneId"},
                        "three": {"@": "three"}
                    }
                },

                "two": {
                    "values": {
                        "element": {"#": "twoId"}
                    }
                },

                "three": {
                    "values": {
                        "element": {"#": "threeId"}
                    }
                }
            },
            serialization = new Serialization().initWithObject(objects),
            expectedObjects = {},
            extractedSerialization,
            labels = ["one", "three"];

        expectedObjects.one = objects.one;
        expectedObjects.three = objects.three;

        serializationExtractor.initWithSerialization(serialization);
        extractedSerialization = serializationExtractor
            .extractSerialization(labels);

        expect(extractedSerialization.getSerializationObject())
            .toEqual(expectedObjects);
    });

    it("should extract two objects even when one of them is a defined external", function () {
        var objects = {
                "one": {
                    "values": {
                        "element": {"#": "oneId"},
                        "two": {"@": "two"}
                    }
                },

                "two": {
                    "values": {
                        "element": {"#": "twoId"}
                    }
                },
            },
            serialization = new Serialization().initWithObject(objects),
            expectedObjects = {},
            extractedSerialization,
            labels = ["one", "two"],
            externalLabels = ["two"];

        expectedObjects.one = objects.one;
        expectedObjects.two = objects.two;

        serializationExtractor.initWithSerialization(serialization);
        extractedSerialization = serializationExtractor
            .extractSerialization(labels, externalLabels);

        expect(extractedSerialization.getSerializationObject())
            .toEqual(expectedObjects);
    });

    it("should extract two objects even if one of them is an external reference", function () {
        var objects = {
                "one": {
                    "values": {
                        "element": {"#": "oneId"},
                        "two": {"@": "two"}
                    }
                },

                "two": {},
            },
            serialization = new Serialization().initWithObject(objects),
            expectedObjects = {},
            extractedSerialization,
            labels = ["one", "two"];

        expectedObjects.one = objects.one;
        expectedObjects.two = objects.two;

        serializationExtractor.initWithSerialization(serialization);
        extractedSerialization = serializationExtractor
            .extractSerialization(labels);

        expect(extractedSerialization.getSerializationObject())
            .toEqual(expectedObjects);
    });

    it("should ignore passed external objects that do not exist", function () {
        var objects = {
                "one": {
                    "values": {
                        "element": {"#": "oneId"}
                    }
                }
            },
            serialization = new Serialization().initWithObject(objects),
            expectedObjects = {},
            extractedSerialization,
            labels = ["one"],
            externalLabels = ["two"];

        expectedObjects.one = objects.one;

        serializationExtractor.initWithSerialization(serialization);
        extractedSerialization = serializationExtractor
            .extractSerialization(labels, externalLabels);

        expect(extractedSerialization.getSerializationObject())
            .toEqual(expectedObjects);
    });

    describe("bindings", function () {
        it("should extract an object and its one way bindings as external objects", function () {
            var objects = {
                    "one": {
                        "values": {
                            "element": {"#": "oneId"},
                            "name": {"<-": "@two.name"}
                        }
                    },

                    "two": {
                        "values": {
                            "element": {"#": "twoId"},
                            "name": "two"
                        }
                    }
                },
                serialization = new Serialization().initWithObject(objects),
                expectedObjects = {},
                extractedSerialization,
                labels = ["one"];

            expectedObjects.one = objects.one;
            expectedObjects.two = {};

            serializationExtractor.initWithSerialization(serialization);
            extractedSerialization = serializationExtractor
                .extractSerialization(labels);

            expect(extractedSerialization.getSerializationObject())
                .toEqual(expectedObjects);
        });

        it("should extract an object and its two way bindings as external objects", function () {
            var objects = {
                    "one": {
                        "values": {
                            "element": {"#": "oneId"},
                            "name": {"<->": "@two.name"}
                        }
                    },

                    "two": {
                        "values": {
                            "element": {"#": "twoId"},
                            "name": "two"
                        }
                    }
                },
                serialization = new Serialization().initWithObject(objects),
                expectedObjects = {},
                extractedSerialization,
                labels = ["one"];

            expectedObjects.one = objects.one;
            expectedObjects.two = {};

            serializationExtractor.initWithSerialization(serialization);
            extractedSerialization = serializationExtractor
                .extractSerialization(labels);

            expect(extractedSerialization.getSerializationObject())
                .toEqual(expectedObjects);
        });

        it("should extract an object with bindings that have multiple references", function () {
            var objects = {
                    "one": {
                        "values": {
                            "element": {"#": "oneId"},
                            "value": 1
                        }
                    },

                    "two": {
                        "values": {
                            "element": {"#": "twoId"},
                            "value": 2
                        }
                    },

                    "sum": {
                        "values": {
                            "value": {"<-": "@one.value + @two.value"}
                        }
                    }
                },
                serialization = new Serialization().initWithObject(objects),
                expectedObjects = {},
                extractedSerialization,
                labels = ["sum"];

            expectedObjects.one = {};
            expectedObjects.two = {};
            expectedObjects.sum = objects.sum;

            serializationExtractor.initWithSerialization(serialization);
            extractedSerialization = serializationExtractor
                .extractSerialization(labels);

            expect(extractedSerialization.getSerializationObject())
                .toEqual(expectedObjects);
        });
    });

    it("should extract an object and its listeners as external objects", function () {
        var objects = {
                "one": {
                    "values": {
                        "element": {"#": "oneId"},
                    },
                    "listeners": [{
                        "type": "action",
                        "listener": {"@": "two"},
                    }]
                },

                "two": {
                    "values": {
                        "element": {"#": "twoId"}
                    }
                }
            },
            serialization = new Serialization().initWithObject(objects),
            expectedObjects = {},
            extractedSerialization,
            labels = ["one"];

        expectedObjects.one = objects.one;
        expectedObjects.two = {};

        serializationExtractor.initWithSerialization(serialization);
        extractedSerialization = serializationExtractor
            .extractSerialization(labels);

        expect(extractedSerialization.getSerializationObject())
            .toEqual(expectedObjects);
    });
});
