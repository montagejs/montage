
var Criteria = require("montage/core/criteria").Criteria;
var serialize = require("montage/core/serialization/serializer/montage-serializer").serialize;
var deserialize = require("montage/core/serialization/deserializer/montage-deserializer").deserialize;

describe("core/criteria-spec", function () {

    it("should initialize with path", function () {
        var criteria = new Criteria().initWithExpression("a.b");
        expect(criteria.evaluate({a: {b: 10}})).toBe(10);
    });

    it("should initialize with syntax", function () {
        var criteria = new Criteria().initWithSyntax({
            "type": "property",
            "args": [
                {"type": "value"},
                {"type": "literal", "value": "foo"}
            ]
        });
        expect(criteria.evaluate({foo: 10})).toBe(10);
    });

    it("should serialize", function () {
        var criteria = new Criteria().initWithExpression("a.b");
        var serialization = serialize(criteria, require);
        var json = JSON.parse(serialization);
        expect(json).toEqual({
            root: {
                prototype: "montage/core/criteria",
                properties: {
                    expression: "a.b"
                }
            }
        });
    })

    it("should deserialize", function () {
        var serialization = {
                "root": {
                    "prototype": "montage/core/criteria",
                    "properties": {
                        "expression": "a.b"
                    }
                }
            },
            serializationString = JSON.stringify(serialization);

        return deserialize(serializationString, require)
        .then(function (criteria) {
            expect(criteria.evaluate({a: {b: 20}})).toEqual(20);
        });
    })

    it("should compose with class methods", function () {
        var criteria = Criteria.and('a', 'b');
        expect(criteria.evaluate({a: false, b: true})).toBe(false);
    });

    it("should compose with instance methods", function () {
        var criteria = new Criteria().initWithExpression("a").and("b");
        expect(criteria.evaluate({a: false, b: true})).toBe(false);
    });

});

