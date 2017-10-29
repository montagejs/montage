var RawDataTypeMapping = require("montage/data/service/raw-data-type-mapping").RawDataTypeMapping,
    ObjectDescriptor = require("montage/core/meta/object-descriptor").ObjectDescriptor,
    Criteria = require("montage/core/criteria").Criteria;

describe("A RawDataTypeMapping", function() {

    it("can be created", function () {
        expect(new RawDataTypeMapping()).toBeDefined();
    });


    it("can be created with type and criteria", function () {
        var type = new ObjectDescriptor(),
            criteria = new Criteria(),
            mapping = RawDataTypeMapping.withTypeAndCriteria(type, criteria);

        expect(mapping).toBeDefined();
        expect(mapping.type).toBe(type);
        expect(mapping.criteria).toBe(criteria);
    });
});