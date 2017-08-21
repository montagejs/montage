var Serializer = require("montage/core/serialization/serializer/montage-serializer").MontageSerializer,
    Visitor = require("montage/core/serialization/serializer/montage-visitor").MontageVisitor;


describe("visitor", function() {
    var serializer;

    beforeEach(function() {
        serializer = new Serializer().initWithRequire(require);
        serializer.setSerializationIndentation(4);
    });

    describe("custom objects serialization", function() {
        function Custom1(name) {
            this.name = name;
        }

        function Custom2(name) {
            this.name = name;
        }

        afterEach(function() {
            Visitor.resetCustomObjectVisitors();
        });

        it("should serialize a custom object", function() {
            Visitor.addCustomObjectVisitor({
                getTypeOf: function(object) {
                    if (Custom1.prototype.isPrototypeOf(object)) {
                        return "Custom1";
                    }
                },

                visitCustom1: function(malker, visitor, object, name) {
                    var builderObject = visitor.builder.createCustomObject(),
                        custom1 = visitor.builder.createObjectLiteral();

                    visitor.builder.push(custom1);
                    malker.visit(object.name, "name");
                    visitor.builder.pop();

                    builderObject.setProperty("custom1", custom1);

                    visitor.storeValue(builderObject, object, name);
                }
            });

            var object = new Custom1("a custom object"),
                expectedSerialization,
                serialization;

            expectedSerialization = {
                "root": {
                    "value": {
                        "name": "a custom object"
                    }
                }
            };

            serialization = serializer.serializeObject(object);
            expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
        });

        it("should visit different types of custom objects in different visitors", function() {
            Visitor.addCustomObjectVisitor({
                getTypeOf: function(object) {
                    if (Custom1.prototype.isPrototypeOf(object)) {
                        return "Custom1";
                    }
                },

                visitCustom1: function(malker, visitor, object, name) {
                    var builderObject = visitor.builder.createCustomObject(),
                        custom1 = visitor.builder.createObjectLiteral();

                    visitor.builder.push(custom1);
                    malker.visit(object.name, "name");
                    visitor.builder.pop();

                    builderObject.setProperty("custom1", custom1);

                    visitor.storeValue(builderObject, object, name);
                }
            });

            Visitor.addCustomObjectVisitor({
                getTypeOf: function(object) {
                    if (Custom2.prototype.isPrototypeOf(object)) {
                        return "Custom2";
                    }
                },

                visitCustom2: function(malker, visitor, object, name) {
                    var builderObject = visitor.builder.createCustomObject(),
                        custom2 = visitor.builder.createObjectLiteral();

                    visitor.builder.push(custom2);
                    malker.visit(object.name, "name");
                    visitor.builder.pop();

                    builderObject.setProperty("custom2", custom2);

                    visitor.storeValue(builderObject, object, name);
                }
            });

            var object = {
                    foo: new Custom1("a custom1 object"),
                    bar: new Custom2("a custom2 object")
                },
                expectedSerialization,
                serialization;

            expectedSerialization = {
                "foo": {
                    "value": {
                        "name": "a custom1 object"
                    }
                },

                "bar": {
                    "value": {
                        "name": "a custom2 object"
                    }
                }
            };

            serialization = serializer.serialize(object);
            expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
        });

        it("should visit different types of custom objects in the same visitor", function() {
            Visitor.addCustomObjectVisitor({
                getTypeOf: function(object) {
                    if (Custom1.prototype.isPrototypeOf(object)) {
                        return "Custom1";
                    } else if (Custom2.prototype.isPrototypeOf(object)) {
                        return "Custom2";
                    }
                },

                visitCustom1: function(malker, visitor, object, name) {
                    var builderObject = visitor.builder.createCustomObject(),
                        custom1 = visitor.builder.createObjectLiteral();

                    visitor.builder.push(custom1);
                    malker.visit(object.name, "name");
                    visitor.builder.pop();

                    builderObject.setProperty("custom1", custom1);

                    visitor.storeValue(builderObject, object, name);
                },

                visitCustom2: function(malker, visitor, object, name) {
                    var builderObject = visitor.builder.createCustomObject(),
                        custom2 = visitor.builder.createObjectLiteral();

                    visitor.builder.push(custom2);
                    malker.visit(object.name, "name");
                    visitor.builder.pop();

                    builderObject.setProperty("custom2", custom2);

                    visitor.storeValue(builderObject, object, name);
                }
            });

            var object = {
                    foo: new Custom1("a custom1 object"),
                    bar: new Custom2("a custom2 object")
                },
                expectedSerialization,
                serialization;

            expectedSerialization = {
                "foo": {
                    "value": {
                        "name": "a custom1 object"
                    }
                },

                "bar": {
                    "value": {
                        "name": "a custom2 object"
                    }
                }
            };

            serialization = serializer.serialize(object);
            expect(JSON.parse(serialization))
                .toEqual(expectedSerialization);
        });
    });
});
