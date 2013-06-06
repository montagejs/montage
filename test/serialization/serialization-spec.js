/* <copyright>
Copyright (c) 2013, António Afonso
All Rights Reserved.
</copyright> */
var Montage = require("montage").Montage,
    Serialization = require("montage/core/serialization/serialization").Serialization,
    Promise = require("montage/core/promise").Promise;

describe("reel/serialization/serialization-spec", function() {
    var serialization;

    beforeEach(function() {
        serialization = new Serialization();
    });

    it("should find the labels of objects with a specific element id", function() {
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

    it("should rename an element reference", function() {
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


    it("should find no external object labels", function() {
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

    it("should find all external object labels", function() {
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
});
