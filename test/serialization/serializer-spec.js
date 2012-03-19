/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
 var Montage = require("montage/core/core").Montage,
     Component = require("montage/ui/component").Component,
     Serializer = require("montage/core/serializer").Serializer,
     objects = require("serialization/testobjects-v2").objects;

var stripPP = function stripPrettyPrintting(str) {
    return str.replace(/\n\s*/g, "");
};

describe("serialization/serializer-spec", function() {
    var serializer;

    beforeEach(function() {
        serializer = Serializer.create();
        serializer._objectReferences = {}; // needed when calling some private functions for testing.
        serializer._require = require;
    });

    describe("Native Types Serialization", function() {
        it("should serialize a string", function() {
            var serialization = serializer._serializeValue("string");

            expect(serialization).toBe(JSON.stringify("string"));
        });

        it("should serialize a number", function() {
            var serialization = serializer._serializeValue(42);
            expect(serialization).toBe(JSON.stringify(42));

            var serialization = serializer._serializeValue(-42);
            expect(serialization).toBe(JSON.stringify(-42));

            var serialization = serializer._serializeValue(3.1415);
            expect(serialization).toBe(JSON.stringify(3.1415));
        });

        it("should serialize a boolean", function() {
            var serialization = serializer._serializeValue(true);
            expect(serialization).toBe(JSON.stringify(true));

            var serialization = serializer._serializeValue(false);
            expect(serialization).toBe(JSON.stringify(false));
        });

        it("should serialize a null value", function() {
            var serialization = serializer._serializeValue(null);
            expect(serialization).toBe(JSON.stringify(null));
        });

        it("shouldn't serialize undefined values", function() {
            var undefined;

            var serialization = serializer._serializeValue({value: undefined});
            expect(serialization.hasOwnProperty("value")).toBeFalsy();
        });
    });

    describe("Native Objects Serialization", function() {
        it("should serialize an Array", function() {
            var array = [42, "string", null];
            var serialization = serializer._serializeArray(array);

            expect(stripPP(serialization)).toBe("[42,\"string\",null]");
        });

        it("should serialize a RegExp", function() {
            var regexp = /this \/ "\/ regexp/gm;
            var serialization = serializer._serializeRegExp(regexp);

            expect(stripPP(serialization)).toBe('{"/":{"source":"' + regexp.source.replace(/([\\"])/g, "\\$1") + '","flags":"gm"}}');
        });

        it("should serialize an Object literal", function() {
            var spy = spyOn(serializer, "_serializeValue").andCallFake(function(value) {
                if (value === object.regexp) {
                    return value.toString();
                } else {
                    return JSON.stringify(value);
                }
            });
            var object = {number: 42, string: "string", regexp: /regexp/i};
            var serialization = serializer._serializeObjectLiteral(object);

            // Jasmine doesn't really have the power to know if a spy
            // has been called X times disregarding the order and checking
            // only the first parameter...
            // expect(spy).toHaveBeenCalledWith();
            expect(stripPP(serialization)).toBe('{"number":' + object.number + ',"string":"' + object.string + '","regexp":' + object.regexp + '}');
        });

        it("should serialize a function", function() {
            var funktion = function square(x) {
                return x*x;
            };

            var serialization = serializer._serializeFunction(funktion);
            var object = JSON.parse(serialization)["->"];

            expect((new Function(object.arguments, object.body))(2)).toBe(4);
        });

        // TODO: object literal with functions
        // TODO: object literal with references to user objects
    });

    describe("Serialization Structure", function() {
        it("should serialize a number", function() {
            var object = Montage.create();
            serialization = serializer.serializeObject(3.14);
            expect(stripPP(serialization)).toBe('{"root":{"value":3.14}}');
        });

        it("should serialize a literal object", function() {
            var object = Montage.create();
            serialization = serializer.serializeObject({number: 3.14});
            expect(stripPP(serialization)).toBe('{"root":{"value":{"number":3.14}}}');
        });
    });

    describe("Objects serialization", function(){
        it("should serialize a class object with no properties", function() {
            var object = objects.Empty;
            serialization = stripPP(serializer.serializeObject(object));
            expect(stripPP(serialization)).toBe('{"root":{"object":"serialization/testobjects-v2[Empty]","properties":{}}}');
        });

        it("should serialize an instance object with no properties", function() {
            var object = objects.Empty.create();
            serialization = serializer.serializeObject(object);

            expect(stripPP(serialization)).toBe('{"root":{"prototype":"serialization/testobjects-v2[Empty]","properties":{}}}');
        });

        it("should serialize an instance object with an array property", function() {
            var object = objects.OneProp.create();
            object.prop = [1, 2, 3, 4, 5];
            serialization = serializer.serializeObject(object);
            expect(stripPP(serialization)).toBe('{"root":{"prototype":"serialization/testobjects-v2[OneProp]","properties":{"prop":[1,2,3,4,5]}}}');
        });

        it("should serialize an instance object with a distinct array property", function() {
            var object = objects.DistinctArrayProp.create();
            serialization = serializer.serializeObject(object);
             expect(stripPP(serialization)).toBe('{"root":{"prototype":"serialization/testobjects-v2[DistinctArrayProp]","properties":{"prop":[]}}}');
        });

        it("should serialize an instance object with a distinct literal property", function() {
            var object = objects.DistinctLiteralProp.create();
            serialization = serializer.serializeObject(object);
            expect(stripPP(serialization)).toBe('{"root":{"prototype":"serialization/testobjects-v2[DistinctLiteralProp]","properties":{"prop":{}}}}');
        });

        it("should serialize an instance object with no references to other objects", function() {
            var object = objects.Simple.create();
            serialization = serializer.serializeObject(object);
            expect(stripPP(serialization)).toBe('{"root":{"prototype":"serialization/testobjects-v2[Simple]","properties":{"number":42,"string":"string"}}}');
        });

        it("should serialize an instance object that references other objects", function() {
            var object = objects.TwoProps.create();
            var simple = objects.Simple.create();

            object.prop1 = ["with", "a", "reference"];
            object.prop2 = simple;

            serialization = serializer.serializeObject(object);
             expect(stripPP(serialization)).toBe('{"simple":{"prototype":"serialization/testobjects-v2[Simple]","properties":{"number":42,"string":"string"}},"root":{"prototype":"serialization/testobjects-v2[TwoProps]","properties":{"prop1":["with","a","reference"],"prop2":{"@":"simple"}}}}');
        });

        it("should serialize an instance object that references itself", function() {
            var object = objects.OneProp.create();

            object.prop = object;

            serialization = serializer.serializeObject(object);
            expect(stripPP(serialization)).toBe('{"root":{"prototype":"serialization/testobjects-v2[OneProp]","properties":{"prop":{"@":"root"}}}}');
        });

        it("should serialize an instance object that has an indirect cycle", function() {
            var object1 = objects.OneProp.create();
            var object2 = objects.OneProp.create();

            object1.prop = object2;
            object2.prop = object1;

            serialization = serializer.serializeObject(object1);
            expect(stripPP(serialization)).toBe('{"oneprop":{"prototype":"serialization/testobjects-v2[OneProp]","properties":{"prop":{"@":"root"}}},"root":{"prototype":"serialization/testobjects-v2[OneProp]","properties":{"prop":{"@":"oneprop"}}}}');
        });

        it("should serialize an instance object with a custom serialization", function() {
            var object = objects.CustomProperties.create();

            object.prop = object;

            serialization = serializer.serializeObject(object);
            expect(stripPP(serialization)).toBe('{"root":{"prototype":"serialization/testobjects-v2[CustomProperties]","properties":{"manchete":226}}}');
        });

        it("should serialize a reference to an instance object with a custom serialization", function() {
            var object = objects.CustomRef.create();

            object.prop = object;

            serialization = serializer.serializeObject(object);
            expect(stripPP(serialization)).toBe('{"root":{"prototype":"serialization/testobjects-v2[CustomRef]","properties":{"object":{"@":"empty"}}}}');
        });

        it("should serialize a function in an Object literal", function() {
            var object = {
                method: function square(x) {
                    return x*x;
                }
            };
            serialization = serializer.serializeObject(object);
            var functionJSON = JSON.parse(serialization).root.value.method["->"];
            expect((new Function(functionJSON.arguments, functionJSON.body))(2)).toBe(4);
        });

        it("should serialize a reference to an instance object using labels", function() {
            var object = objects.OneProp.create();
            var simple = objects.Simple.create();

            object.prop = simple;

            serialization = serializer.serialize({root: object, SimpleA: simple});
            expect(stripPP(serialization)).toBe('{"SimpleA":{"prototype":"serialization/testobjects-v2[Simple]","properties":{"number":42,"string":"string"}},"root":{"prototype":"serialization/testobjects-v2[OneProp]","properties":{"prop":{"@":"SimpleA"}}}}');
        });

        it("should serialize a group of disconnected objects", function() {
            var objectA = objects.OneProp.create();
            var simple = objects.Simple.create();
            objectA.prop = simple;

            var objectB = objects.TwoProps.create();
            objectB.prop1 = "string";
            objectB.prop2 = 42;

            var labels = {
                graphA: objectA,
                graphB: objectB
            };

            serialization = serializer.serialize(labels);
            expect(stripPP(serialization)).toBe('{"simple":{"prototype":"serialization/testobjects-v2[Simple]","properties":{"number":42,"string":"string"}},"graphA":{"prototype":"serialization/testobjects-v2[OneProp]","properties":{"prop":{"@":"simple"}}},"graphB":{"prototype":"serialization/testobjects-v2[TwoProps]","properties":{"prop1":"string","prop2":42}}}');
        });

        describe("Serialization options", function() {
            it("should serialize null values", function() {
                serializer.serializeNullValues = true;

                var serialization = serializer._serializeValue({value: null});
                expect(stripPP(serialization)).toBe('{"value":null}');
            });

            it("shouldn't serialize undefined values with serializeNullValues", function() {
                var undefined;

                var serialization = serializer._serializeValue({value: undefined});
                expect(stripPP(serialization)).toBe('{}');
            });

            it("should serialize according to the 'serializer' attribute", function() {
                var object = objects.SerializableAttribute.create(),
                    prop1 = objects.OneProp.create(),
                    prop2 = objects.OneProp.create(),
                    externalObjects,
                    serialization,
                    length = 0;

                prop1.prop = "prop1";
                prop2.prop = "prop2";
                object.prop1a = object.prop1b = prop1;
                object.prop2a = object.prop2b = prop2;

                serialization = serializer.serializeObject(object);
                //console.log(serialization);
                //console.log(stripPP(serialization));
                externalObjects = serializer.getExternalObjects();
                for (var uuid in externalObjects) {
                    if (externalObjects.hasOwnProperty(uuid)) {
                        length++;
                    }
                }

                expect(stripPP(serialization)).toBe('{"oneprop":{"prototype":"serialization/testobjects-v2[OneProp]","properties":{"prop":"prop1"}},"root":{"prototype":"serialization/testobjects-v2[SerializableAttribute]","properties":{"prop1a":{"@":"oneprop"},"prop1b":{"@":"oneprop"},"prop2a":{"@":"oneprop2"},"prop2b":{"@":"oneprop2"}}}}');
                expect(length).toBe(1);
            });

            it("should serialize an object using its identifier property as the label", function() {
                var object = objects.OneProp.create();
                var simple = objects.Simple.create();

                object.prop = simple;
                simple.identifier = "myprop";

                serialization = serializer.serializeObject(object);
                expect(stripPP(serialization)).toBe('{"myprop":{"prototype":"serialization/testobjects-v2[Simple]","properties":{"number":42,"string":"string"}},"root":{"prototype":"serialization/testobjects-v2[OneProp]","properties":{"prop":{"@":"myprop"}}}}');
            });
        });

        it("should return all external objects", function() {
            var object = objects.CustomRef.create(),
                serialization = serializer.serializeObject(object),
                externalObjects = serializer.getExternalObjects(),
                length = 0;

            for (var uuid in externalObjects) {
                if (externalObjects.hasOwnProperty(uuid)) {
                    length++;
                }
            }

            expect(length).toBe(1);
            expect(externalObjects["empty"]).toBe(object.object);
        });
    });

    describe("Custom serialization", function() {
        var object;

        beforeEach(function() {
            object = objects.Custom.create();
        });

        it("should serialize the object manually using default type", function() {
            object.serializeSelf = function(serializer) {
                serializer.setProperties();
            };

            var serialization = serializer.serializeObject(object);
            expect(stripPP(serialization)).toBe('{"root":{"prototype":"serialization/testobjects-v2[Custom]","properties":{"number":42}}}');
        });

        describe("by only serializing properties", function() {
            it("should serialize the object manually without listeners", function() {
                object.serializeSelf = function(serializer) {
                    serializer.setProperties();
                };
                object.addEventListener("action", Montage.create(), false);

                var serialization = serializer.serializeObject(object);
                expect(stripPP(serialization)).toBe('{"root":{"prototype":"serialization/testobjects-v2[Custom]","properties":{"number":42}}}');
            });

            it("should serialize the object manually without bindings", function() {
                object.serializeSelf = function(serializer) {
                    serializer.setProperties();
                };
                Object.defineBinding(object, "number", {
                    boundObject: objects.OneProp.create(),
                    boundObjectPropertyPath: "prop",
                    oneway: true
                });

                var serialization = serializer.serializeObject(object);
                expect(stripPP(serialization)).toBe('{"root":{"prototype":"serialization/testobjects-v2[Custom]","properties":{}}}');
            });

            it("should serialize the object manually without listeners or bindings", function() {
                object.serializeSelf = function(serializer) {
                    serializer.setProperties();
                };
                Object.defineBinding(object, "number", {
                    boundObject: objects.OneProp.create(),
                    boundObjectPropertyPath: "prop",
                    oneway: true
                });
                object.addEventListener("action", Montage.create(), false);

                var serialization = serializer.serializeObject(object);
                expect(stripPP(serialization)).toBe('{"root":{"prototype":"serialization/testobjects-v2[Custom]","properties":{}}}');
            });
        });

        describe("by serializing properties and listeners", function() {
            it("should serialize the object manually with listeners", function() {
                object.serializeSelf = function(serializer) {
                    serializer.setProperties();
                    serializer.setUnit("listeners");
                };
                object.addEventListener("action", Montage.create(), false);

                var serialization = serializer.serializeObject(object);
                expect(stripPP(serialization)).toBe('{"montage":{"prototype":"montage/core/core[Montage]","properties":{"type":"action","listener":{"@":"montage2"},"capture":false}},"root":{"prototype":"serialization/testobjects-v2[Custom]","properties":{"number":42},"listeners":[{"@":"montage"}]}}');
            });

            it("should serialize the object manually without bindings", function() {
                object.serializeSelf = function(serializer) {
                    serializer.setProperties();
                    serializer.setUnit("listeners");
                };
                Object.defineBinding(object, "number", {
                    boundObject: objects.OneProp.create(),
                    boundObjectPropertyPath: "prop",
                    oneway: true
                });

                var serialization = serializer.serializeObject(object);
                expect(stripPP(serialization)).toBe('{"root":{"prototype":"serialization/testobjects-v2[Custom]","properties":{}}}');
            });

            it("should serialize the object manually with listeners and no bindings", function() {
                object.serializeSelf = function(serializer) {
                    serializer.setProperties();
                    serializer.setUnit("listeners");
                };
                Object.defineBinding(object, "number", {
                    boundObject: objects.OneProp.create(),
                    boundObjectPropertyPath: "prop",
                    oneway: true
                });
                object.addEventListener("action", Montage.create(), false);

                var serialization = serializer.serializeObject(object);
                expect(stripPP(serialization)).toBe('{"montage":{"prototype":"montage/core/core[Montage]","properties":{"type":"action","listener":{"@":"montage2"},"capture":false}},"root":{"prototype":"serialization/testobjects-v2[Custom]","properties":{},"listeners":[{"@":"montage"}]}}');
            });
        });

        describe("by serializing properties and bindings", function() {
            it("should serialize the object manually without listeners", function() {
                object.serializeSelf = function(serializer) {
                    serializer.setProperties();
                    serializer.setUnit("bindings");
                };
                object.addEventListener("action", Montage.create(), false);

                var serialization = serializer.serializeObject(object);
                expect(stripPP(serialization)).toBe('{"root":{"prototype":"serialization/testobjects-v2[Custom]","properties":{"number":42}}}');
            });

            it("should serialize the object manually with bindings", function() {
                object.serializeSelf = function(serializer) {
                    serializer.setProperties();
                    serializer.setUnit("bindings");
                };
                Object.defineBinding(object, "number", {
                    boundObject: objects.OneProp.create(),
                    boundObjectPropertyPath: "prop",
                    oneway: true
                });

                var serialization = serializer.serializeObject(object);
                expect(stripPP(serialization)).toBe('{"bindingdescriptor":{"prototype":"montage/core/event/binding[BindingDescriptor]","properties":{"boundObject":{"@":"oneprop"},"boundObjectPropertyPath":"prop","oneway":true}},"root":{"prototype":"serialization/testobjects-v2[Custom]","properties":{},"bindings":{"number":{"@":"bindingdescriptor"}}}}');
            });

            it("should serialize the object manually with bindings and no listeners", function() {
                object.serializeSelf = function(serializer) {
                    serializer.setProperties();
                    serializer.setUnit("bindings");
                };
                Object.defineBinding(object, "number", {
                    boundObject: objects.OneProp.create(),
                    boundObjectPropertyPath: "prop",
                    oneway: true
                });
                object.addEventListener("action", Montage.create(), false);

                var serialization = serializer.serializeObject(object);
                expect(stripPP(serialization)).toBe('{"bindingdescriptor":{"prototype":"montage/core/event/binding[BindingDescriptor]","properties":{"boundObject":{"@":"oneprop"},"boundObjectPropertyPath":"prop","oneway":true}},"root":{"prototype":"serialization/testobjects-v2[Custom]","properties":{},"bindings":{"number":{"@":"bindingdescriptor"}}}}');
            });
        });

        describe("by serializing properties and bindings", function() {
            it("should serialize the object manually with listeners", function() {
                object.serializeSelf = function(serializer) {
                    serializer.setProperties();
                    serializer.setAllUnits();
                };
                object.addEventListener("action", Montage.create(), false);

                var serialization = serializer.serializeObject(object);
                expect(stripPP(serialization)).toBe('{"montage":{"prototype":"montage/core/core[Montage]","properties":{"type":"action","listener":{"@":"montage2"},"capture":false}},"root":{"prototype":"serialization/testobjects-v2[Custom]","properties":{"number":42},"listeners":[{"@":"montage"}]}}');
            });

            it("should serialize the object manually with bindings", function() {
                object.serializeSelf = function(serializer) {
                    serializer.setProperties();
                    serializer.setAllUnits();
                };
                Object.defineBinding(object, "number", {
                    boundObject: objects.OneProp.create(),
                    boundObjectPropertyPath: "prop",
                    oneway: true
                });

                var serialization = serializer.serializeObject(object);
                expect(stripPP(serialization)).toBe('{"bindingdescriptor":{"prototype":"montage/core/event/binding[BindingDescriptor]","properties":{"boundObject":{"@":"oneprop"},"boundObjectPropertyPath":"prop","oneway":true}},"root":{"prototype":"serialization/testobjects-v2[Custom]","properties":{},"bindings":{"number":{"@":"bindingdescriptor"}}}}');
            });

            it("should serialize the object manually with bindings and listeners", function() {
                object.serializeSelf = function(serializer) {
                    serializer.setProperties();
                    serializer.setAllUnits();
                };
                Object.defineBinding(object, "number", {
                    boundObject: objects.OneProp.create(),
                    boundObjectPropertyPath: "prop",
                    oneway: true
                });
                object.addEventListener("action", Montage.create(), false);

                var serialization = serializer.serializeObject(object);
                expect(stripPP(serialization)).toBe('{"montage":{"prototype":"montage/core/core[Montage]","properties":{"type":"action","listener":{"@":"montage2"},"capture":false}},"bindingdescriptor":{"prototype":"montage/core/event/binding[BindingDescriptor]","properties":{"boundObject":{"@":"oneprop"},"boundObjectPropertyPath":"prop","oneway":true}},"root":{"prototype":"serialization/testobjects-v2[Custom]","properties":{},"listeners":[{"@":"montage"}],"bindings":{"number":{"@":"bindingdescriptor"}}}}');
            });
        });

        describe("by serializing to a different type", function() {
            it("should serialize as OneProp", function() {
                var object = {
                    serializeSelf: function(serializer) {
                        serializer.setType("prototype", "serialization/testobjects-v2[OneProp]");
                    }
                };
                var serialization = serializer.serializeObject(object);
                expect(stripPP(serialization)).toBe('{"root":{"prototype":serialization/testobjects-v2[OneProp],"properties":{}}}');
            });

            it("should serialize the returned object instead", function() {
                var oneProp = objects.OneProp.create();
                var twoProp = objects.TwoProps.create();
                oneProp.prop = object;
                object.serializeSelf = function(serializer) {
                    return twoProp;
                };
                var serialization = serializer.serializeObject(oneProp);
                expect(stripPP(serialization)).toBe('{"twoprops":{"prototype":"serialization/testobjects-v2[TwoProps]","properties":{}},"root":{"prototype":"serialization/testobjects-v2[OneProp]","properties":{"prop":{"@":"twoprops"}}}}');
            });

            it("should serialize a literal object instead", function() {
                var oneProp = objects.OneProp.create();
                oneProp.prop = object;
                object.serializeSelf = function(serializer) {
                    return {
                        foo: "bar"
                    };
                };
                var serialization = serializer.serializeObject(oneProp);
                expect(stripPP(serialization)).toBe('{"root":{"prototype":"serialization/testobjects-v2[OneProp]","properties":{"prop":{"foo":"bar"}}}}');
            });

            it("should serialize the returned object instead at the root", function() {
                var twoProp = objects.TwoProps.create();
                object.serializeSelf = function(serializer) {
                    return twoProp;
                };
                var serialization = serializer.serializeObject(object);
                expect(stripPP(serialization)).toBe('{"root":{"prototype":"serialization/testobjects-v2[TwoProps]","properties":{}}}');
            });
        });
    });
});