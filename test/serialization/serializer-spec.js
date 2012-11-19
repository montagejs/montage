/* <copyright>
Copyright (c) 2012, Motorola Mobility LLC.
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of Motorola Mobility LLC nor the names of its
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */
 var Montage = require("montage/core/core").Montage,
     Component = require("montage/ui/component").Component,
     Serializer = require("montage/core/serializer").Serializer,
     serialize = require("montage/core/serializer").serialize,
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

        it("should serialize string with shorthand", function() {
            expect(JSON.parse(serialize("string"))).toEqual({
                root: {
                    value: "string"
                }
            });
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

        it("should serialize an Object literal created in a different document", function() {
            var iframe = document.createElement("iframe");
            iframe.style.display = "none";
            window.document.body.appendChild(iframe);

            var object = new iframe.contentWindow.Object;
            object.number = 42;
            object.string = "string";
            var serialization = serializer.serializeObject(object);

            expect(stripPP(serialization)).toBe('{"root":{"value":{"number":42,"string":"string"}}}');
            iframe.parentNode.removeChild(iframe);

        });

        it("should serialize a RegExp created in a different document", function() {
            var iframe = document.createElement("iframe");
            iframe.style.display = "none";
            window.document.body.appendChild(iframe);

            var regexp = new iframe.contentWindow.RegExp("regexp");
            var serialization = serializer.serializeObject({
                regexp: regexp
            });

            expect(stripPP(serialization)).toBe('{"root":{"value":{"regexp":{"/":{"source":"regexp","flags":""}}}}}');
            iframe.parentNode.removeChild(iframe);

        });

        it("should serialize an Element created in a different document", function() {
            var iframe = document.createElement("iframe");
            iframe.style.display = "none";
            window.document.body.appendChild(iframe);

            var element = iframe.contentWindow.document.createElement("div");

            element.setAttribute("data-montage-id", "element");
            var serialization = serializer.serializeObject({
                element: element
            });

            expect(stripPP(serialization)).toBe('{"root":{"value":{"element":{"#":"element"}}}}');
            iframe.parentNode.removeChild(iframe);
        });

        it("should serialize a function", function() {
            var funktion = function square(x) {
                return x*x;
            };

            var serialization = serializer._serializeFunction(funktion);
            var object = JSON.parse(serialization)["->"];

            expect((new Function(object.arguments, object.body))(2)).toBe(4);
        });

        it("should not serialize objects with a null value", function() {
            var object = {number: 42, nil: null};
            var serialization = serializer.serialize(object);

            expect(stripPP(serialization)).toBe('{"number":{"value":42}}');
        });

        it("should serialize objects with a null value", function() {
            var object = {number: 42, nil: null};
            serializer.serializeNullValues = true;
            var serialization = serializer.serialize(object);

            expect(stripPP(serialization)).toBe('{"number":{"value":42},"nil":{"value":null}}');
        });

        it("should serialize array with shorthand", function() {
            expect(JSON.parse(serialize([1, 2, 3]))).toEqual({
                root: {
                    value: [1, 2, 3]
                }
            });
        });

        // TODO: object literal with functions
        // TODO: object literal with references to user objects
    });

    describe("Serialization Structure", function() {
        it("should serialize a number", function() {
            var object = Montage.create();
            var serialization = serializer.serializeObject(3.14);
            expect(stripPP(serialization)).toBe('{"root":{"value":3.14}}');
        });

        it("should serialize a literal object", function() {
            var object = Montage.create();
            var serialization = serializer.serializeObject({number: 3.14});
            expect(stripPP(serialization)).toBe('{"root":{"value":{"number":3.14}}}');
        });
    });

    describe("Objects serialization", function(){
        it("should serialize a class object with no properties", function() {
            var object = objects.Empty;
            var serialization = stripPP(serializer.serializeObject(object));
            expect(stripPP(serialization)).toBe('{"root":{"object":"serialization/testobjects-v2[Empty]","properties":{}}}');
        });

        it("should serialize an instance object with no properties", function() {
            var object = objects.Empty.create();
            var serialization = serializer.serializeObject(object);

            expect(stripPP(serialization)).toBe('{"root":{"prototype":"serialization/testobjects-v2[Empty]","properties":{}}}');
        });

        it("should serialize an instance object with an array property", function() {
            var object = objects.OneProp.create();
            object.prop = [1, 2, 3, 4, 5];
            var serialization = serializer.serializeObject(object);
            expect(stripPP(serialization)).toBe('{"root":{"prototype":"serialization/testobjects-v2[OneProp]","properties":{"prop":[1,2,3,4,5]}}}');
        });

        it("should serialize an instance object with a distinct array property", function() {
            var object = objects.DistinctArrayProp.create();
            var serialization = serializer.serializeObject(object);
             expect(stripPP(serialization)).toBe('{"root":{"prototype":"serialization/testobjects-v2[DistinctArrayProp]","properties":{"prop":[]}}}');
        });

        it("should serialize an instance object with a distinct literal property", function() {
            var object = objects.DistinctLiteralProp.create();
            var serialization = serializer.serializeObject(object);
            expect(stripPP(serialization)).toBe('{"root":{"prototype":"serialization/testobjects-v2[DistinctLiteralProp]","properties":{"prop":{}}}}');
        });

        it("should serialize an instance object with no references to other objects", function() {
            var object = objects.Simple.create();
            var serialization = serializer.serializeObject(object);
            expect(stripPP(serialization)).toBe('{"root":{"prototype":"serialization/testobjects-v2[Simple]","properties":{"number":42,"string":"string"}}}');
        });

        it("should serialize an instance object that references other objects", function() {
            var object = objects.TwoProps.create();
            var simple = objects.Simple.create();

            object.prop1 = ["with", "a", "reference"];
            object.prop2 = simple;

            var serialization = serializer.serializeObject(object);
             expect(stripPP(serialization)).toBe('{"simple":{"prototype":"serialization/testobjects-v2[Simple]","properties":{"number":42,"string":"string"}},"root":{"prototype":"serialization/testobjects-v2[TwoProps]","properties":{"prop1":["with","a","reference"],"prop2":{"@":"simple"}}}}');
        });

        it("should serialize an instance object that references itself", function() {
            var object = objects.OneProp.create();

            object.prop = object;

            var serialization = serializer.serializeObject(object);
            expect(stripPP(serialization)).toBe('{"root":{"prototype":"serialization/testobjects-v2[OneProp]","properties":{"prop":{"@":"root"}}}}');
        });

        it("should serialize an instance object that has an indirect cycle", function() {
            var object1 = objects.OneProp.create();
            var object2 = objects.OneProp.create();

            object1.prop = object2;
            object2.prop = object1;

            var serialization = serializer.serializeObject(object1);
            expect(stripPP(serialization)).toBe('{"oneprop":{"prototype":"serialization/testobjects-v2[OneProp]","properties":{"prop":{"@":"root"}}},"root":{"prototype":"serialization/testobjects-v2[OneProp]","properties":{"prop":{"@":"oneprop"}}}}');
        });

        it("should serialize an instance object with a custom serialization", function() {
            var object = objects.CustomProperties.create();

            object.prop = object;

            var serialization = serializer.serializeObject(object);
            expect(stripPP(serialization)).toBe('{"root":{"prototype":"serialization/testobjects-v2[CustomProperties]","properties":{"manchete":226}}}');
        });

        it("should serialize a reference to an instance object with a custom property serialization", function() {
            var object = objects.CustomPropertiesRef.create();

            var serialization = serializer.serializeObject(object);
            expect(stripPP(serialization)).toBe('{"root":{"prototype":"serialization/testobjects-v2[CustomPropertiesRef]","properties":{"object":{"@":"empty"}}},"empty":{}}');
        });

        it("should serialize a reference to an instance object with a custom serialization", function() {
            var object = objects.CustomRef.create();

            var serialization = serializer.serializeObject(object);
            expect(stripPP(serialization)).toBe('{"root":{"prototype":"serialization/testobjects-v2[CustomRef]","properties":{"object":{"@":"empty"}}},"empty":{}}');
        });

        it("should serialize an external reference to an object that implements serializeSelf", function() {
            var object = objects.CustomPropertiesRef.create();

            object.object = objects.CustomRef.create();

            var serialization = serializer.serializeObject(object);
            expect(stripPP(serialization)).toBe('{"root":{"prototype":"serialization/testobjects-v2[CustomPropertiesRef]","properties":{"object":{"@":"customref"}}},"customref":{}}');
        });

        it("should serialize a function in an Object literal", function() {
            var object = {
                method: function square(x) {
                    return x*x;
                }
            };
            var serialization = serializer.serializeObject(object);
            var functionJSON = JSON.parse(serialization).root.value.method["->"];
            expect((new Function(functionJSON.arguments, functionJSON.body))(2)).toBe(4);
        });

        it("should serialize a reference to an instance object using labels", function() {
            var object = objects.OneProp.create();
            var simple = objects.Simple.create();

            object.prop = simple;

            var serialization = serializer.serialize({root: object, SimpleA: simple});
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

            var serialization = serializer.serialize(labels);
            expect(stripPP(serialization)).toBe('{"simple":{"prototype":"serialization/testobjects-v2[Simple]","properties":{"number":42,"string":"string"}},"graphA":{"prototype":"serialization/testobjects-v2[OneProp]","properties":{"prop":{"@":"simple"}}},"graphB":{"prototype":"serialization/testobjects-v2[TwoProps]","properties":{"prop1":"string","prop2":42}}}');
        });

        it("should serialize an element", function() {
            var object = objects.OneProp.create();
            var element = document.createElement("div");

            element.setAttribute("data-montage-id", "id");
            object.prop = element;

            var serialization = serializer.serializeObject(object);
            expect(stripPP(serialization)).toBe('{"root":{"prototype":"serialization/testobjects-v2[OneProp]","properties":{"prop":{"#":"id"}}}}');
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
                externalObjects = serializer.getExternalObjects();
                for (var uuid in externalObjects) {
                    if (externalObjects.hasOwnProperty(uuid)) {
                        length++;
                    }
                }

                expect(stripPP(serialization)).toBe('{"oneprop":{"prototype":"serialization/testobjects-v2[OneProp]","properties":{"prop":"prop1"}},"root":{"prototype":"serialization/testobjects-v2[SerializableAttribute]","properties":{"prop1a":{"@":"oneprop"},"prop1b":{"@":"oneprop"},"prop2a":{"@":"oneprop2"},"prop2b":{"@":"oneprop2"}}},"oneprop2":{}}');
                expect(length).toBe(1);
            });

            it("should serialize an object using its identifier property as the label", function() {
                var object = objects.OneProp.create();
                var simple = objects.Simple.create();

                object.prop = simple;
                simple.identifier = "myprop";

                var serialization = serializer.serializeObject(object);
                expect(stripPP(serialization)).toBe('{"myprop":{"prototype":"serialization/testobjects-v2[Simple]","properties":{"number":42,"string":"string","identifier":"myprop"}},"root":{"prototype":"serialization/testobjects-v2[OneProp]","properties":{"prop":{"@":"myprop"}}}}');
            });

            it("should not serialize an object using its identifier property as the label if it's invalid", function() {
                var object = objects.OneProp.create();
                var simple = objects.Simple.create();

                object.prop = simple;
                simple.identifier = "my-prop";

                var serialization = JSON.parse(serializer.serializeObject(object));
                expect("my-prop" in serialization).toBeFalsy();
            });
        });

        it("should return all external objects", function() {
            var object = objects.CustomPropertiesRef.create(),
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

        it("should not report a serialized object, after being serialized as a reference, as an external object", function() {
            var object = objects.OneProp.create(),
                oneProp = objects.OneProp.create(),
                externalObjects,
                serialization;

            object.serializeProperties = function(serializer) {
                serializer.set("object1", oneProp, "reference");
                serializer.set("object2", oneProp);
            };
            serialization = serializer.serializeObject(object);
            externalObjects = serializer.getExternalObjects(),

            expect(Object.keys(externalObjects).length).toBe(0);
        });

        it("should avoid name clashes between given labels and generated labels", function() {
            var object = objects.OneProp.create(),
                oneProp = objects.OneProp.create(),
                twoProp = objects.TwoProps.create(),
                serialization;


            oneProp.identifier = "generated";
            object.prop = oneProp;

            serialization = serializer.serialize({root: object, generated: twoProp});

            // oneProp should be serialized under "generated2" label
            expect(Object.keys(JSON.parse(serialization)).length).toBe(3);
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
                expect(stripPP(serialization)).toBe('{"root":{"prototype":"serialization/testobjects-v2[Custom]","properties":{"number":42},"listeners":[{"type":"action","listener":{"@":"montage"},"capture":false}]},"montage":{}}');
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
                expect(stripPP(serialization)).toBe('{"root":{"prototype":"serialization/testobjects-v2[Custom]","properties":{},"listeners":[{"type":"action","listener":{"@":"montage"},"capture":false}]},"montage":{}}');
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
                expect(stripPP(serialization)).toBe('{"root":{"prototype":"serialization/testobjects-v2[Custom]","properties":{},"bindings":{"number":{"<-":"@oneprop.prop"}}},"oneprop":{}}');
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
                expect(stripPP(serialization)).toBe('{"root":{"prototype":"serialization/testobjects-v2[Custom]","properties":{},"bindings":{"number":{"<-":"@oneprop.prop"}}},"oneprop":{}}');
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
                expect(stripPP(serialization)).toBe('{"root":{"prototype":"serialization/testobjects-v2[Custom]","properties":{"number":42},"listeners":[{"type":"action","listener":{"@":"montage"},"capture":false}]},"montage":{}}');
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
                expect(stripPP(serialization)).toBe('{"root":{"prototype":"serialization/testobjects-v2[Custom]","properties":{},"bindings":{"number":{"<-":"@oneprop.prop"}}},"oneprop":{}}');
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
                expect(stripPP(serialization)).toBe('{"root":{"prototype":"serialization/testobjects-v2[Custom]","properties":{},"listeners":[{"type":"action","listener":{"@":"montage"},"capture":false}],"bindings":{"number":{"<-":"@oneprop.prop"}}},"montage":{},"oneprop":{}}');
            });
        });

        describe("by serializing to a different type", function() {
            it("should serialize as OneProp", function() {
                object.serializeSelf = function(serializer) {
                    serializer.setType("prototype", "serialization/testobjects-v2[OneProp]");
                };
                var serialization = serializer.serializeObject(object);
                expect(stripPP(serialization)).toBe('{"root":{"prototype":serialization/testobjects-v2[OneProp],"properties":{}}}');
            });

            it("should point to a non-serialized object", function() {
                var oneProp = objects.OneProp.create();

                object.serializeSelf = function(serializer) {
                    return {
                        external: serializer.addObjectReference(oneProp)
                    };
                };
                var serialization = serializer.serializeObject(object);
                expect(stripPP(serialization)).toBe('{"root":{"value":{"external":{"@":"oneprop"}}},"oneprop":{}}');
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

        describe("by serializing objects with a delegate", function() {
            it("should serialize the properties list defined by the delegate", function() {
                var twoProp = objects.TwoProps.create();
                twoProp.prop1 = 1;
                twoProp.prop2 = 2;

                serializer.delegate = {
                    serializeObjectProperties: function(serializer, object, propertyNames) {
                        for (var i = 0; i < propertyNames.length; i++) {
                            serializer.set(propertyNames[i], null);
                        }
                        serializer.set("prop3", object.prop2);
                    }
                };
                var serialization = serializer.serializeObject(twoProp);
                expect(stripPP(serialization)).toBe('{"root":{"prototype":"serialization/testobjects-v2[TwoProps]","properties":{"prop3":2}}}');
            });
        });
    });
});
