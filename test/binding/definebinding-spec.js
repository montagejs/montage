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
var Montage = require("montage").Montage,
    Serializer = require("montage/core/serializer").Serializer,
    Deserializer = require("montage/core/deserializer").Deserializer,
    ChangeNotification = require("montage/core/change-notification").ChangeNotification;

var stripPP = function stripPrettyPrintting(str) {
    return str.replace(/\n\s*/g, "");
};

var Alpha = Montage.create(Montage, {

    _foo: {
        enumerable: false,
        value: null
    },

    foo: {
        enumerable: false,
        set: function(value) {
            this._foo = value;
        },
        get: function() {
            return this._foo;
        }
    },

    valueOnly: {
        enumerable: false,
        value: null
    },

    _getOnly: {
        enumerable: false,
        value: "getOnlyValue"
    },

    getOnly: {
        enumerable: false,
        get: function() {
            return this._getOnly;
        }
    },

    _setOnly: {
        enumerable: false,
        value: "setOnlyValue"
    },

    setOnly: {
        enumerable: false,
        set: function(value) {
            this._setOnly = value;
        }
    }

});

var Omega = Montage.create(Montage, {

    _bar: {
        enumerable: false,
        value: null
    },

    bar: {
        enumerable: false,
        set: function(value) {
            this._bar = value;
        },
        get: function() {
            return this._bar;
        }
    }
});

describe("binding/definebinding-spec", function() {

    describe("a typical installed binding", function() {

        describe('that is not "oneway"', function() {

            it("must correctly observe a propertyPath where a get/set property follows a value property", function() {
                var sourceObject = Alpha.create(),
                    boundObject = Alpha.create(),
                    intermediateValue = Omega.create();

                boundObject.valueOnly = intermediateValue;
                intermediateValue.bar = "original value";

                Object.defineBinding(sourceObject, "foo", {
                    boundObject: boundObject,
                    boundObjectPropertyPath: "valueOnly.bar"
                });

                intermediateValue.bar = "hey new value here"

                expect(sourceObject.foo).toBe("hey new value here");
                expect(boundObject.valueOnly).toBe(intermediateValue);
                expect(intermediateValue.bar).toBe("hey new value here");
            });

            it("should propagate a change from the source object's source property path to the bound object's bound property path, if the binding is not 'oneway'", function() {
                var sourceObject = Alpha.create(),
                boundObject = Omega.create();

                Object.defineBinding(sourceObject, "foo", {
                    boundObject: boundObject,
                    boundObjectPropertyPath: "bar"
                });

                sourceObject.foo = 42;

                expect(boundObject.bar).toBe(42);

                sourceObject.foo = false;

                expect(boundObject.bar).toBeFalsy();

                sourceObject.foo = true;

                expect(boundObject.bar).toBeTruthy();


            });

            it("must not give the specified boundValueMutator a chance to modify the value being passed from the bound object to the source object", function() {
                var sourceObject = Alpha.create(),
                        boundObject = Omega.create();

                Object.defineBinding(sourceObject, "foo", {
                    boundObject: boundObject,
                    boundObjectPropertyPath: "bar",
                    boundValueMutator: function() {
                        return "no!";
                    }
                });

                sourceObject.foo = "foo";

                expect(boundObject.bar).toBe("foo");
            });

        });

        it("must not propagate a change from the source object's source property path to the bound object's bound property path", function() {
            var sourceObject = Alpha.create(),
            boundObject = Omega.create();

            Object.defineBinding(sourceObject, "foo", {
                boundObject: boundObject,
                boundObjectPropertyPath: "bar",
                oneway: true
            });

            sourceObject.foo = 42;

            expect(boundObject.bar).toBe(null);

            sourceObject.foo = false;
            boundObject.bar = true;

            expect(sourceObject.foo).toBeTruthy();
        });

        it("should propagate a change from the bound object's bound property path to the source object's source property path", function() {
            var sourceObject = Alpha.create(),
            boundObject = Omega.create();

            Object.defineBinding(sourceObject, "foo", {
                boundObject: boundObject,
                boundObjectPropertyPath: "bar",
                oneway: true
            });

            boundObject.bar = "foo";

            expect(sourceObject.foo).toBe("foo");
        });

        it("should propagate the original value from the bound object's bound property path to the source object's source property path", function() {
            var sourceObject = Alpha.create(),
            boundObject = Omega.create();

            boundObject.bar = "foo";

            Object.defineBinding(sourceObject, "foo", {
                boundObject: boundObject,
                boundObjectPropertyPath: "bar",
                oneway: true
            });

            expect(sourceObject.foo).toBe("foo");
        });

        it("should properly install a binding on a property that has only a 'get' in its propertyDescriptor, without making the property 'set-able'", function() {
            var sourceObject = Omega.create(),
                boundObject = Alpha.create();

            Object.defineBinding(sourceObject, "bar", {
                boundObject: boundObject,
                boundObjectPropertyPath: "getOnly",
                oneway: true
            });

            expect(sourceObject.bar).toBe("getOnlyValue");

            boundObject.getOnly = "newGetOnlyValue";
            expect(boundObject.getOnly).toBe("getOnlyValue");
            expect(sourceObject.bar).toBe("getOnlyValue");
        });

        describe('deferred bindings', function() {
            it("must not propagate a change from the bound object's bound property path to the source object's source property path if the binding is deferred", function() {
                var sourceObject = Alpha.create(),
                boundObject = Omega.create();

                boundObject.bar = "foo";

                Object.defineBinding(sourceObject, "foo", {
                    boundObject: boundObject,
                    boundObjectPropertyPath: "bar",
                    oneway: false,
                    deferred: true
                });

                expect(sourceObject.foo).toBeNull();

                boundObject.bar = "bar";
                expect(sourceObject.foo).toBeNull();
            });

            it("must not propagate a change from the source object's source property path to the bound object's bound property path if the binding is deferred", function() {
                var sourceObject = Alpha.create(),
                boundObject = Omega.create();

                sourceObject.foo = "foo";
                boundObject.bar = "bar";

                Object.defineBinding(sourceObject, "foo", {
                    boundObject: boundObject,
                    boundObjectPropertyPath: "bar",
                    oneway: false,
                    deferred: true
                });

                expect(sourceObject.foo).toBe("foo");
                expect(boundObject.bar).toBe("bar");

                sourceObject.foo = "foo";
                expect(boundObject.bar).toBe("bar");
            });

            it("should propagate the initial deferred value from the bound object's bound property path to the source object's source property path", function() {
                var sourceObject = Alpha.create(),
                boundObject = Omega.create();

                boundObject.bar = "foo";

                Object.defineBinding(sourceObject, "foo", {
                    boundObject: boundObject,
                    boundObjectPropertyPath: "bar",
                    oneway: false,
                    deferred: true
                });

                Object.applyBindingsDeferredValues(sourceObject);
                expect(sourceObject.foo).toBe("foo");
            });

            it("should propagate a deferred change from the source object's source property path to the bound object's bound property path", function() {
                var sourceObject = Alpha.create(),
                boundObject = Omega.create();

                boundObject.bar = "foo";

                Object.defineBinding(sourceObject, "foo", {
                    boundObject: boundObject,
                    boundObjectPropertyPath: "bar",
                    oneway: false,
                    deferred: true
                });

                sourceObject.foo = "sourceFoo";
                expect(boundObject.bar).toBe("foo");

                Object.applyBindingsDeferredValues(sourceObject);
                expect(boundObject.bar).toBe("sourceFoo");
            });

            it("should propagate a deferred change from the bound object's bound property path to the source object's source property path", function() {
                var sourceObject = Alpha.create(),
                boundObject = Omega.create(),
                boundObjectWrapper = Omega.create();

                boundObject.bar = "foo";
                boundObjectWrapper.bar = boundObject;

                Object.defineBinding(sourceObject, "foo", {
                    boundObject: boundObjectWrapper,
                    boundObjectPropertyPath: "bar.bar",
                    oneway: false,
                    deferred: true
                });

                boundObject.bar = "baz";
                expect(sourceObject.foo).toBeNull();

                Object.applyBindingsDeferredValues(sourceObject);
                expect(sourceObject.foo).toBe("baz");
            });

            it("should propagate a deferred change from the bound object's bound property path to the source object's source property path after several deferred changes", function() {
                var sourceObject = Alpha.create(),
                boundObject = Alpha.create(),
                boundObjectBaz = Alpha.create(),
                boundObjectWrapper = Omega.create();

                boundObject.foo = "foo";
                boundObjectBaz.foo = "baz";
                boundObjectWrapper.bar = boundObject;

                Object.defineBinding(sourceObject, "foo", {
                    boundObject: boundObjectWrapper,
                    boundObjectPropertyPath: "bar.foo",
                    oneway: false,
                    deferred: true
                });

                boundObject.foo = "bar2";
                boundObject.foo = "bar3";
                boundObjectWrapper.bar = boundObjectBaz;

                expect(sourceObject.foo).toBeNull();

                Object.applyBindingsDeferredValues(sourceObject);
                expect(sourceObject.foo).toBe("baz");
            });

            it("should propagate a deferred change from the bound object's bound property path to the source object's source property path to the entire chain", function() {
                var sourceObject = Alpha.create(),
                anotherSourceObject = Alpha.create(),
                boundObject = Omega.create();

                Object.defineBinding(sourceObject, "foo", {
                    boundObject: boundObject,
                    boundObjectPropertyPath: "bar",
                    deferred: true
                });

                Object.defineBinding(anotherSourceObject, "foo", {
                    boundObject: sourceObject,
                    boundObjectPropertyPath: "foo"
                });

                boundObject.bar = "bar";

                expect(sourceObject.foo).toBeNull();
                expect(anotherSourceObject.foo).toBeNull();

                Object.applyBindingsDeferredValues(sourceObject);
                expect(sourceObject.foo).toBe("bar");
                expect(anotherSourceObject.foo).toBe("bar");
            });
        });

        describe('disabled bindings', function() {
            it("must not propagate a change from the bound object's bound property path to the source object's source property path if the bindings are disabled", function() {
                var sourceObject = Alpha.create(),
                boundObject = Omega.create();

                boundObject.bar = "foo";

                Object.disableBindings(sourceObject);
                Object.defineBinding(sourceObject, "foo", {
                    boundObject: boundObject,
                    boundObjectPropertyPath: "bar"
                });

                expect(sourceObject.foo).toBeNull();

                boundObject.bar = "bar";
                expect(sourceObject.foo).toBeNull();
            });

            it("should propagate a change from the bound object's bound property path to the source object's source property path when bindings are enabled", function() {
                var sourceObject = Alpha.create(),
                boundObject = Omega.create();

                Object.disableBindings(sourceObject);
                Object.defineBinding(sourceObject, "foo", {
                    boundObject: boundObject,
                    boundObjectPropertyPath: "bar"
                });

                boundObject.bar = "bar";

                Object.enableBindings(sourceObject);
                expect(sourceObject.foo).toBe("bar");
            });

            it("must not propagate a change from the bound object's bound property path to the source object's source property path for deferred bindings when bindings are enabled", function() {
                var sourceObject = Alpha.create(),
                boundObject = Omega.create();

                Object.disableBindings(sourceObject);
                Object.defineBinding(sourceObject, "foo", {
                    boundObject: boundObject,
                    boundObjectPropertyPath: "bar",
                    deferred: true
                });

                boundObject.bar = "bar";

                Object.enableBindings(sourceObject);
                expect(sourceObject.foo).toBeNull();
            });
        });

        it("should give the specified boundValueMutator a chance to modify the value being passed from the source object to the bound object", function() {
            var sourceObject = Alpha.create(),
                    boundObject = Omega.create();

            Object.defineBinding(sourceObject, "foo", {
                boundObject: boundObject,
                boundObjectPropertyPath: "bar",
                boundValueMutator: function() {
                    return "yay";
                }
            });

            boundObject.bar = "foo";

            expect(sourceObject.foo).toBe("yay");
        });

        it("should not define a property for a nonexistent property on a bound object", function() {
            // TODO this is what's happening right now, and while it seems a little odd it's basically how you can
            // observe with the expectation that the property may exist later...
            // This makes a lot more sense on arrays than it does on objects, so I'd definitely understand
            // if we flip the desired functionality
            var sourceObject = Alpha.create(),
                boundObject = Omega.create();

            boundObject.bar = 42;

            Object.defineBinding(sourceObject, "foo", {
                boundObject: boundObject,
                boundObjectPropertyPath: "foo", // the boundObject has no foo property
                oneway: true
            });

            expect(boundObject.hasOwnProperty("foo")).toBeTruthy();
        });

        it("should return undefined when defining a binding along a propertyPath that encounters an undefined property", function() {
            var sourceObject = Alpha.create(),
                boundObject = Omega.create();

            boundObject.bar = 42;

            Object.defineBinding(sourceObject, "foo", {
                boundObject: boundObject,
                boundObjectPropertyPath: "foo", // the boundObject has no foo property
                oneway: true
            });

            expect(sourceObject.foo).toBeUndefined();
        });

        it("should return undefined when an object along an observed propertyPath changes such that the rest of the observed propertyPath is no longer valid", function() {
            var sourceObject = Alpha.create(),
                boundObject = Omega.create(),
                validObjectInPath = Omega.create(),
                deadEndObjectInPath = Alpha.create();

            validObjectInPath.bar = "yay!";
            deadEndObjectInPath.foo = "well...this is foo here";

            boundObject.bar = validObjectInPath;

            Object.defineBinding(sourceObject, "foo", {
                boundObject: boundObject,
                boundObjectPropertyPath: "bar.bar",
                oneway: true
            });

            boundObject.bar = deadEndObjectInPath;

            expect(sourceObject.foo).toBeUndefined();
        });

        it("must throw an error when trying to use a property on a sourceObject as the source of a binding at a different path of the same boundObject", function() {
            var sourceObject = Alpha.create(),
                boundObject = Omega.create();

            Object.defineBinding(sourceObject, "foo", {
                boundObject: boundObject,
                boundObjectPropertyPath: "bar",
                oneway: true
            });

            sourceObject.foo = 42;

            expect(boundObject.bar).toBe(null);

            boundObject.baz = "baz";
            expect(function() {
                Object.defineBinding(sourceObject, "foo", {
                    boundObject: boundObject,
                    boundObjectPropertyPath: "baz",
                    oneway: true
                })
            }).toThrow("sourceObject property, foo, is already the source of a binding");
        });

        it("must throw an error when trying to use a property on a sourceObject as the source of a binding to another object", function() {
            var sourceObject = Alpha.create(),
                boundObject = Omega.create(),
                secondBoundObject = Omega.create();

            Object.defineBinding(sourceObject, "foo", {
                boundObject: boundObject,
                boundObjectPropertyPath: "bar",
                oneway: true
            });

            sourceObject.foo = 42;

            expect(boundObject.bar).toBe(null);

            expect(function() {
                Object.defineBinding(sourceObject, "foo", {
                    boundObject: secondBoundObject,
                    boundObjectPropertyPath: "bar",
                    oneway: true
                })
            }).toThrow("sourceObject property, foo, is already the source of a binding");
        });

        describe("when bound to the same object", function() {

            it("should work as expected", function() {
                var sourceObject = Alpha.create();

                sourceObject.valueOnly = "startValue";

                Object.defineBinding(sourceObject, "foo", {
                    boundObject: sourceObject,
                    boundObjectPropertyPath: "valueOnly",
                    oneway: true
                });

                expect(sourceObject.foo).toBe("startValue");

                sourceObject.valueOnly = "newValue!";
                expect(sourceObject.foo).toBe("newValue!");
            });

        });

    });

    describe("two hop binding with boolean", function() {

        var FormatBar,
            DocumentController,
            TextItem,
            formatBar,
            documentController,
            textItem;

        beforeEach(function() {

            ChangeNotification.__reset__();

            FormatBar = Montage.create(Montage, {boldMode: {value: null}});
            DocumentController = Montage.create(Montage, {boldMode: {value: null}});
            TextItem = Montage.create(Montage, {boldMode: {value: null}});
            formatBar = FormatBar.create();
            documentController = DocumentController.create();
            textItem = TextItem.create();

            // [formatBar] <====> [DocumentController] ----> [TextItem]
            Object.defineBinding(formatBar, "boldMode", {
                boundObject: documentController,
                boundObjectPropertyPath: "boldMode"
            });

            Object.defineBinding(textItem, "boldMode", {
                boundObject: documentController,
                boundObjectPropertyPath: "boldMode",
                oneway: true
            });
        });

        it("should propagate values to all parties when the change occurs on a two-way bound object", function() {
            formatBar.boldMode = true;
            expect(formatBar.boldMode).toBeTruthy();
            expect(documentController.boldMode).toBeTruthy();
            expect(textItem.boldMode).toBeTruthy();
        });

        it("must not propagate values to all parties when the change occurs on a one-way bound object", function() {
            // NOTE this runs this the risk of putting this object out of sync with all the other objects bound together
            textItem.boldMode = false;

            expect(formatBar.boldMode).toBeNull();
            expect(documentController.boldMode).toBeNull();
            expect(textItem.boldMode).toBeFalsy();
        });

        it("must not propagate values to all parties when the value on the two-way binding did not change", function() {
            documentController.boldMode = true;

            expect(formatBar.boldMode).toBeTruthy();
            expect(documentController.boldMode).toBeTruthy();
            expect(textItem.boldMode).toBeTruthy();

        });
    });

    describe("involving strings", function() {

        it("TODO should probably not bother observing an immutable string for a change at its length property", function() {
            var sourceObject = Alpha.create(),
                boundObject = "test";

                Object.defineBinding(sourceObject, "foo", {
                    boundObject: boundObject,
                    boundObjectPropertyPath: "length",
                    oneway: true
                });

                expect(sourceObject.foo).toBe(4);
        });

        it("should propagate a change to a string found at a property when the string's length is being observed", function() {
            var sourceObject = Alpha.create(),
                boundObject = Alpha.create();

                boundObject.bar = "test";

                Object.defineBinding(sourceObject, "foo", {
                    boundObject: boundObject,
                    boundObjectPropertyPath: "bar.length",
                    oneway: true
                });

                boundObject.bar = "hello world";

                expect(sourceObject.foo).toBe(11);
        });

        it("should correctly observe the length property of an object if the object at that property was previously a string", function() {
            var sourceObject = Alpha.create(),
                boundObject = Alpha.create();

                boundObject.bar = "test";

                Object.defineBinding(sourceObject, "foo", {
                    boundObject: boundObject,
                    boundObjectPropertyPath: "bar.length",
                    oneway: true
                });

                boundObject.bar = {length: 12, units: "inches"};

                expect(sourceObject.foo).toBe(12);
        });

        describe("two hop binding with string", function() {

            var FormatBar,
                DocumentController,
                TextItem,
                formatBar,
                documentController,
                textItem;

            beforeEach(function() {

                ChangeNotification.__reset__();

                FormatBar = Montage.create(Montage, {boldMode: {value: null}});
                DocumentController = Montage.create(Montage, {boldMode: {value: null}});
                TextItem = Montage.create(Montage, {boldMode: {value: null}});
                formatBar = FormatBar.create();
                documentController = DocumentController.create();
                textItem = TextItem.create();

                // [formatBar] <====> [DocumentController] ----> [TextItem]
                Object.defineBinding(formatBar, "boldMode", {
                    boundObject: documentController,
                    boundObjectPropertyPath: "boldMode"
                });

                Object.defineBinding(textItem, "boldMode", {
                    boundObject: documentController,
                    boundObjectPropertyPath: "boldMode",
                    oneway: true
                });
            });

            it("should propagate values to all parties when the change occurs on a two-way bound object", function() {
                formatBar.boldMode = "true";
                expect(formatBar.boldMode).toEqual("true");
                expect(documentController.boldMode).toEqual("true");
                expect(textItem.boldMode).toEqual("true");
          });

            it("must not propagate values to all parties when the change occurs on a one-way bound object", function() {
                textItem.boldMode = "false";
                expect(formatBar.boldMode).toBeNull();
                expect(documentController.boldMode).toBeNull();
                expect(textItem.boldMode).toEqual("false");
          });

            it("must not propagate values to all parties when the value on the two-way binding did not change", function() {
                documentController.boldMode = "true";
                expect(formatBar.boldMode).toEqual("true");
                expect(documentController.boldMode).toEqual("true");
                expect(textItem.boldMode).toEqual("true");

          });
        });

    });

    describe("when bound to an array", function() {

        it("should not go out of its way to protect you from mutations to an object on the left making their way over to the right", function() {

            var sourceObject = Alpha.create(),
            boundObject = Omega.create();

            boundObject.bar = ["a", "b", "c"];

            Object.defineBinding(sourceObject, "foo", {
                boundObject: boundObject,
                boundObjectPropertyPath: "bar",
                oneway: true
            });

            // Ideally, this should be avoided; but the way it works is expected
            sourceObject.foo.push("d");

            expect(sourceObject.foo.length).toBe(4);
            expect(sourceObject.foo[0]).toBe("a");
            expect(sourceObject.foo[1]).toBe("b");
            expect(sourceObject.foo[2]).toBe("c");
            expect(sourceObject.foo[3]).toBe("d");

            expect(boundObject.bar.length).toBe(4); // Yep, this is a little unexpected
            expect(boundObject.bar[0]).toBe("a");
            expect(boundObject.bar[1]).toBe("b");
            expect(boundObject.bar[2]).toBe("c");
            expect(boundObject.bar[3]).toBe("d"); //but it makes sense, left and right are the same array
        });

        it("should propagate additions from the bound array to the source propertyPath", function() {

            var sourceObject = Alpha.create(),
            boundObject = Omega.create();

            boundObject.bar = ["a", "b", "c"];

            Object.defineBinding(sourceObject, "foo", {
                boundObject: boundObject,
                boundObjectPropertyPath: "bar"
            });

            boundObject.bar.push("d");

            expect(sourceObject.foo.length).toBe(4);
            expect(sourceObject.foo[0]).toBe("a");
            expect(sourceObject.foo[1]).toBe("b");
            expect(sourceObject.foo[2]).toBe("c");
            expect(sourceObject.foo[3]).toBe("d");
        });

        it("should propagate deletions from the bound array to the source propertyPath", function() {

            var sourceObject = Alpha.create(),
            boundObject = Omega.create();

            boundObject.bar = ["a", "b", "c"];

            Object.defineBinding(sourceObject, "foo", {
                boundObject: boundObject,
                boundObjectPropertyPath: "bar"
            });

            boundObject.bar.pop();

            expect(sourceObject.foo.length).toBe(2);
            expect(sourceObject.foo[0]).toBe("a");
            expect(sourceObject.foo[1]).toBe("b");
        });

        it("should propagate a change from the bound array index contents to the source propertyPath using splice", function() {
            var sourceObject = Alpha.create(),
            boundObject = Omega.create();

            boundObject.bar = ["a", "b", "c"];

            Object.defineBinding(sourceObject, "foo", {
                boundObject: boundObject,
                boundObjectPropertyPath: "bar.0"
            });

            //boundObject.bar[0] = "aa";
            boundObject.bar.splice(0,1,"aa");
            boundObject.setProperty("bar.0", "aa");
            expect(sourceObject.foo).toBe("aa");
        });

        it("should propagate a change from the bound array index contents to the source propertyPath using set", function() {
            var sourceObject = Alpha.create(),
            boundObject = Omega.create();

            boundObject.bar = ["a", "b", "c"];

            Object.defineBinding(sourceObject, "foo", {
                boundObject: boundObject,
                boundObjectPropertyPath: "bar.0"
            });

            boundObject.setProperty("bar.0", "aa");
            expect(sourceObject.foo).toBe("aa");
        });

        it("should propagate a change from the bound array index contents to the source propertyPath using set when the array changes", function() {
            var sourceObject = Alpha.create(),
            boundObject = Omega.create();

            boundObject.bar = ["a", "b", "c"];

            Object.defineBinding(sourceObject, "foo", {
                boundObject: boundObject,
                boundObjectPropertyPath: "bar.0"
            });

            boundObject.setProperty("bar", ["aa", "bb"]);
            expect(sourceObject.foo).toBe("aa");
        });

        it("should propagate changes to other objects bound ", function() {
            var a = Alpha.create(),
            b = Omega.create(),
            c = Alpha.create();

            a.foo = ["a", "b", "c"];

            Object.defineBinding(b, "bar", {
                boundObject: a,
                boundObjectPropertyPath: "foo"
            });

            Object.defineBinding(c , "foo", {
                boundObject: b,
                boundObjectPropertyPath: "bar"
            });

            a.setProperty("foo", ["aa", "bb"]);
            expect(b.bar[0]).toBe("aa");
            expect(c.foo[0]).toBe("aa");
        });

        it ("should affect and emit changes on both sides of a two-way binding", function() {
            var sourceObject = Alpha.create(),
                boundObject = Omega.create();

            var myArray = ["a", "b", "c"];

            boundObject.bar = myArray;

            Object.defineBinding(sourceObject, "foo", {
                boundObject: boundObject,
                boundObjectPropertyPath: "bar"
            });

            var changeListener = {
                sourceObjectListener: function() {
                    expect(sourceObject.foo.length).toBe(4);
                    expect(sourceObject.foo[3]).toBe("d");
                },
                boundObjectListener: function() {
                    expect(boundObject.bar.length).toBe(4);
                    expect(boundObject.bar[3]).toBe("d");
                }
            };

            spyOn(changeListener, "sourceObjectListener").andCallThrough();
            spyOn(changeListener, "boundObjectListener").andCallThrough();

            sourceObject.foo.addPropertyChangeListener(null, changeListener.sourceObjectListener, false);
            boundObject.bar.addPropertyChangeListener(null, changeListener.boundObjectListener, false);

            myArray.push("d");

            expect(changeListener.sourceObjectListener).toHaveBeenCalled();
            expect(changeListener.boundObjectListener).toHaveBeenCalled();
        });

        it("should remove the last element on a pop when that array index content is bound",
        function() {
            var sourceObject = Alpha.create(),
            boundObject = Omega.create();

            boundObject.bar = ["a", "b", "c"];

            Object.defineBinding(sourceObject, "foo", {
                boundObject: boundObject,
                boundObjectPropertyPath: "bar.2"
            });

            boundObject.bar.pop();
            expect(sourceObject.foo).toBeFalsy();
            expect(boundObject.bar.length).toBe(2);
        });

        it("should remove the last element on a pop, multiple times, when that array index content is bound", function() {
            var sourceObject = Alpha.create(),
            boundObject = Omega.create();

            boundObject.bar = ["a", "b", "c"];

            Object.defineBinding(sourceObject, "foo", {
                boundObject: boundObject,
                boundObjectPropertyPath: "bar.2"
            });

            expect(boundObject.bar.pop()).toBe("c");
            expect(boundObject.bar.pop()).toBe("b");
            expect(boundObject.bar.pop()).toBe("a");

            expect(sourceObject.foo).toBeFalsy();
            expect(boundObject.bar.length).toBe(0);
        });

        it("should propagate a change from the bound object when the property path includes an array index and that element is removed", function() {
            var sourceObject = Alpha.create(),
                    boundObject = Omega.create();

            boundObject.bar = [{x: 1}];

            Object.defineBinding(sourceObject, "foo", {
                boundObject: boundObject,
                boundObjectPropertyPath: "bar.0.x"
            });

            boundObject.bar.pop();
            expect(sourceObject.foo).toBeUndefined();
        });

        it("must not allow an outright replacement of the value on the sourceObject to affect the rightObject in a oneway binding", function() {
            var sourceObject = Alpha.create(),
                boundObject = Omega.create(),
                originalObject = ["a", "b", "c"],
                newObjectForSource = ["x", "y", "z"];

            boundObject.bar = originalObject;

            Object.defineBinding(sourceObject, "foo", {
                boundObject: boundObject,
                boundObjectPropertyPath: "bar",
                oneway: true
            });

            sourceObject.foo = newObjectForSource;

            expect(sourceObject.foo).toBe(newObjectForSource);
            expect(boundObject.bar).toBe(originalObject);
        });

        it("should correctly observe a nonexistent index", function() {
            var sourceObject = Alpha.create(),
                boundObject = Omega.create();

            boundObject.bar = [];

            Object.defineBinding(sourceObject, "foo", {
                boundObject: boundObject,
                boundObjectPropertyPath: "bar.1000", //this index does not exist yet
                oneway: true
            });

            boundObject.setProperty("bar.1000", 42);

            expect(sourceObject.foo).toBe(42);
        });

        describe("and the 'count' function as part of the property path", function() {

            it("should propagate a change to the length when pushing onto to the array", function() {

                var sourceObject = Alpha.create(),
                boundObject = Omega.create();

                boundObject.bar = ["a", "b", "c"];

                Object.defineBinding(sourceObject, "foo", {
                    boundObject: boundObject,
                    boundObjectPropertyPath: "bar.count()",
                    oneway: true
                });

                expect(sourceObject.foo).toBe(3);

                boundObject.bar.push("d");

                expect(sourceObject.foo).toBe(4);
            });

            it("should propagate a change to the length when popping from the array", function() {
                var sourceObject = Alpha.create(),
                boundObject = Omega.create();

                boundObject.bar = ["a", "b", "c"];

                Object.defineBinding(sourceObject, "foo", {
                    boundObject: boundObject,
                    boundObjectPropertyPath: "bar.count()",
                    oneway: true
                });

                expect(sourceObject.foo).toBe(3);

                boundObject.bar.pop();

                expect(sourceObject.foo).toBe(2);
            });

            it("should propagate a change to the length when shifting from the array", function() {
                var sourceObject = Alpha.create(),
                boundObject = Omega.create();

                boundObject.bar = ["a", "b", "c"];

                Object.defineBinding(sourceObject, "foo", {
                    boundObject: boundObject,
                    boundObjectPropertyPath: "bar.count()",
                    oneway: true
                });

                expect(sourceObject.foo).toBe(3);

                boundObject.bar.shift();

                expect(sourceObject.foo).toBe(2);
            });

            it("should propagate a change to the length when unshifting to the array", function() {
                var sourceObject = Alpha.create(),
                boundObject = Omega.create();

                boundObject.bar = ["a", "b", "c"];

                Object.defineBinding(sourceObject, "foo", {
                    boundObject: boundObject,
                    boundObjectPropertyPath: "bar.count()",
                    oneway: true
                });

                expect(sourceObject.foo).toBe(3);

                boundObject.bar.unshift("x", "y", "z");

                expect(sourceObject.foo).toBe(6);
            });

            it("should propagate a change to the length when splicing to add to the array", function() {
                var sourceObject = Alpha.create(),
                boundObject = Omega.create();

                boundObject.bar = ["a", "b", "c"];

                Object.defineBinding(sourceObject, "foo", {
                    boundObject: boundObject,
                    boundObjectPropertyPath: "bar.count()",
                    oneway: true
                });

                expect(sourceObject.foo).toBe(3);

                boundObject.bar.splice(0, 0, "d");

                expect(sourceObject.foo).toBe(4);
            });

            it("should propagate a change to the length when splicing to remove from the array", function() {
                var sourceObject = Alpha.create(),
                boundObject = Omega.create();

                boundObject.bar = ["a", "b", "c"];

                Object.defineBinding(sourceObject, "foo", {
                    boundObject: boundObject,
                    boundObjectPropertyPath: "bar.count()",
                    oneway: true
                });

                expect(sourceObject.foo).toBe(3);

                boundObject.bar.splice(0, 2, "d");

                expect(sourceObject.foo).toBe(2);
            });

        });

        describe("using the 'any' function as part of the property path", function() {

            describe("with no propertyPath provided to the 'any' function", function() {

                it("should propagate a change from false to true", function() {
                    var sourceObject = Alpha.create(),
                    boundObject = Omega.create();

                    boundObject.bar = [0, false, null];

                    Object.defineBinding(sourceObject, "foo", {
                        boundObject: boundObject,
                        boundObjectPropertyPath: "bar.any()",
                        oneway: true
                    });

                    boundObject.bar.setProperty("1", true);
                    expect(sourceObject.foo).toBe(true);
                });

                it("should propagate a change from true to false", function() {
                    var sourceObject = Alpha.create(),
                    boundObject = Omega.create();

                    boundObject.bar = [0, false, true];

                    Object.defineBinding(sourceObject, "foo", {
                        boundObject: boundObject,
                        boundObjectPropertyPath: "bar.any()",
                        oneway: true
                    });

                    boundObject.bar.setProperty("2", null);
                    expect(sourceObject.foo).toBe(false);
                });

                it("should propagate the addition of a true value to an otherwise false array", function() {
                    var sourceObject = Alpha.create(),
                    boundObject = Omega.create();

                    boundObject.bar = [0, false, null];

                    Object.defineBinding(sourceObject, "foo", {
                        boundObject: boundObject,
                        boundObjectPropertyPath: "bar.any()",
                        oneway: true
                    });

                    boundObject.bar.push(true);
                    expect(sourceObject.foo).toBe(true);
                });

                it("should propagate the removal of a true value from an otherwise false array", function() {
                    var sourceObject = Alpha.create(),
                    boundObject = Omega.create();

                    boundObject.bar = [0, false, null, true];

                    Object.defineBinding(sourceObject, "foo", {
                        boundObject: boundObject,
                        boundObjectPropertyPath: "bar.any()",
                        oneway: true
                    });

                    boundObject.bar.pop();
                    expect(sourceObject.foo).toBe(false);
                });

            });

            describe("with a propertyPath provided to the 'any' function", function() {

                it("should propagate a change from false to true when a false object is pushed to a path after establishing the binding, and then changed to true", function() {
                    var sourceObject = Alpha.create(),
                    boundObject = Omega.create();

                    var myObj = {a: 0};
                    boundObject.bar = [{a: false}, {a: null}];

                    Object.defineBinding(sourceObject, "foo", {
                        boundObject: boundObject,
                        boundObjectPropertyPath: "bar.any(a)",
                        oneway: true
                    });

                    boundObject.bar.push(myObj);
                    myObj.a = true;
                    expect(sourceObject.foo).toBe(true);
                });

                it("should propagate a change from false to true", function() {
                    var sourceObject = Alpha.create(),
                    boundObject = Omega.create();

                    boundObject.bar = [{a: {b: 0}}, {a: {b: false}}, {a: {b: null}}];

                    Object.defineBinding(sourceObject, "foo", {
                        boundObject: boundObject,
                        boundObjectPropertyPath: "bar.any(a.b)",
                        oneway: true
                    });

                    boundObject.bar.setProperty("1", {a: {b: true}});
                    expect(sourceObject.foo).toBe(true);
                });

                it("should propagate a change from true to false", function() {
                    var sourceObject = Alpha.create(),
                    boundObject = Omega.create();

                    boundObject.bar = [{a: {b: 0}}, {a: {b: false}}, {a: {b: true}}];

                    Object.defineBinding(sourceObject, "foo", {
                        boundObject: boundObject,
                        boundObjectPropertyPath: "bar.any(a.b)",
                        oneway: true
                    });

                    boundObject.bar.setProperty("2", {a: null});
                    expect(sourceObject.foo).toBe(false);
                });

                it("should propagate the addition of a true value to an otherwise false array", function() {
                    var sourceObject = Alpha.create(),
                    boundObject = Omega.create();

                    boundObject.bar = [{a: {b: 0}}, {a: {b: false}}, {a: {b: null}}];

                    Object.defineBinding(sourceObject, "foo", {
                        boundObject: boundObject,
                        boundObjectPropertyPath: "bar.any(a.b)",
                        oneway: true
                    });

                    boundObject.bar.push({a: {b: true}});
                    expect(sourceObject.foo).toBe(true);
                });

                it("should propagate the removal of a true value from an otherwise false array", function() {
                    var sourceObject = Alpha.create(),
                    boundObject = Omega.create();

                    boundObject.bar = [{a: {b: 0}}, {a: {b: false}}, {a: {b: null}}, {a: {b: true}}];

                    Object.defineBinding(sourceObject, "foo", {
                        boundObject: boundObject,
                        boundObjectPropertyPath: "bar.any(a.b)",
                        oneway: true
                    });

                    boundObject.bar.pop();
                    expect(sourceObject.foo).toBe(false);
                });

                it("should propagate a change from false to true when the array is initially null.", function() {
                    var sourceObject = Alpha.create(),
                    boundObject = Omega.create();

                    boundObject.bar = null;

                    Object.defineBinding(sourceObject, "foo", {
                        boundObject: boundObject,
                        boundObjectPropertyPath: "bar.any(a)",
                        oneway: true
                    });

                    expect(sourceObject.foo).toBeFalsy();

                    boundObject.bar = [{a: false}, {a: null}, {a: true}];

                    expect(sourceObject.foo).toBe(true);
                });
            });
        });
    });

    describe("bindings deletion", function() {
        it("should remove a binding on an single level property path", function() {
            var sourceObject = Alpha.create(),
            boundObject = Omega.create();

            Object.defineBinding(sourceObject, "foo", {
                boundObject: boundObject,
                boundObjectPropertyPath: "bar"
            });

            boundObject.bar = 1;
            expect(sourceObject.foo).toBe(1);
            Object.deleteBinding(sourceObject, "foo");

            boundObject.bar = 2;
            expect(sourceObject.foo).toBe(1);
        });

        it("should remove a binding on an multiple level property path", function() {
            var sourceObject = Alpha.create(),
            boundObject = Omega.create();

            Object.defineBinding(sourceObject, "foo", {
                boundObject: boundObject,
                boundObjectPropertyPath: "bar.x"
            });

            boundObject.bar = {x: 1};
            expect(sourceObject.foo).toBe(1);
            Object.deleteBinding(sourceObject, "foo");

            boundObject.bar = {x: 2};
            expect(sourceObject.foo).toBe(1);
        });

        it("should remove a binding on an property path that includes an array index", function() {
            var sourceObject = Alpha.create(),
            boundObject = Omega.create();

            Object.defineBinding(sourceObject, "foo", {
                boundObject: boundObject,
                boundObjectPropertyPath: "bar.0.x"
            });

            boundObject.bar = [{x: 1}];
            expect(sourceObject.foo).toBe(1);
            Object.deleteBinding(sourceObject, "foo");

            boundObject.bar = [{x: 2}];
            expect(sourceObject.foo).toBe(1);
        });

        it("should add a binding that had its boundObjectPropertyPath changed by propertyChangeBindingListener", function() {
            var sourceObject = Alpha.create(),
            boundObject = Omega.create();

            boundObject.propertyChangeBindingListener = function(type, listener, useCapture, atSignIndex, bindingOrigin, bindingPropertyPath, bindingDescriptor) {
                if (bindingDescriptor.boundObjectPropertyPath.match(/firstBarElement/)) {
                    usefulBindingDescriptor = {};
                    var descriptorKeys = Object.keys(bindingDescriptor);
                    var descriptorKeyCount = descriptorKeys.length;
                    var iDescriptorKey;
                    for (var i = 0; i < descriptorKeyCount; i++) {
                        iDescriptorKey = descriptorKeys[i];
                        usefulBindingDescriptor[iDescriptorKey] = bindingDescriptor[iDescriptorKey];
                    }

                    //TODO not as simple as replacing this, there may be more to the path maybe? (needs testing)
                    var modifiedBoundObjectPropertyPath = bindingDescriptor.boundObjectPropertyPath.replace(/firstBarElement/, 'bar.0');
                    usefulBindingDescriptor.boundObjectPropertyPath = modifiedBoundObjectPropertyPath;

                    usefulType = type.replace(/firstBarElement/, 'bar.0');

                    return Object.prototype.propertyChangeBindingListener.call(this, usefulType, listener, useCapture, atSignIndex, bindingOrigin, bindingPropertyPath, usefulBindingDescriptor);
                }
            };

            boundObject.bar = [1];
            Object.defineBinding(sourceObject, "foo", {
                boundObject: boundObject,
                boundObjectPropertyPath: "firstBarElement"
            });
expect(sourceObject._bindingDescriptors.foo.boundObjectPropertyPath).toBe("bar.0");
            expect(sourceObject.foo).toBe(1);
        });

        it("should add a binding that had its bindingObject and boundObjectPropertyPath properties changed by propertyChangeBindingListener", function() {
            var sourceObject = Alpha.create(),
            boundObject = Omega.create(),
            realBoundObject = Omega.create();

            boundObject.propertyChangeBindingListener = function(type, listener, useCapture, atSignIndex, bindingOrigin, bindingPropertyPath, bindingDescriptor) {
                if (bindingDescriptor.boundObjectPropertyPath.match(/firstBarElement/)) {
                    bindingDescriptor.boundObject = realBoundObject;

                    usefulBindingDescriptor = {};
                    var descriptorKeys = Object.keys(bindingDescriptor);
                    var descriptorKeyCount = descriptorKeys.length;
                    var iDescriptorKey;
                    for (var i = 0; i < descriptorKeyCount; i++) {
                        iDescriptorKey = descriptorKeys[i];
                        usefulBindingDescriptor[iDescriptorKey] = bindingDescriptor[iDescriptorKey];
                    }

                    //TODO not as simple as replacing this, there may be more to the path maybe? (needs testing)
                    var modifiedBoundObjectPropertyPath = bindingDescriptor.boundObjectPropertyPath.replace(/firstBarElement/, 'bar.0');
                    usefulBindingDescriptor.boundObjectPropertyPath = modifiedBoundObjectPropertyPath;
                    usefulType = type.replace(/firstBarElement/, 'bar.0');
                    return realBoundObject.propertyChangeBindingListener(usefulType, listener, useCapture, atSignIndex, bindingOrigin, bindingPropertyPath, usefulBindingDescriptor);
                }
            };

            realBoundObject.bar = [1];
            Object.defineBinding(sourceObject, "foo", {
                boundObject: boundObject,
                boundObjectPropertyPath: "firstBarElement"
            });

    expect(sourceObject._bindingDescriptors.foo.boundObjectPropertyPath).toBe("bar.0");
            expect(sourceObject.foo).toBe(1);

            // if correctly installed the change should be propagated
            realBoundObject.bar = [2];
            expect(sourceObject.foo).toBe(2);
        });
    });

    describe("serialization", function() {
        it("should call \"bindings\" deserialization unit", function() {
            var Alpha = Montage.create(Montage, {foo: {value: null}}),
                Omega = Montage.create(Montage, {bar: {value: null}}),
                sourceObject = Alpha.create(),
                boundObject = Omega.create(),
                serializer = Serializer.create().initWithRequire(require),
                deserializer = Deserializer.create();

            Object.defineBinding(sourceObject, "foo", {
                boundObject: boundObject,
                boundObjectPropertyPath: "bar",
                oneway: true
            });

            var serialization = serializer.serializeObject(sourceObject);
            var labels = {};
            labels["root"] = boundObject;
            deserializer.initWithStringAndRequire(serialization, require);
            var object = null;
            spyOn(deserializer._indexedDeserializationUnits, "bindings").andCallThrough();
            deserializer.deserializeWithInstances(labels, function(objects) {
                object = objects.root;
            });
            waitsFor(function() {
                return object;
            });
            runs(function() {
                expect(deserializer._indexedDeserializationUnits.bindings).toHaveBeenCalled();
            })
        });

        it("should serialize a binding to a shorthand format", function() {
            var Alpha = Montage.create(Montage, {foo: {value: null}}),
                Omega = Montage.create(Montage, {bar: {value: null}}),
                sourceObject = Alpha.create(),
                boundObject = Omega.create(),
                serializer = Serializer.create().initWithRequire(require);

            Object.defineBinding(sourceObject, "foo", {
                boundObject: boundObject,
                boundObjectPropertyPath: "bar",
                oneway: true
            });

            var serialization = serializer.serializeObject(sourceObject);
            expect(stripPP(serialization)).toBe('{"root":{"prototype":"montage/core/core[Montage]","properties":{},"bindings":{"foo":{"<-":"@montage.bar"}}},"montage":{}}')
        });

        it("should deserialize a oneway binding", function() {
            var latch, objects,
                deserializer = Deserializer.create();

            deserializer._require = require;
            deserializer.initWithObject({
                root: {
                    prototype: "montage",
                    properties: {
                        value: null
                    },
                    bindings: {
                        value: {"<-": "@source.value"}
                    }
                },

                source: {
                    prototype: "montage",
                    properties: {
                        value: null
                    }
                }
            }).deserialize(function(objs) {
                latch = true;
                objects = objs;
            });

            waitsFor(function() { return latch; });
            runs(function() {
                var root = objects.root,
                    source = objects.source;

                source.value = 15;
                expect(root.value).toBe(15);
                root.value = 16;
                expect(source.value).toBe(15);
            });
        });

        it("should deserialize a twoway binding", function() {
            var latch, objects,
                deserializer = Deserializer.create();

            deserializer._require = require;
            deserializer.initWithObject({
                root: {
                    prototype: "montage",
                    properties: {
                        value: null
                    },
                    bindings: {
                        value: {"<->": "@source.value"}
                    }
                },

                source: {
                    prototype: "montage",
                    properties: {
                        value: null
                    }
                }
            }).deserialize(function(objs) {
                latch = true;
                objects = objs;
            });

            waitsFor(function() { return latch; });
            runs(function() {
                var root = objects.root,
                    source = objects.source;

                source.value = 15;
                expect(root.value).toBe(15);
                root.value = 16;
                expect(source.value).toBe(16);
            });
        });
    });
});
