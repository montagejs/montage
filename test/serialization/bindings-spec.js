
var Montage = require("montage").Montage;
var Bindings = require("montage/core/bindings").Bindings;
var serialize = require("montage/core/serialization").serialize;
var deserialize = require("montage/core/serialization").deserialize;

var Type = exports.Type = Montage.specialize( {
    foo: {
        value: 10
    }
});

describe("serialization/bindings-spec", function () {

    it("should serialize a simple binding in normal form", function () {
        var object = new Type();
        Bindings.defineBindings(object, {
            "bar": {
                "<-": "foo"
            }
        });
        var serialization = serialize(object, require);
        var notation = JSON.parse(serialization);
        expect(notation).toEqual({
            "root": {
                "prototype": "serialization/bindings-spec[Type]",
                "properties": {
                    "foo": 10,
                    "identifier": null
                },
                "bindings": {
                    "bar": {
                        "<-": "foo"
                    }
                }
            }
        });
    });

    it("should serialize a binding that references external objects", function () {
        var object = new Type();
        var externalObject = new Montage();

        externalObject.foo = 10;

        Bindings.defineBindings(object, {
            "bar": {
                "<-": "@source.foo"
            }
        }, {
           components: {
               getObjectByLabel: function(label) {
                   return externalObject;
               }
           }
        });
        var serialization = serialize(object, require);
        var notation = JSON.parse(serialization);
        expect(notation).toEqual({
            "root": {
                "prototype": "serialization/bindings-spec[Type]",
                "properties": {
                    "foo": 10,
                    "identifier": null
                },
                "bindings": {
                    "bar": {
                        "<-": "@montage.foo",
                    }
                }
            },

            "montage": {}
        });
    });

    it("should deserialize a simple binding in normal form", function () {
        var serialization = {
                "root": {
                    "prototype": "serialization/bindings-spec[Type]",
                    "properties": {
                        "foo": 10
                    },
                    "bindings": {
                        "bar": {
                            "<-": "foo"
                        }
                    }
                }
            },
            serializationString = JSON.stringify(serialization);

        return deserialize(serializationString, require)
        .then(function (object) {
            expect(object.foo).toBe(10);
            object.foo = 20;
            expect(object.bar).toBe(20);
        });
    });

    it("should deserialize a simple binding with a component reference", function () {
        var serialization = {
                "root": {
                    "prototype": "serialization/bindings-spec[Type]",
                    "properties": {
                        "foo": 10
                    },
                    "bindings": {
                        "bar": {
                            "<-": "@root.foo"
                        }
                    }
                }
            },
            serializationString = JSON.stringify(serialization);

        return deserialize(serializationString, require)
        .then(function (object) {
            expect(object.foo).toBe(10);
            object.foo = 20;
            expect(object.bar).toBe(20);
        });
    });
});

