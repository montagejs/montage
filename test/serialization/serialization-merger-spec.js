/* <copyright>
Copyright (c) 2013, António Afonso
All Rights Reserved.
</copyright> */
var Montage = require("montage").Montage,
    SerializationMerger = require("montage/core/serialization/serialization").SerializationMerger,
    Serialization = require("montage/core/serialization/serialization").Serialization,
    MontageLabeler = require("montage/core/serialization/serializer/montage-labeler").MontageLabeler;

describe("reel/serialization/serialization-merger-spec", function () {
    var merger;

    beforeEach(function () {
        merger = new SerializationMerger();
    });

    it("should merge two non-colliding serializations", function () {
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

    it("should merge two colliding serializations", function () {
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

    it("should return a collision table when merging serializations", function () {
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

    describe("delegate", function () {
        describe("willMergeObjectWithLabel", function () {
            it("should not change the merge behavior", function () {
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
                    },
                    delegate = {
                        willMergeObjectWithLabel: function (label) {
                        }
                    };

                SerializationMerger.mergeSerializations(serialization1, serialization2, delegate);

                expect(serialization1.getSerializationObject())
                    .toEqual(expectedSerialization);
            });

            it("should merge object2 as object1", function () {
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
                        },
                        "object3": {
                            "prototype": "montage/ui/component",
                            "properties": {
                                "value": {"@": "object2"}
                            }
                        }
                    }),
                    expectedSerialization = {
                        "object1": {
                            "value": {
                                "name": "object1"
                            }
                        },

                        "object3": {
                            "prototype": "montage/ui/component",
                            "properties": {
                                "value": {"@": "object1"}
                            }
                        }
                    },
                    delegate = {
                        willMergeObjectWithLabel: function (label) {
                            if (label === "object2") {
                                return "object1";
                            }
                        }
                    };

                SerializationMerger.mergeSerializations(serialization1, serialization2, delegate);
                expect(serialization1.getSerializationObject())
                    .toEqual(expectedSerialization);
            });

            it("should merge object2 as object1 from serialization1 even though there's another on in serialization2", function () {
                var serialization1 = new Serialization().initWithObject({
                        "object1": {
                            "value": {
                                "name": "serialization1-object1"
                            }
                        }
                    }),
                    serialization2 = new Serialization().initWithObject({
                        "object1": {
                            "value": {
                                "name": "serialization2-object1"
                            }
                        },
                        "object2": {
                            "value": {
                                "name": "object2"
                            }
                        },
                        "object3": {
                            "prototype": "montage/ui/component",
                            "properties": {
                                "value": {"@": "object2"}
                            }
                        }
                    }),
                    expectedSerialization = {
                        "object1": {
                            "value": {
                                "name": "serialization1-object1"
                            }
                        },
                        "object": {
                            "value": {
                                "name": "serialization2-object1"
                            }
                        },
                        "object3": {
                            "prototype": "montage/ui/component",
                            "properties": {
                                "value": {"@": "object1"}
                            }
                        }
                    },
                    delegate = {
                        willMergeObjectWithLabel: function (label) {
                            if (label === "object2") {
                                return "object1";
                            }
                        }
                    };

                SerializationMerger.mergeSerializations(serialization1, serialization2, delegate);
                expect(serialization1.getSerializationObject())
                    .toEqual(expectedSerialization);
            });

            it("should rename a template property to a label that refers to a component that exists in serialization1", function () {
                var serialization1 = new Serialization().initWithObject({
                        "object1": {
                            "value": {
                                "name": "object1"
                            }
                        }
                    }),
                    serialization2 = new Serialization().initWithObject({
                        "object2:cell": {}
                    }),
                    expectedSerialization = {
                        "object1": {
                            "value": {
                                "name": "object1"
                            }
                        },
                        "object1:cell": {}
                    },
                    delegate = {
                        willMergeObjectWithLabel: function (label) {
                            if (label === "object2:cell") {
                                return "object1:cell";
                            }
                        }
                    };

                SerializationMerger.mergeSerializations(serialization1, serialization2, delegate);
                expect(serialization1.getSerializationObject())
                    .toEqual(expectedSerialization);
            });

            it("should rename an object label when merging", function () {
                var serialization1 = new Serialization().initWithObject({
                        "x": {
                            "value": {
                                "name": "x"
                            }
                        }
                    }),
                    serialization2 = new Serialization().initWithObject({
                        "y": {
                            "value": {
                                "name": "y"
                            }
                        }
                    }),
                    expectedSerialization = {
                        "x": {
                            "value": {
                                "name": "x"
                            }
                        },
                        "z": {
                            "value": {
                                "name": "y"
                            }
                        }
                    },
                    delegate = {
                        willMergeObjectWithLabel: function (label) {
                            if (label === "y") {
                                return "z";
                            }
                        }
                    };

                SerializationMerger.mergeSerializations(serialization1, serialization2, delegate);
                expect(serialization1.getSerializationObject())
                    .toEqual(expectedSerialization);
            });

            it("should rename an object label when merging even when there's a collision", function () {
                var serialization1 = new Serialization().initWithObject({
                        "x": {
                            "value": {
                                "name": "x1"
                            }
                        }
                    }),
                    serialization2 = new Serialization().initWithObject({
                        "x": {
                            "value": {
                                "name": "x2"
                            }
                        }
                    }),
                    expectedSerialization = {
                        "x": {
                            "value": {
                                "name": "x1"
                            }
                        },
                        "z": {
                            "value": {
                                "name": "x2"
                            }
                        }
                    },
                    delegate = {
                        willMergeObjectWithLabel: function (label) {
                            if (label === "x") {
                                return "z";
                            }
                        }
                    };

                SerializationMerger.mergeSerializations(serialization1, serialization2, delegate);
                expect(serialization1.getSerializationObject())
                    .toEqual(expectedSerialization);
            });

            it("should throw when willMergeObjectWithLabel returns a labels that already exists in the origin serialization", function () {
                var serialization1 = new Serialization().initWithObject({
                        "x": {
                            "value": {
                                "name": "x1"
                            }
                        }
                    }),
                    serialization2 = new Serialization().initWithObject({
                        "x": {
                            "value": {
                                "name": "x2"
                            }
                        },
                        "z": {
                            "value": {
                                "name": "z"
                            }
                        }
                    }),
                    delegate = {
                        willMergeObjectWithLabel: function (label) {
                            if (label === "x") {
                                return "z";
                            }
                        }
                    };

                expect(function () {
                    SerializationMerger.mergeSerializations(serialization1, serialization2, delegate);
                }).toThrow();
            });

            it("should throw when willMergeObjectWithLabel returns a labels that was generated to solve a collision", function () {
                var serialization1 = new Serialization().initWithObject({
                        "x": {
                            "value": {
                                "name": "x"
                            }
                        },
                        "x2": {
                            "value": {
                                "name": "x2"
                            }
                        }
                    }),
                    serialization2 = new Serialization().initWithObject({
                        "x": {
                            "value": {
                                "name": "x"
                            }
                        },
                        "x2": {
                            "value": {
                                "name": "x2"
                            }
                        }
                    }),
                    delegate = {
                        willMergeObjectWithLabel: function (label) {
                            if (label === "x") {
                                return "x4";
                            }
                        }
                    };

                expect(function () {
                    SerializationMerger.mergeSerializations(serialization1, serialization2, delegate);
                }).toThrow();
            });
        });

        describe("labeler", function () {
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
                labeler = new MontageLabeler(),
                delegate = {
                    labeler: labeler
                };

            labeler.addLabel("object2");

            SerializationMerger.mergeSerializations(serialization1, serialization2, delegate);
            expect(serialization1.getSerializationObject().object2).toBeUndefined();
        });
    });

    describe("creation of collision table", function () {
        it("should find no collisions", function () {
            var labels1 = ["foo"],
                labels2 = ["bar"],
                foundCollisions;

            foundCollisions = SerializationMerger._createCollisionTable(labels1, labels2);

            expect(foundCollisions).toBe(false);
        });

        it("should find collisions", function () {
            var labels1 = ["foo"],
                labels2 = ["foo", "bar"],
                collisionTable = {},
                foundCollisions,

            foundCollisions = SerializationMerger._createCollisionTable(labels1, labels2, collisionTable);

            expect(foundCollisions).toBe(true);
            expect(collisionTable.foo).toBeDefined();
        });

        it("should find a collision from the template property", function () {
            var labels1 = ["repetition:iteration"],
                labels2 = ["repetition"],
                collisionTable = {},
                foundCollisions,

                foundCollisions = SerializationMerger._createCollisionTable(labels1, labels2, collisionTable);

            expect(foundCollisions).toBe(true);
            expect(collisionTable.repetition).toBeDefined();
        });

        it("should reuse the new label given to the component label", function () {
            var labels1 = ["repetition"],
                labels2 = ["repetition", "repetition:iteration"],
                collisionTable = {},
                foundCollisions,
                newLabel;

            foundCollisions = SerializationMerger._createCollisionTable(labels1, labels2, collisionTable);

            expect(foundCollisions).toBe(true);
            newLabel = collisionTable["repetition:iteration"].split(":")[0];
            expect(collisionTable.repetition).toBe(newLabel);
        });

        it("should rename the component label when the template property is renamed", function () {
            var labels1 = ["repetition:iteration"],
                labels2 = ["repetition:iteration", "repetition"],
                collisionTable = {},
                foundCollisions,
                newLabel;

            foundCollisions = SerializationMerger._createCollisionTable(labels1, labels2, collisionTable);

            expect(foundCollisions).toBe(true);
            newLabel = collisionTable["repetition:iteration"].split(":")[0];
            expect(collisionTable.repetition).toBe(newLabel);
        });

        it("should rename the template property when it finds its component label colides", function () {
            var labels1 = ["repetition"],
                labels2 = ["repetition:iteration"],
                collisionTable = {},
                foundCollisions;

            foundCollisions = SerializationMerger._createCollisionTable(labels1, labels2, collisionTable);

            expect(foundCollisions).toBe(true);
            expect(collisionTable["repetition:iteration"]).toBeDefined();
        });

        it("should rename the component to the same new label the template property got", function () {
            var labels1 = ["repetition"],
                labels2 = ["repetition:iteration", "repetition"],
                collisionTable = {},
                foundCollisions,
                newLabel;

            foundCollisions = SerializationMerger._createCollisionTable(labels1, labels2, collisionTable);

            expect(foundCollisions).toBe(true);
            newLabel = collisionTable["repetition:iteration"].split(":")[0];
            expect(collisionTable.repetition).toBe(newLabel);
        });

        it("should not solve a conflict by using a label that exists in the source labels", function () {
            var labels1 = ["owner"],
                labels2 = ["object", "owner"],
                collisionTable = {};

            SerializationMerger._createCollisionTable(labels1, labels2, collisionTable);
            expect(collisionTable.owner).not.toBe("object");
        });

        it("should not solve a conflict by using a template property label that exists in the source labels", function () {
            var labels1 = ["owner:foo"],
                labels2 = ["object:foo", "owner:foo"],
                collisionTable = {};

            SerializationMerger._createCollisionTable(labels1, labels2, collisionTable);
            expect(collisionTable["owner:foo"]).not.toBe("object:foo");
        });

        it("should not find a conflict just because the label exists in the labeler", function () {
            var labels1 = ["owner"],
                labels2 = ["object"],
                collisionTable = {},
                foundCollisions,
                labeler = new MontageLabeler();

            labeler.addLabel("object", "owner");
            foundCollisions = SerializationMerger._createCollisionTable(labels1, labels2, collisionTable, labeler);
            expect(foundCollisions).toBe(false);
        });
    });

    xit("template", function () {
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
