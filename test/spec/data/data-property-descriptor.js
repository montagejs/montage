var DataPropertyDescriptor = require("montage/data/model/data-property-descriptor").DataPropertyDescriptor;

describe("A DataPropertyDescriptor", function() {

    it("can be created", function () {
        expect(new DataPropertyDescriptor()).toBeDefined();
    });

    it("initially is not a relationship", function () {
        expect(new DataPropertyDescriptor().isRelationship).toEqual(false);
    });

    it("preserves its relationship status", function () {
        var descriptor = new DataPropertyDescriptor();
        descriptor.isRelationship = true;
        expect(descriptor.isRelationship).toEqual(true);
    });

    it("initially is not optional", function () {
        expect(new DataPropertyDescriptor().isOptional).toEqual(false);
    });

    it("preserves its optional status", function () {
        var descriptor = new DataPropertyDescriptor();
        descriptor.isOptional = true;
        expect(descriptor.isOptional).toEqual(true);
    });

});
