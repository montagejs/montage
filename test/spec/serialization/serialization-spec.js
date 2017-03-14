/* <copyright>
Copyright (c) 2013, António Afonso
All Rights Reserved.
</copyright> */
var Montage = require("montage").Montage,
    Serialization = require("montage/core/serialization/serialization").Serialization,
    Promise = require("montage/core/promise").Promise;

describe("reel/serialization/serialization-spec", function () {
    var serialization;

    beforeEach(function () {
        serialization = new Serialization();
    });

    it("should clone", function () {
        var objects = {
                "one": {
                    "properties": {
                        "element": {"#": "oneId"}
                    }
                }
            },
            serializationClone;

        serialization.initWithObject(objects);
        serializationClone = serialization.clone();

        expect(serializationClone).not.toBe(serialization);
        expect(serializationClone.getSerializationObject()).not.toBe(serialization.getSerializationObject());
        expect(serializationClone.getSerializationString()).toBe(serialization.getSerializationString());
    });

    describe("hasSerializationLabel", function () {
        it("should know if a label exists in the serialization", function () {
            var objects = {
                    "one": {}
                },
                hasLabel;

            serialization.initWithObject(objects);
            hasLabel = serialization.hasSerializationLabel("one");

            expect(hasLabel).toBe(true);
        });

        it("should know if a label does not exist in the serialization", function () {
            var objects = {
                    "one": {}
                },
                hasLabel;

            serialization.initWithObject(objects);
            hasLabel = serialization.hasSerializationLabel("two");

            expect(hasLabel).toBe(false);
        });
    });

    describe("isAlias", function () {
        it("should know that an object is an alias", function () {
            var objects = {
                    "one": {
                        "alias": "@component:propertyName"
                    },
                    "component": {}
                },
                isAlias;

            serialization.initWithObject(objects);
            isAlias = serialization.isAlias("one");

            expect(isAlias).toBe(true);
        });

        it("should know that an object is not an alias", function () {
            var objects = {
                    "one": {}
                },
                isAlias;

            serialization.initWithObject(objects);
            isAlias = serialization.isAlias("one");

            expect(isAlias).toBe(false);
        });
    });

    it("should find the labels of objects with a specific element id", function () {
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
            labels,
            elementIds = ["oneId", "threeId"];

        serialization.initWithObject(objects);
        labels = serialization.getSerializationLabelsWithElements(elementIds);

        expect(labels.length).toBe(2);
        expect(labels).toContain("one");
        expect(labels).toContain("three");
    });

    it("should rename an element reference", function () {
        var objects = {
                "one": {
                    "properties": {
                        "element": {"#": "oneId"}
                    }
                },

                "two": {
                    "properties": {
                        "element": {"#": "twoId"},
                        "details": {
                            "oneElement": {"#": "oneId"}
                        }
                    }
                }
            },
            elementIdsTable = {
                "oneId": "newId"
            };

        serialization.initWithObject(objects);
        serialization.renameElementReferences(elementIdsTable);

        expect(objects.one.properties.element["#"]).toBe("newId");
        expect(objects.two.properties.details.oneElement["#"]).toBe("newId");
        expect(objects.two.properties.element["#"]).toBe("twoId");
    });


    it("should find no external object labels", function () {
        var object = {
                "one": {
                    "value": 1
                },

                "two": {
                    "value": 2
                },

                "three": {
                    "value": 3
                }
            },
            labels;

        serialization.initWithObject(object);
        labels = serialization.getExternalObjectLabels();

        expect(labels.length).toBe(0);
    });

    it("should find all external object labels", function () {
        var object = {
                "one": {},

                "two": {
                    "value": 2
                },

                "three": {}
            },
            labels;

        serialization.initWithObject(object);
        labels = serialization.getExternalObjectLabels();

        expect(labels.length).toBe(2);
        expect(labels).toContain("one");
        expect(labels).toContain("three");
    });

    it("should get the element id of a component's element", function () {
        var object = {
                "one": {
                    "properties": {
                        "element": {"#": "mid"}
                    }
                }
            },
            elementId;

        serialization.initWithObject(object);
        elementId = serialization.getElementId("one");

        expect(elementId).toBe("mid");
    });

    describe("isExternalObject", function () {
        beforeEach(function () {
            var object = {
                    "one": {},

                    "two": {
                        "value": 2
                    },

                    "three": {}
                },
                labels;

            serialization.initWithObject(object);
        });
        it("can determine an external object", function () {
            expect(serialization.isExternalObject("one")).toBe(true);
        });
        it("can determine an internal object", function () {
            expect(serialization.isExternalObject("two")).toBe(false);
        });

        describe("without a serialization object", function () {
            beforeEach(function () {
                serialization.initWithObject(null);
            });
            it("returns false", function () {
                expect(serialization.isExternalObject("one")).toBe(false);
            });
        });
    });
});
