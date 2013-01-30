
var Selector = require("montage/core/selector").Selector;
var serialize = require("montage/core/serializer").serialize;
var deserialize = require("montage/core/deserializer").deserialize;

describe("core/selector-spec", function () {

    it("should initialize with path", function () {
        var selector = Selector.create().initWithPath("a.b");
        expect(selector.evaluate({a: {b: 10}})).toBe(10);
    });

    it("should initialize with syntax", function () {
        var selector = Selector.create().initWithSyntax({
            "type": "property",
            "args": [
                {"type": "value"},
                {"type": "literal", "value": "foo"}
            ]
        });
        expect(selector.evaluate({foo: 10})).toBe(10);
    });

    it("should serialize", function () {
        var selector = Selector.create().initWithPath("a.b");
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
        return deserialize({
            root: {
                prototype: "montage/core/selector",
                properties: {
                    path: "a.b"
                }
            }
        }, require).then(function (selector) {
            expect(selector.evaluate({a: {b: 20}})).toEqual(20);
        });
    })

    it("should compose with class methods", function () {
        var selector = Selector.and('a', 'b');
        expect(selector.evaluate({a: false, b: true})).toBe(false);
    });

    it("should compose with instance methods", function () {
        var selector = Selector.create().initWithPath("a").and("b");
        expect(selector.evaluate({a: false, b: true})).toBe(false);
    });

});

