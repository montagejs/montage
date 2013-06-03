
var Selector = require("montage/core/selector").Selector;
var serialize = require("montage/core/serialization").serialize;
var deserialize = require("montage/core/serialization").deserialize;

describe("core/selector-spec", function () {

    it("should initialize with path", function () {
        var selector = new Selector().initWithPath("a.b");
        expect(selector.evaluate({a: {b: 10}})).toBe(10);
    });

    it("should initialize with syntax", function () {
        var selector = new Selector().initWithSyntax({
            "type": "property",
            "args": [
                {"type": "value"},
                {"type": "literal", "value": "foo"}
            ]
        });
        expect(selector.evaluate({foo: 10})).toBe(10);
    });

    it("should serialize", function () {
        var selector = new Selector().initWithPath("a.b");
        var serialization = serialize(selector, require);
        var json = JSON.parse(serialization);
        expect(json).toEqual({
            root: {
                prototype: "montage/core/selector",
                properties: {
                    path: "a.b"
                }
            }
        });
    })

    it("should deserialize", function () {
        var serialization = {
                "root": {
                    "prototype": "montage/core/selector",
                    "properties": {
                        "path": "a.b"
                    }
                }
            },
            serializationString = JSON.stringify(serialization);

        return deserialize(serializationString, require)
        .then(function (selector) {
            expect(selector.evaluate({a: {b: 20}})).toEqual(20);
        });
    })

    it("should compose with class methods", function () {
        var selector = Selector.and('a', 'b');
        expect(selector.evaluate({a: false, b: true})).toBe(false);
    });

    it("should compose with instance methods", function () {
        var selector = new Selector().initWithPath("a").and("b");
        expect(selector.evaluate({a: false, b: true})).toBe(false);
    });

});

