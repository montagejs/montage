var RawDataTypeMapping = require("montage/data/service/raw-data-type-mapping").RawDataTypeMapping,
    ObjectDescriptor = require("montage/core/meta/object-descriptor").ObjectDescriptor,
    Criteria = require("montage/core/criteria").Criteria,
    Deserializer = require("montage/core/serialization/deserializer/montage-deserializer").MontageDeserializer,
    serialization = require("./logic/service/raw-data-type-mapping-spec.mjson");


    console.log("RawDataTypeMappingSpec", serialization);

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

    it("can be created with type and expression", function () {
        var type = new ObjectDescriptor(),
            expression = "isFoo == true",
            mapping = RawDataTypeMapping.withTypeAndExpression(type, expression);

        expect(mapping).toBeDefined();
        expect(mapping.type).toBe(type);
        expect(mapping.criteria).toBeDefined();
        expect(mapping.criteria.expression).toBe(expression);
    });

    it("can evaluate rawData", function () {
        var data1 = {isFoo: true},
            data2 = {isFoo: false},
            type = new ObjectDescriptor(),
            mapping = RawDataTypeMapping.withTypeAndExpression(type, "isFoo == true");

        expect(mapping.match(data1)).toBe(true);
        expect(mapping.match(data2)).toBe(false);
    });

    it("can deserializeSelf", function (done) {
        var deserializer = new Deserializer().init(JSON.stringify(serialization), require);
        return deserializer.deserializeObject().then(function (exports) {
            expect(exports.mappings[0].type.name).toBe("Type 1");
            expect(exports.mappings[0].criteria.expression).toBe("type == 'FOO_TYPE'");

            expect(exports.mappings[1].type.name).toBe("Type 2");
            expect(exports.mappings[1].criteria.expression).toBe("type == $paramType");
            expect(exports.mappings[1].criteria.parameters.paramType).toBe("FOO_TYPE");
            

            expect(exports.mappings[2].type.name).toBe("Type 3");
            expect(exports.mappings[2].criteria.expression).toBe("type == $paramType");
            expect(exports.mappings[2].criteria.parameters.paramType).toBe("FOO_TYPE");
            done();
        });
    });
});