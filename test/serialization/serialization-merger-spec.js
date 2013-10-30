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

    describe("creation of collision table", function() {
        it("should find no collisions", function() {
            var labels1 = ["foo"],
                labels2 = ["bar"],
                collisionTable;

            collisionTable = SerializationMerger._createCollisionTable(labels1, labels2);

            expect(collisionTable).not.toBeDefined();
        });

        it("should find collisions", function() {
            var labels1 = ["foo"],
                labels2 = ["foo", "bar"],
                collisionTable;

            collisionTable = SerializationMerger._createCollisionTable(labels1, labels2);

            expect(collisionTable).toBeDefined();
            expect(collisionTable.foo).toBeDefined();
        });

        it("should find a collision from the template property", function() {
            var labels1 = ["repetition:iteration"],
                labels2 = ["repetition"],
                collisionTable;

            collisionTable = SerializationMerger._createCollisionTable(labels1, labels2);

            expect(collisionTable).toBeDefined();
            expect(collisionTable.repetition).toBeDefined();
        });

        it("should reuse the new label given to the component label", function() {
            var labels1 = ["repetition"],
                labels2 = ["repetition", "repetition:iteration"],
                collisionTable,
                newLabel;

            collisionTable = SerializationMerger._createCollisionTable(labels1, labels2);

            expect(collisionTable).toBeDefined();
            newLabel = collisionTable["repetition:iteration"].split(":")[0];
            expect(collisionTable.repetition).toBe(newLabel);
        });

        it("should rename the component label when the template property is renamed", function() {
            var labels1 = ["repetition:iteration"],
                labels2 = ["repetition:iteration", "repetition"],
                collisionTable,
                newLabel;

            collisionTable = SerializationMerger._createCollisionTable(labels1, labels2);

            expect(collisionTable).toBeDefined();
            newLabel = collisionTable["repetition:iteration"].split(":")[0];
            expect(collisionTable.repetition).toBe(newLabel);
        });

        it("should rename the template property when it finds its component label colides", function() {
            var labels1 = ["repetition"],
                labels2 = ["repetition:iteration"],
                collisionTable;

            collisionTable = SerializationMerger._createCollisionTable(labels1, labels2);

            expect(collisionTable).toBeDefined();
            expect(collisionTable["repetition:iteration"]).toBeDefined();
        });

        it("should rename the component to the same new label the template property got", function() {
            var labels1 = ["repetition"],
                labels2 = ["repetition:iteration", "repetition"],
                collisionTable,
                newLabel;

            collisionTable = SerializationMerger._createCollisionTable(labels1, labels2);

            expect(collisionTable).toBeDefined();
            newLabel = collisionTable["repetition:iteration"].split(":")[0];
            expect(collisionTable.repetition).toBe(newLabel);
        });
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
