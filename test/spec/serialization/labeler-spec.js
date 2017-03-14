var Labeler = require("montage/core/serialization/serializer/montage-labeler").MontageLabeler;

describe("labeler", function() {

    var labeler, object;

    beforeEach(function() {
        labeler = new Labeler();
        object = {anObject: true};
    });

    describe("user labels", function() {
        it("should initialize with user labels", function() {
            labeler.initWithObjects({
                "object": object
            });

            expect(labeler.getObjectLabel(object)).toBe("object");
        });

        it("should recognize user defined labels", function() {
            labeler.initWithObjects({
                "object": object
            });

            expect(labeler.isUserDefinedLabel("object")).toBe(true);
        });

        it("should not recognize new labels as user defined", function() {
            labeler.setObjectLabel(object, "object");

            expect(labeler.isUserDefinedLabel("object")).toBe(false);
        });
    });

    describe("labels", function() {
        it("should add a label", function() {
            labeler.addLabel("baseName");

            expect(labeler.isLabelDefined("baseName")).toBe(true);
        });

        it("should add several labels", function() {
            labeler.addLabels(["label1", "label2"]);

            expect(labeler.isLabelDefined("label1")).toBe(true);
            expect(labeler.isLabelDefined("label2")).toBe(true);
        });
    });

    describe("object labels", function() {
        it("should know when an object label is defined", function() {
            var label;

            label = labeler.getObjectLabel(object);

            expect(labeler.isLabelDefined(label)).toBe(true);
        });

        it("should return the same label for the same object", function() {
            var label;

            label = labeler.getObjectLabel(object);

            expect(labeler.getObjectLabel(object)).toBe(label);
        });

        it("should find a label by object", function() {
            var label;

            label = labeler.getObjectLabel(object);

            expect(labeler.getObjectByLabel(label)).toBe(object);
        });

        it("should generate a label for an object", function() {
            var label;

            label = labeler.generateObjectLabel(object);

            expect(label).toBe("object");
        });
    });

    describe("label generation", function() {
        it("should generate a label", function() {
            var label;

            label = labeler.generateLabel("baseName");

            expect(label).toBe("baseName");
        });

        it("should generate different labels for the same base name", function() {
            var label1,
                label2;

            label1 = labeler.generateLabel("baseName");
            label2 = labeler.generateLabel("baseName");

            expect(label1).not.toBe(label2);
        });

        it("should avoid existing labels when generating a new label", function() {
            var label;

            labeler.addLabel("baseName");
            label = labeler.generateLabel("baseName");

            expect(label).not.toBe("baseName");
        });

        it("should find the label base name", function() {
            var baseName = labeler.getLabelBaseName("baseName");

            expect(baseName).toBe("baseName");
        });

        it("should find the label base name when it has a number", function() {
            var baseName = labeler.getLabelBaseName("baseName3");

            expect(baseName).toBe("baseName");
        });
    });

    describe("object names", function() {
        it("should find the appropriate object name for an object", function() {
            var name = labeler.getObjectName({});

            expect(name).toBe("object");
        });

        it("should find the appropriate object name for a number", function() {
            var name = labeler.getObjectName(42);

            expect(name).toBe("number");
        });

        it("should find the appropriate object name for a string", function() {
            var name = labeler.getObjectName("a string");

            expect(name).toBe("string");
        });
    });
});
