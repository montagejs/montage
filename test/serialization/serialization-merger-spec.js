/* <copyright>
Copyright (c) 2013, António Afonso
All Rights Reserved.
</copyright> */
var Montage = require("montage").Montage,
    SerializationMerger = require("montage/core/serialization/serialization").SerializationMerger,
    Serialization = require("montage/core/serialization/serialization").Serialization;

describe("reel/serialization/serialization-merger-spec", function() {
    var merger;

    beforeEach(function() {
        merger = new SerializationMerger();
    });

    it("should merge two non-colliding serializations", function() {
        var serialization1 = new Serialization().initWithObject({
                "object1": {
                    "value": {
                        "name": "object1"
                    }
                }
            }),
            serialization2 = new Serialization().initWithObject({
                "object2": {
                    "value": {
                        "name": "object2"
                    }
                }
            }),
            expectedSerialization = {
                "object1": {
                    "value": {
                        "name": "object1"
                    }
                },

                "object2": {
                    "value": {
                        "name": "object2"
                    }
                }
            };

        SerializationMerger.mergeSerializations(serialization1, serialization2);

        expect(serialization1.getSerializationObject())
            .toEqual(expectedSerialization);
    });

    it("should merge two colliding serializations", function() {
        var serialization1 = new Serialization().initWithObject({
                "object": {
                    "value": {
                        "name": "object"
                    }
                }
            }),
            serialization2 = new Serialization().initWithObject({
                "object": {
                    "value": {
                        "name": "object2"
                    }
                }
            }),
            expectedSerialization = {
                "object": {
                    "value": {
                        "name": "object"
                    }
                },

                "object2": {
                    "value": {
                        "name": "object2"
                    }
                }
            };

        SerializationMerger.mergeSerializations(serialization1, serialization2);

        expect(serialization1.getSerializationObject())
            .toEqual(expectedSerialization);
    });

    it("should return a collision table when merging serializations", function() {
        var serialization1 = new Serialization().initWithObject({
                "object": {
                    "value": {
                        "name": "object"
                    }
                }
            }),
            serialization2 = new Serialization().initWithObject({
                "object": {
                    "value": {
                        "name": "object2"
                    }
                }
            }),
            collisionTable;

        collisionTable = SerializationMerger.mergeSerializations(
            serialization1, serialization2);

        expect("object" in collisionTable).toBe(true);
    });

    xit("template", function() {
        var serialization1 = new Serialization().initWithObject({
                "object1": {
                    "value": {
                        "name": "object1"
                    }
                }
            }),
            serialization2 = new Serialization().initWithObject({
                "object2": {
                    "value": {
                        "name": "object2"
                    }
                }
            }),
            expectedSerialization = {
                "object1": {
                    "value": {
                        "name": "object1"
                    }
                },

                "object2": {
                    "value": {
                        "name": "object2"
                    }
                }
            };

        SerializationMerger.mergeSerializations(serialization1, serialization2);

        expect(serialization1.getSerializationObject())
            .toEqual(expectedSerialization);
    });
});
