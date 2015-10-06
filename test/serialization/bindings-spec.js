
var Montage = require("montage").Montage;
var Bindings = require("montage/core/bindings").Bindings;
var serialize = require("montage/core/serialization").serialize;
var deserialize = require("montage/core/serialization").deserialize;
var Deserializer = require("montage/core/serialization").Deserializer;

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

    it("should fail deserializing a binding to a non existing object", function () {
        var serialization = {
                "root": {
                    "prototype": "serialization/bindings-spec[Type]",
                    "properties": {
                        "foo": 10
                    },
                    "bindings": {
                        "bar": {"<-": "@unknown.foo"}
                    }
                }
            },
            serializationString = JSON.stringify(serialization);

        return deserialize(serializationString, require)
        .then(function (object) {
            expect("deserialization").toBe("fail");
        }).catch(function() {
            // it should fail
        });
    });

    describe("template properties' bindings", function () {
        var deserializer;

        beforeEach(function () {
            deserializer = new Deserializer();
        });

        it("should not allow binding to a template property of a component that does not exist", function () {
            var serialization = {
                    "component": {
                        "prototype": "montage/ui/component",
                        "bindings": {
                            "value": {"<-": "@unknown:templateProperty"}
                        }
                    }
                },
                serializationString = JSON.stringify(serialization);

            deserializer.init(serializationString, require);

            return deserializer.deserialize()
            .then(function () {
                expect("deserialization").toBe("failed");
            }).catch(function() {
                // it should fail
            });
        });

        it("should allow binding to a template property of a component that exists", function () {
            var serialization = {
                    "known": {},

                    "component": {
                        "prototype": "montage/ui/component",
                        "bindings": {
                            "value": {"<-": "@known:templateProperty"}
                        }
                    }
                },
                instances = {
                    "known": {}
                },
                serializationString = JSON.stringify(serialization);

            deserializer.init(serializationString, require);

            return deserializer.deserialize(instances)
            .then(function () {
                // this is here just to consume the promise result
            });
        });

        it("should bind correctly to a component with a colon", function () {
            // This "trick" can be used to speed up template properties'
            // resolution at bind time.
            var serialization = {
                    "owner": {},
                    "owner:templateProperty": {},

                    "component": {
                        "prototype": "montage/ui/component",
                        "bindings": {
                            "value": {"<-": "@owner:templateProperty"}
                        }
                    }
                },
                owner = {},
                instances = {
                    "owner": owner,
                    "owner:templateProperty": {}
                },
                serializationString = JSON.stringify(serialization);

            deserializer.init(serializationString, require);

            return deserializer.deserialize(instances)
            .then(function (objects) {
                expect(objects.component.value).toBe(instances["owner:templateProperty"]);
            });
        });
    });
});

