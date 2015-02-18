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
var Montage = require("montage").Montage;
var Bindings = require("montage/core/bindings").Bindings;
var Converter = require("montage/core/converter/converter").Converter;


var StrToBoolConverter = Converter.specialize( {
    convert: {
        value: function (value) {
            return value === "yes";
        }
    },
    revert: {
        value: function (value) {
            return value ? "yes" : "no";
        }
    }
});

describe("bindings/self-spec.js", function () {

    var theObject,
        bindingDescriptor;

    beforeEach(function () {
        theObject = {
            foo: true,
            bar: "yes"
        };
    });

    describe("with a oneway binding", function () {

        beforeEach(function () {
            bindingDescriptor = {
                "<-": "bar",
                source: theObject
            };
        });

        it ("should propagate a change at the bound property to the source property", function () {
            Bindings.defineBinding(theObject, "foo", bindingDescriptor);
            theObject.bar = "new bar value";

            expect(theObject.foo).toBe("new bar value");
            expect(theObject.bar).toBe("new bar value");
        });

        it ("must not propagate a change at the source property to the bound property", function () {
            Bindings.defineBinding(theObject, "foo", bindingDescriptor);
            theObject.foo = "new foo value";

            expect(theObject.bar).toBe("yes");
            expect(theObject.foo).toBe("new foo value");
        });

        describe("with a converter in place", function () {

            var converter;

            beforeEach(function () {
                bindingDescriptor = {
                    "<-": "bar",
                    source: theObject,
                    converter: StrToBoolConverter
                };
            });

            it ("should propagate a change at the bound property as a 'converted' value to the source property", function () {
                Bindings.defineBinding(theObject, "foo", bindingDescriptor);
                theObject.bar = "no";

                expect(theObject.foo).toBe(false);
                expect(theObject.bar).toBe("no");
            });


            it ("must not propagate a change at the source property to the bound property", function () {
                Bindings.defineBinding(theObject, "foo", bindingDescriptor);
                theObject.foo = false;

                expect(theObject.foo).toBe(false);
                expect(theObject.bar).toBe("yes");
            });

            it ("should propagate a change at the source property as a 'reverted' value to the bound property if this change is not the first time the binding is fired", function () {
                Bindings.defineBinding(theObject, "foo", bindingDescriptor);
                theObject.foo = false;
                theObject.foo = true;

                expect(theObject.foo).toBe(true);
                expect(theObject.bar).toBe("yes");
            });

        });

    });

    describe("with a twoway binding", function () {

        beforeEach(function () {
            bindingDescriptor = {
                "<->": "bar",
                source: theObject
            };
        });

        it ("should propagate a change at the bound property to the source property", function () {
            Bindings.defineBinding(theObject, "foo", bindingDescriptor);
            theObject.bar = "new bar value";

            expect(theObject.foo).toBe("new bar value");
            expect(theObject.bar).toBe("new bar value");
        });

        it ("should propagate a change at the source property to the bound property", function () {
            Bindings.defineBinding(theObject, "foo", bindingDescriptor);
            theObject.foo = "new foo value";

            expect(theObject.foo).toBe("new foo value");
            expect(theObject.bar).toBe("new foo value");
        });

        describe("with a converter in place", function () {

            var converter;

            beforeEach(function () {
                bindingDescriptor = {
                    "<->": "bar",
                    source: theObject,
                    converter: StrToBoolConverter
                };
            });

            it ("should propagate a change at the bound property as a 'converted' value to the source property the first time such a change occurs", function () {
                Bindings.defineBinding(theObject, "foo", bindingDescriptor);
                theObject.bar = "no";

                expect(theObject.foo).toBe(false);
                expect(theObject.bar).toBe("no");
            });

            it ("should propagate a change at the bound property as a 'converted' value to the source property if this change is not the first time the binding is fired", function () {
                Bindings.defineBinding(theObject, "foo", bindingDescriptor);
                theObject.bar = "no";
                theObject.bar = "yes";

                expect(theObject.foo).toBe(true);
                expect(theObject.bar).toBe("yes");
            });

            it ("should propagate a change at the source property as a 'reverted' value to the bound property the first time such a change occurs", function () {
                Bindings.defineBinding(theObject, "foo", bindingDescriptor);
                theObject.foo = false;

                expect(theObject.foo).toBe(false);
                expect(theObject.bar).toBe("no");
            });

            it ("should propagate a change at the source property as a 'reverted' value to the bound property if this change is not the first time the binding is fired", function () {
                Bindings.defineBinding(theObject, "foo", bindingDescriptor);

                theObject.foo = false;
                theObject.foo = true;

                expect(theObject.foo).toBe(true);
                expect(theObject.bar).toBe("yes");
            });

        });

    });


});
