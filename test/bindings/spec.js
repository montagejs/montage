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
    Bindings = require("montage/core/bindings").Bindings,
    Serializer = require("montage/core/serialization").Serializer,
    Deserializer = require("montage/core/serialization").Deserializer,
    MontageReviver = require("montage/core/serialization/deserializer/montage-reviver").MontageReviver;

var Alpha = Montage.specialize( {

    _foo: {
        enumerable: false,
        value: null
    },

    foo: {
        enumerable: false,
        set: function (value) {
            this._foo = value;
        },
        get: function () {
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
        get: function () {
            return this._getOnly;
        }
    },

    _setOnly: {
        enumerable: false,
        value: "setOnlyValue"
    },

    setOnly: {
        enumerable: false,
        set: function (value) {
            this._setOnly = value;
        }
    }

});

var Omega = Montage.specialize( {

    _bar: {
        enumerable: false,
        value: null
    },

    bar: {
        enumerable: false,
        set: function (value) {
            this._bar = value;
        },
        get: function () {
            return this._bar;
        }
    }
});

describe("bindings/spec", function () {

    describe("a typical installed binding", function () {

        describe('that is not one way', function () {

            it("must correctly observe a propertyPath where a get/set property follows a value property", function () {
                var target = new Alpha(),
                    source = new Alpha(),
                    intermediateValue = new Omega();

                source.valueOnly = intermediateValue;
                intermediateValue.bar = "original value";

                Bindings.defineBinding(target, "foo", {
                    "<->": "valueOnly.bar",
                    "source": source
                });

                intermediateValue.bar = "hey new value here"

                expect(target.foo).toBe("hey new value here");
                expect(source.valueOnly).toBe(intermediateValue);
                expect(intermediateValue.bar).toBe("hey new value here");
            });

            it("should propagate a change from the source object's source property path to the bound object's bound property path, if the binding is not one way", function () {
                var target = new Alpha(),
                source = new Omega();

                Bindings.defineBinding(target, "foo", {
                    source: source,
                    "<->": "bar"
                });

                target.foo = 42;

                expect(source.bar).toBe(42);

                target.foo = false;

                expect(source.bar).toBeFalsy();

                target.foo = true;

                expect(source.bar).toBeTruthy();


            });

            it("must not give the specified converter a chance to modify the value being passed from the bound object to the source object", function () {
                var target = new Alpha(),
                        source = new Omega();

                Bindings.defineBinding(target, "foo", {
                    source: source,
                    "<->": "bar",
                    convert: function () {
                        return "no!";
                    }
                });

                target.foo = "foo";

                expect(source.bar).toBe("foo");
            });

        });

        it("must not propagate a change from the source object's source property path to the bound object's bound property path", function () {
            var target = new Alpha(),
            source = new Omega();

            Bindings.defineBinding(target, "foo", {
                source: source,
                "<-": "bar"
            });

            target.foo = 42;

            expect(source.bar).toBe(null);

            target.foo = false;
            source.bar = true;

            expect(target.foo).toBeTruthy();
        });

        it("should propagate a change from the bound object's bound property path to the source object's source property path", function () {
            var target = new Alpha(),
            source = new Omega();

            Bindings.defineBinding(target, "foo", {
                source: source,
                "<-": "bar"
            });

            source.bar = "foo";

            expect(target.foo).toBe("foo");
        });

        it("should propagate the original value from the bound object's bound property path to the source object's source property path", function () {
            var target = new Alpha(),
            source = new Omega();

            source.bar = "foo";

            Bindings.defineBinding(target, "foo", {
                source: source,
                "<-": "bar"
            });

            expect(target.foo).toBe("foo");
        });

        it("should properly install a binding on a property that has only a 'get' in its propertyDescriptor, without making the property 'set-able'", function () {
            var target = new Omega(),
                source = new Alpha();

            Bindings.defineBinding(target, "bar", {
                source: source,
                "<-": "getOnly"
            });

            expect(target.bar).toBe("getOnlyValue");

            source.getOnly = "newGetOnlyValue";
            expect(source.getOnly).toBe("getOnlyValue");
            expect(target.bar).toBe("getOnlyValue");
        });

        it("should update a 'get only' property on dispatchOwnPropertyChange", function () {
            var target = new Omega(),
                source = new Alpha();

            target.defineBinding("result", {"<-": "getOnly", source: source});
            expect(target.result).toBe("getOnlyValue");

            source.dispatchBeforeOwnPropertyChange("getOnly", "getOnlyValue");
            source._getOnly = "pass";
            source.dispatchOwnPropertyChange("getOnly", "pass");

            expect(target.result).toBe("pass");
        });

        it("should give the specified converter a chance to modify the value being passed from the source object to the bound object", function () {
            var target = new Alpha(),
                    source = new Omega();

            Bindings.defineBinding(target, "foo", {
                source: source,
                "<-": "bar",
                convert: function () {
                    return "yay";
                }
            });

            source.bar = "foo";

            expect(target.foo).toBe("yay");
        });

        it("should not define a property for a nonexistent property on a bound object", function () {
            // TODO this is what's happening right now, and while it seems a little odd it's basically how you can
            // observe with the expectation that the property may exist later...
            // This makes a lot more sense on arrays than it does on objects, so I'd definitely understand
            // if we flip the desired functionality
            var target = new Alpha(),
                source = new Omega();

            source.bar = 42;

            Bindings.defineBinding(target, "foo", {
                source: source,
                "<-": "foo" // the source has no foo property
            });

            expect(source.hasOwnProperty("foo")).toBeTruthy();
        });

        it("should return undefined when defining a binding along a propertyPath that encounters an undefined property", function () {
            var target = new Alpha(),
                source = new Omega();

            source.bar = 42;

            Bindings.defineBinding(target, "foo", {
                source: source,
                "<-": "foo" // the source has no own foo property
            });

            expect(target.foo).toBe(undefined);
        });

        it("should update a binding to undefined if the path is broken", function () {
            var target = new Alpha(),
                source = new Omega(),
                validObjectInPath = new Omega(),
                deadEndObjectInPath = new Alpha();

            validObjectInPath.bar = "yay!";
            deadEndObjectInPath.foo = "well...this is foo here";

            source.bar = validObjectInPath;

            Bindings.defineBinding(target, "foo", {
                source: source,
                "<-": "bar.bar"
            });

            source.bar = deadEndObjectInPath;

            expect(target.foo).toBe(undefined);
        });

        it("must throw an error when trying to use a property on a target as the source of a binding at a different path of the same source", function () {
            var target = new Alpha(),
                source = new Omega();

            Bindings.defineBinding(target, "foo", {
                source: source,
                "<-": "bar"
            });

            target.foo = 42;

            expect(source.bar).toBe(null);

            source.baz = "baz";
            expect(function () {
                Bindings.defineBinding(target, "foo", {
                    source: source,
                    "<-": "baz"
                })
            }).toThrow("Can't bind to already bound target, \"foo\"");
        });

        it("must throw an error when trying to use a property on a target as the source of a binding to another object", function () {
            var target = new Alpha(),
                source = new Omega(),
                secondBoundObject = new Omega();

            Bindings.defineBinding(target, "foo", {
                source: source,
                "<-": "bar"
            });

            target.foo = 42;

            expect(source.bar).toBe(null);

            expect(function () {
                Bindings.defineBinding(target, "foo", {
                    source: secondBoundObject,
                    "<-": "bar"
                })
            }).toThrow("Can't bind to already bound target, \"foo\"");
        });

        describe("when bound to the same object", function () {

            it("should work as expected", function () {
                var target = new Alpha();

                target.valueOnly = "startValue";

                Bindings.defineBinding(target, "foo", {
                    source: target,
                    "<-": "valueOnly"
                });

                expect(target.foo).toBe("startValue");

                target.valueOnly = "newValue!";
                expect(target.foo).toBe("newValue!");
            });

        });

    });

    describe("two hop binding with boolean", function () {

        var FormatBar,
            DocumentController,
            TextItem,
            formatBar,
            documentController,
            textItem;

        beforeEach(function () {

            FormatBar = Montage.specialize( {boldMode: {value: null}});
            DocumentController = Montage.specialize( {boldMode: {value: null}});
            TextItem = Montage.specialize( {boldMode: {value: null}});
            formatBar = new FormatBar();
            documentController = new DocumentController();
            textItem = new TextItem();

            // [formatBar] <====> [DocumentController] ----> [TextItem]
            Bindings.defineBinding(formatBar, "boldMode", {
                source: documentController,
                "<->": "boldMode"
            });

            Bindings.defineBinding(textItem, "boldMode", {
                source: documentController,
                "<-": "boldMode"
            });
        });

        it("should propagate values to all parties when the change occurs on a two-way bound object", function () {
            formatBar.boldMode = true;
            expect(formatBar.boldMode).toBeTruthy();
            expect(documentController.boldMode).toBeTruthy();
            expect(textItem.boldMode).toBeTruthy();
        });

        it("must not propagate values to all parties when the change occurs on a one-way bound object", function () {
            // NOTE this runs this the risk of putting this object out of sync with all the other objects bound together
            textItem.boldMode = false;

            expect(formatBar.boldMode).toBeNull();
            expect(documentController.boldMode).toBeNull();
            expect(textItem.boldMode).toBeFalsy();
        });

        it("must not propagate values to all parties when the value on the two-way binding did not change", function () {
            documentController.boldMode = true;

            expect(formatBar.boldMode).toBeTruthy();
            expect(documentController.boldMode).toBeTruthy();
            expect(textItem.boldMode).toBeTruthy();

        });
    });

    describe("involving strings", function () {

        it("should probably not bother observing an immutable string for a change at its length property", function () {
            var target = new Alpha(),
                source = "test";

                Bindings.defineBinding(target, "foo", {
                    source: source,
                    "<-": "length"
                });

                expect(target.foo).toBe(4);
        });

        it("should propagate a change to a string found at a property when the string's length is being observed", function () {
            var target = new Alpha(),
                source = new Alpha();

                source.bar = "test";

                Bindings.defineBinding(target, "foo", {
                    source: source,
                    "<-": "bar.length"
                });

                source.bar = "hello world";

                expect(target.foo).toBe(11);
        });

        it("should correctly observe the length property of an object if the object at that property was previously a string", function () {
            var target = new Alpha(),
                source = new Alpha();

                source.bar = "test";

                Bindings.defineBinding(target, "foo", {
                    source: source,
                    "<-": "bar.length"
                });

                source.bar = {length: 12, units: "inches"};

                expect(target.foo).toBe(12);
        });

        describe("two hop binding with string", function () {

            var FormatBar,
                DocumentController,
                TextItem,
                formatBar,
                documentController,
                textItem;

            beforeEach(function () {

                FormatBar = Montage.specialize( {boldMode: {value: null}});
                DocumentController = Montage.specialize( {boldMode: {value: null}});
                TextItem = Montage.specialize( {boldMode: {value: null}});
                formatBar = new FormatBar();
                documentController = new DocumentController();
                textItem = new TextItem();

                // [formatBar] <====> [DocumentController] ----> [TextItem]
                Bindings.defineBinding(formatBar, "boldMode", {
                    source: documentController,
                    "<->": "boldMode"
                });

                Bindings.defineBinding(textItem, "boldMode", {
                    source: documentController,
                    "<-": "boldMode"
                });
            });

            it("should propagate values to all parties when the change occurs on a two-way bound object", function () {
                formatBar.boldMode = "true";
                expect(formatBar.boldMode).toEqual("true");
                expect(documentController.boldMode).toEqual("true");
                expect(textItem.boldMode).toEqual("true");
          });

            it("must not propagate values to all parties when the change occurs on a one-way bound object", function () {
                textItem.boldMode = "false";
                expect(formatBar.boldMode).toBeNull();
                expect(documentController.boldMode).toBeNull();
                expect(textItem.boldMode).toEqual("false");
          });

            it("must not propagate values to all parties when the value on the two-way binding did not change", function () {
                documentController.boldMode = "true";
                expect(formatBar.boldMode).toEqual("true");
                expect(documentController.boldMode).toEqual("true");
                expect(textItem.boldMode).toEqual("true");

          });
        });

    });

    describe("when bound to an array", function () {

        it("should not go out of its way to protect you from mutations to an object on the left making their way over to the right", function () {

            var target = new Alpha(),
            source = new Omega();

            source.bar = ["a", "b", "c"];

            Bindings.defineBinding(target, "foo", {
                source: source,
                "<-": "bar"
            });

            // Ideally, this should be avoided; but the way it works is expected
            target.foo.push("d");

            expect(target.foo.length).toBe(4);
            expect(target.foo[0]).toBe("a");
            expect(target.foo[1]).toBe("b");
            expect(target.foo[2]).toBe("c");
            expect(target.foo[3]).toBe("d");

            expect(source.bar.length).toBe(4); // Yep, this is a little unexpected
            expect(source.bar[0]).toBe("a");
            expect(source.bar[1]).toBe("b");
            expect(source.bar[2]).toBe("c");
            expect(source.bar[3]).toBe("d"); //but it makes sense, left and right are the same array
        });

        it("should propagate additions from the bound array to the source propertyPath", function () {

            var target = new Alpha(),
            source = new Omega();

            source.bar = ["a", "b", "c"];

            Bindings.defineBinding(target, "foo", {
                source: source,
                "<-": "bar"
            });

            source.bar.push("d");

            expect(target.foo.length).toBe(4);
            expect(target.foo[0]).toBe("a");
            expect(target.foo[1]).toBe("b");
            expect(target.foo[2]).toBe("c");
            expect(target.foo[3]).toBe("d");
        });

        it("should propagate deletions from the bound array to the source propertyPath", function () {

            var target = new Alpha(),
            source = new Omega();

            source.bar = ["a", "b", "c"];

            Bindings.defineBinding(target, "foo", {
                source: source,
                "<-": "bar"
            });

            source.bar.pop();

            expect(target.foo.length).toBe(2);
            expect(target.foo[0]).toBe("a");
            expect(target.foo[1]).toBe("b");
        });

        it("should propagate a change from the bound array index contents to the source propertyPath using splice", function () {
            var target = new Alpha(),
            source = new Omega();

            source.bar = ["a", "b", "c"];

            Bindings.defineBinding(target, "foo", {
                source: source,
                "<->": "bar.0"
            });

            //source.bar[0] = "aa";
            source.bar.splice(0,1,"aa");
            source.bar.set(0, "aa");
            expect(target.foo).toBe("aa");
        });

        it("should propagate a change from the bound array index contents to the source propertyPath using set", function () {
            var target = new Alpha(),
            source = new Omega();

            source.bar = ["a", "b", "c"];

            Bindings.defineBinding(target, "foo", {
                source: source,
                "<->": "bar.0"
            });

            source.bar.set(0, "aa");
            expect(target.foo).toBe("aa");
        });

        it("should propagate a change from the bound array index contents to the source propertyPath using set when the array changes", function () {
            var target = new Alpha(),
            source = new Omega();

            source.bar = ["a", "b", "c"];

            Bindings.defineBinding(target, "foo", {
                source: source,
                "<->": "bar.0"
            });

            source.bar = ["aa", "bb"];
            expect(target.foo).toBe("aa");
        });

        it("should propagate changes to other objects bound ", function () {
            var a = new Alpha(),
            b = new Omega(),
            c = new Alpha();

            a.foo = ["a", "b", "c"];

            Bindings.defineBinding(b, "bar", {
                source: a,
                "<->": "foo"
            });

            Bindings.defineBinding(c , "foo", {
                source: b,
                "<->": "bar"
            });

            a.foo = ["aa", "bb"];
            expect(b.bar[0]).toBe("aa");
            expect(c.foo[0]).toBe("aa");
        });

        it ("should affect and emit changes on both sides of a two-way binding", function () {
            var target = new Alpha(),
                source = new Omega();

            var myArray = ["a", "b", "c"];

            source.bar = myArray;

            Bindings.defineBinding(target, "foo", {
                source: source,
                "<->": "bar.rangeContent()"
            });

            var changeListener = {
                targetListener: function () {
                    expect(target.foo.length).toBe(4);
                    expect(target.foo[3]).toBe("d");
                },
                sourceListener: function () {
                    expect(source.bar.length).toBe(4);
                    expect(source.bar[3]).toBe("d");
                }
            };

            spyOn(changeListener, "targetListener").andCallThrough();
            spyOn(changeListener, "sourceListener").andCallThrough();

            target.foo.addRangeChangeListener(changeListener.targetListener, false);
            source.bar.addRangeChangeListener(changeListener.sourceListener, false);

            myArray.push("d");

            expect(changeListener.targetListener).toHaveBeenCalled();
            expect(changeListener.sourceListener).toHaveBeenCalled();
        });

        it("should remove the last element on a pop, multiple times, when that array index content is bound", function () {
            var target = new Alpha(),
            source = new Omega();

            source.bar = ["a", "b", "c"];

            Bindings.defineBinding(target, "foo", {
                source: source,
                "<->": "bar.2"
            });

            expect(source.bar.pop()).toBe("c");
            expect(source.bar.pop()).toBe("b");
            expect(source.bar.pop()).toBe("a");

            expect(target.foo).toBeFalsy();
            expect(source.bar.length).toBe(0);
        });

        it("should propagate a change from the bound object when the property path includes an array index and that element is removed", function () {
            var target = new Alpha(),
                    source = new Omega();

            source.bar = [{x: 1}];

            Bindings.defineBinding(target, "foo", {
                source: source,
                "<->": "bar.0.x"
            });

            source.bar.pop();
            expect(target.foo).toBeUndefined();
        });

        it("must not allow an outright replacement of the value on the target to affect the rightObject in a one wayy binding", function () {
            var target = new Alpha(),
                source = new Omega(),
                originalObject = ["a", "b", "c"],
                newObjectForSource = ["x", "y", "z"];

            source.bar = originalObject;

            Bindings.defineBinding(target, "foo", {
                source: source,
                "<-": "bar"
            });

            target.foo = newObjectForSource;

            expect(target.foo).toBe(newObjectForSource);
            expect(source.bar).toBe(originalObject);
        });

        it("should correctly observe a nonexistent index", function () {
            var target = new Alpha(),
                source = new Omega();

            source.bar = [];

            Bindings.defineBinding(target, "foo", {
                source: source,
                "<-": "bar.1000" //this index does not exist yet
            });

            source.bar.set(1000, 42);

            expect(target.foo).toBe(42);
        });

        describe("and the 'count' function as part of the property path", function () {

            it("should propagate a change to the length when pushing onto to the array", function () {

                var target = new Alpha(),
                source = new Omega();

                source.bar = ["a", "b", "c"];

                Bindings.defineBinding(target, "foo", {
                    source: source,
                    "<-": "bar.length"
                });

                expect(target.foo).toBe(3);

                source.bar.push("d");

                expect(target.foo).toBe(4);
            });

            it("should propagate a change to the length when popping from the array", function () {
                var target = new Alpha(),
                source = new Omega();

                source.bar = ["a", "b", "c"];

                Bindings.defineBinding(target, "foo", {
                    source: source,
                    "<-": "bar.length"
                });

                expect(target.foo).toBe(3);

                source.bar.pop();

                expect(target.foo).toBe(2);
            });

            it("should propagate a change to the length when shifting from the array", function () {
                var target = new Alpha(),
                source = new Omega();

                source.bar = ["a", "b", "c"];

                Bindings.defineBinding(target, "foo", {
                    source: source,
                    "<-": "bar.length"
                });

                expect(target.foo).toBe(3);

                source.bar.shift();

                expect(target.foo).toBe(2);
            });

            it("should propagate a change to the length when unshifting to the array", function () {
                var target = new Alpha(),
                source = new Omega();

                source.bar = ["a", "b", "c"];

                Bindings.defineBinding(target, "foo", {
                    source: source,
                    "<-": "bar.length"
                });

                expect(target.foo).toBe(3);

                source.bar.unshift("x", "y", "z");

                expect(target.foo).toBe(6);
            });

            it("should propagate a change to the length when splicing to add to the array", function () {
                var target = new Alpha(),
                source = new Omega();

                source.bar = ["a", "b", "c"];

                Bindings.defineBinding(target, "foo", {
                    source: source,
                    "<-": "bar.length"
                });

                expect(target.foo).toBe(3);

                source.bar.splice(0, 0, "d");

                expect(target.foo).toBe(4);
            });

            it("should propagate a change to the length when splicing to remove from the array", function () {
                var target = new Alpha(),
                source = new Omega();

                source.bar = ["a", "b", "c"];

                Bindings.defineBinding(target, "foo", {
                    source: source,
                    "<-": "bar.length"
                });

                expect(target.foo).toBe(3);

                source.bar.splice(0, 2, "d");

                expect(target.foo).toBe(2);
            });

        });

        describe("using the 'some' function as part of the property path", function () {

            describe("with no propertyPath provided to the 'some' function", function () {

                it("should propagate a change from false to true", function () {
                    var target = new Alpha(),
                    source = new Omega();

                    source.bar = [0, false, null];

                    Bindings.defineBinding(target, "foo", {
                        source: source,
                        "<-": "bar.some{}"
                    });

                    source.bar.set(1, true);
                    expect(target.foo).toBe(true);
                });

                it("should propagate a change from true to false", function () {
                    var target = new Alpha(),
                    source = new Omega();

                    source.bar = [0, false, true];

                    Bindings.defineBinding(target, "foo", {
                        source: source,
                        "<-": "bar.some{}"
                    });

                    source.bar.set(2, null);
                    expect(target.foo).toBe(false);
                });

                it("should propagate the addition of a true value to an otherwise false array", function () {
                    var target = new Alpha(),
                    source = new Omega();

                    source.bar = [0, false, null];

                    Bindings.defineBinding(target, "foo", {
                        source: source,
                        "<-": "bar.some{}"
                    });

                    source.bar.push(true);
                    expect(target.foo).toBe(true);
                });

                it("should propagate the removal of a true value from an otherwise false array", function () {
                    var target = new Alpha(),
                    source = new Omega();

                    source.bar = [0, false, null, true];

                    Bindings.defineBinding(target, "foo", {
                        source: source,
                        "<-": "bar.some{}"
                    });

                    source.bar.pop();
                    expect(target.foo).toBe(false);
                });

            });

            describe("with a propertyPath provided to the 'some' function", function () {

                it("should propagate a change from false to true when a false object is pushed to a path after establishing the binding, and then changed to true", function () {
                    var target = new Alpha(),
                    source = new Omega();

                    var myObj = {a: 0};
                    source.bar = [{a: false}, {a: null}];

                    Bindings.defineBinding(target, "foo", {
                        source: source,
                        "<-": "bar.some{a}"
                    });

                    source.bar.push(myObj);
                    myObj.a = true;
                    expect(target.foo).toBe(true);
                });

                it("should propagate a change from false to true", function () {
                    var target = new Alpha(),
                    source = new Omega();

                    source.bar = [{a: {b: 0}}, {a: {b: false}}, {a: {b: null}}];

                    Bindings.defineBinding(target, "foo", {
                        source: source,
                        "<-": "bar.some{a.b}"
                    });

                    source.bar.set(1, {a: {b: true}});
                    expect(target.foo).toBe(true);
                });

                it("should propagate a change from true to false", function () {
                    var target = new Alpha(),
                    source = new Omega();

                    source.bar = [{a: {b: 0}}, {a: {b: false}}, {a: {b: true}}];

                    Bindings.defineBinding(target, "foo", {
                        source: source,
                        "<-": "bar.some{a.b}"
                    });

                    source.bar.set(2, {a: null});
                    expect(target.foo).toBe(false);
                });

                it("should propagate the addition of a true value to an otherwise false array", function () {
                    var target = new Alpha(),
                    source = new Omega();

                    source.bar = [{a: {b: 0}}, {a: {b: false}}, {a: {b: null}}];

                    Bindings.defineBinding(target, "foo", {
                        source: source,
                        "<-": "bar.some{a.b}"
                    });

                    source.bar.push({a: {b: true}});
                    expect(target.foo).toBe(true);
                });

                it("should propagate the removal of a true value from an otherwise false array", function () {
                    var target = new Alpha(),
                    source = new Omega();

                    source.bar = [{a: {b: 0}}, {a: {b: false}}, {a: {b: null}}, {a: {b: true}}];

                    Bindings.defineBinding(target, "foo", {
                        source: source,
                        "<-": "bar.some{a.b}"
                    });

                    source.bar.pop();
                    expect(target.foo).toBe(false);
                });

                it("should propagate a change from false to true when the array is initially null.", function () {
                    var target = new Alpha(),
                    source = new Omega();

                    source.bar = null;

                    Bindings.defineBinding(target, "foo", {
                        source: source,
                        "<-": "bar.some{a}"
                    });

                    expect(target.foo).toBeFalsy();

                    source.bar = [{a: false}, {a: null}, {a: true}];

                    expect(target.foo).toBe(true);
                });
            });
        });
    });

    describe("bindings deletion", function () {
        it("should remove a binding on an single level property path", function () {
            var target = new Alpha(),
            source = new Omega();

            Bindings.defineBinding(target, "foo", {
                source: source,
                "<->": "bar"
            });

            source.bar = 1;
            expect(target.foo).toBe(1);
            Object.deleteBinding(target, "foo");

            source.bar = 2;
            expect(target.foo).toBe(1);
        });

        it("should remove a binding on an multiple level property path", function () {
            var target = new Alpha(),
            source = new Omega();

            Bindings.defineBinding(target, "foo", {
                source: source,
                "<->": "bar.x"
            });

            source.bar = {x: 1};
            expect(target.foo).toBe(1);
            Object.deleteBinding(target, "foo");

            source.bar = {x: 2};
            expect(target.foo).toBe(1);
        });

        it("should remove a binding on an property path that includes an array index", function () {
            var target = new Alpha(),
            source = new Omega();

            Bindings.defineBinding(target, "foo", {
                source: source,
                "<->": "bar.0.x"
            });

            source.bar = [{x: 1}];
            expect(target.foo).toBe(1);
            Object.deleteBinding(target, "foo");

            source.bar = [{x: 2}];
            expect(target.foo).toBe(1);
        });
    });

    describe("serialization", function () {
        it("should call \"bindings\" deserialization unit", function () {
            var Alpha = Montage.specialize( {foo: {value: null}}),
                Omega = Montage.specialize( {bar: {value: null}}),
                target = new Alpha(),
                source = new Omega(),
                serializer = new Serializer().initWithRequire(require),
                deserializer = new Deserializer();

            Bindings.defineBinding(target, "foo", {
                source: source,
                "<-": "bar"
            });

            var serialization = serializer.serializeObject(target);
            var labels = {};

            labels["root"] = source;
            labels.montage = {};
            deserializer.init(serialization, require);
            spyOn(MontageReviver._unitRevivers, "bindings").andCallThrough();

            return deserializer.deserialize(labels)
            .then(function (objects) {
                object = objects.root;
                expect(MontageReviver._unitRevivers.bindings).toHaveBeenCalled();
            });
        });

        it("should serialize a binding to a shorthand format", function () {
            var Alpha = Montage.specialize( {foo: {value: null}}),
                Omega = Montage.specialize( {bar: {value: null}}),
                target = new Alpha(),
                source = new Omega(),
                serializer = new Serializer().initWithRequire(require),
                serialization,
                expectedSerialization = {
                    "root": {
                        "prototype": "montage/core/core[Montage]",
                        "properties": {
                            "foo": null,
                            "identifier": null
                        },
                        "bindings": {
                            "foo": {
                                "<-": "@montage.bar"
                            }
                        }
                    },
                    "montage": {}
                };

            Bindings.defineBinding(target, "foo", {
                source: source,
                "<-": "bar"
            });

            serialization = serializer.serializeObject(target);
            expect(JSON.parse(serialization)).toEqual(expectedSerialization);
        });

        it("should deserialize a one way binding", function () {
            var deserializer = new Deserializer(),
                serialization = {
                    "root": {
                        "prototype": "montage",
                        "properties": {
                            "identifier": null,
                            "value": null
                        },
                        "bindings": {
                            "value": {"<-": "@source.value"}
                        }
                    },

                    "source": {
                        "prototype": "montage",
                        "properties": {
                            "identifier": null,
                            "value": null
                        }
                    }
                },
                serializationString = JSON.stringify(serialization);

            deserializer.init(
                serializationString, require);
            return deserializer.deserialize()
            .then(function (objects) {
                var root = objects.root,
                    source = objects.source;

                source.value = 15;
                expect(root.value).toBe(15);
                root.value = 16;
                expect(source.value).toBe(15);
            });
        });

        it("should deserialize a twoway binding", function () {
            var deserializer = new Deserializer(),
                serialization = {
                    "root": {
                        "prototype": "montage",
                        "properties": {
                            "identifier": null,
                            "value": null
                        },
                        "bindings": {
                            "value": {"<->": "@source.value"}
                        }
                    },

                    "source": {
                        "prototype": "montage",
                        "properties": {
                            "identifier": null,
                            "value": null
                        }
                    }
                },
                serializationString = JSON.stringify(serialization);

            deserializer.init(
                serializationString, require);
            return deserializer.deserialize()
            .then(function (objects) {
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
