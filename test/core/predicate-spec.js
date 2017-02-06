
var Predicate = require("montage/core/predicate").Predicate;
var serialize = require("montage/core/serialization/serializer/montage-serializer").serialize;
var deserialize = require("montage/core/serialization/deserializer/montage-deserializer").deserialize;

describe("core/predicate-spec", function () {

    it("should initialize with path", function () {
        var predicate = new Predicate().initWithExpression("a.b");
        expect(predicate.evaluate({a: {b: 10}})).toBe(10);
    });

    it("should initialize with syntax", function () {
        var predicate = new Predicate().initWithSyntax({
            "type": "property",
            "args": [
                {"type": "value"},
                {"type": "literal", "value": "foo"}
            ]
        });
        expect(predicate.evaluate({foo: 10})).toBe(10);
    });

    it("should serialize", function () {
        var predicate = new Predicate().initWithExpression("a.b");
        var serialization = serialize(predicate, require);
        var json = JSON.parse(serialization);
        expect(json).toEqual({
            root: {
                prototype: "montage/core/predicate",
                properties: {
                    expression: "a.b"
                }
            }
        });
    })

    it("should deserialize", function () {
        var serialization = {
                "root": {
                    "prototype": "montage/core/predicate",
                    "properties": {
                        "expression": "a.b"
                    }
                }
            },
            serializationString = JSON.stringify(serialization);

        return deserialize(serializationString, require)
        .then(function (predicate) {
            expect(predicate.evaluate({a: {b: 20}})).toEqual(20);
        });
    })

    it("should compose with class methods", function () {
        var predicate = Predicate.and('a', 'b');
        expect(predicate.evaluate({a: false, b: true})).toBe(false);
    });

    it("should compose with instance methods", function () {
        var predicate = new Predicate().initWithExpression("a").and("b");
        expect(predicate.evaluate({a: false, b: true})).toBe(false);
    });

});

