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
        serialization = Serialization.create();
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
});