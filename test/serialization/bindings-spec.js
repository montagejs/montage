
var Montage = require("montage").Montage;
var Bindings = require("montage/core/bindings").Bindings;
var serialize = require("montage/core/serializer").serialize;
var deserialize = require("montage/core/deserializer").deserialize;

var Type = exports.Type = Montage.create(Montage, {
    foo: {
        value: 10
    }
});

describe("serialization/bindings-spec", function () {

    it("should serialize a simple binding in normal form", function () {
        var object = Type.create();
        Bindings.defineBindings(object, {
            "bar": {
                "<-": "foo"
            }
        });
        var serialization = serialize(object, require);
        var notation = JSON.parse(serialization);
        expect(notation).toEqual({
            root: {
                prototype: "serialization/bindings-spec[Type]",
                properties: {
                    foo: 10
                },
                bindings: {
                    bar: {
                        "<-": "foo"
                    }
                }
            }
        });
    });

    it("should deserialize a simple binding in normal form", function () {
        return deserialize({
            root: {
                prototype: "serialization/bindings-spec[Type]",
                properties: {
                    foo: 10
                },
                bindings: {
                    bar: {
                        "<-": "foo"
                    }
                }
            }
        }, require)
        .then(function (object) {
            expect(object.foo).toBe(10);
            object.foo = 20;
            expect(object.bar).toBe(20);
        });
    });

    it("should deserialize a simple binding with a component reference", function () {
        return deserialize({
            root: {
                prototype: "serialization/bindings-spec[Type]",
                properties: {
                    foo: 10
                },
                bindings: {
                    bar: {
                        "<-": "@root.foo"
                    }
                }
            }
        }, require)
        .then(function (object) {
            expect(object.foo).toBe(10);
            object.foo = 20;
            expect(object.bar).toBe(20);
        });
    });

    // deprecated forms
    it("should deserialize a simple binding in the old form", function () {
        return deserialize({
            root: {
                prototype: "serialization/bindings-spec[Type]",
                properties: {
                    foo: 10
                },
                bindings: {
                    bar: {
                        boundObject: "root",
                        boundPropertyPath: "foo",
                        oneway: true
                    }
                }
            }
        }, require)
        .then(function (object) {
            expect(object.foo).toBe(10);
            object.foo = 20;
            expect(object.bar).toBe(20);
        });
    });

});

