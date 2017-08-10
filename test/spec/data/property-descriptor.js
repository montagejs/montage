var PropertyDescriptor = require("montage/data/model/property-descriptor").PropertyDescriptor;

describe("A PropertyDescriptor", function() {

    it("can be created", function () {
        expect(new PropertyDescriptor()).toBeDefined();
    });

    it("initially is not a relationship", function () {
        expect(new PropertyDescriptor().isRelationship).toEqual(false);
    });

    it("preserves its relationship status", function () {
        var descriptor = new PropertyDescriptor();
        descriptor.isRelationship = true;
        expect(descriptor.isRelationship).toEqual(true);
    });

    it("initially is not optional", function () {
        expect(new PropertyDescriptor().isOptional).toEqual(false);
    });

    it("preserves its optional status", function () {
        var descriptor = new PropertyDescriptor();
        descriptor.isOptional = true;
        expect(descriptor.isOptional).toEqual(true);
    });

});
