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
    Alpha = require("montage/test/binding/support").Alpha,
    Omega = require("montage/test/binding/support").Omega;

describe("binding/deferred-binding-spec", function() {

    var sourceObject, boundObject, bindingDescriptor;

    beforeEach(function() {
        sourceObject = Alpha.create();
        boundObject = Omega.create();

        bindingDescriptor = {
            boundObject: boundObject,
            boundObjectPropertyPath: "bar",
            deferred: true
        };
    });

    describe("in a one-way binding", function() {

        beforeEach(function() {
            bindingDescriptor.oneway = true;
        });

        it("must not immediately propagate the initial value at the bound object to the source object", function() {
            boundObject.bar = "anInitialValue";

            Object.defineBinding(sourceObject, "foo", bindingDescriptor);
            expect(sourceObject.foo).toBeNull();
        });

        it("must not immediately propagate a change at the bound object to the source object", function() {
            Object.defineBinding(sourceObject, "foo", bindingDescriptor);

            boundObject.bar = "someNewValue";
            expect(sourceObject.foo).toBeNull();
        });

        describe("when applying deferredValues", function() {

            it("should populate the source object with the initial value from the bound object", function() {
                boundObject.bar = "anInitialValue";

                Object.defineBinding(sourceObject, "foo", bindingDescriptor);

                Object.applyBindingsDeferredValues(sourceObject);
                expect(sourceObject.foo).toBe("anInitialValue");
            });

            it("should propagate a change at the bound object to the source object", function() {
                var boundObjectWrapper = Omega.create();

                boundObject.bar = "boundObjectInitialValue";
                boundObjectWrapper.bar = boundObject;

                bindingDescriptor.boundObject = boundObjectWrapper;
                bindingDescriptor.boundObjectPropertyPath = "bar.bar";
                Object.defineBinding(sourceObject, "foo", bindingDescriptor);

                boundObject.bar = "someNewBoundObjectValue";
                expect(sourceObject.foo).toBeNull();

                Object.applyBindingsDeferredValues(sourceObject);
                expect(sourceObject.foo).toBe("someNewBoundObjectValue");
            });

            it("should propagate the latest change at the bound object to the source object after several changes", function() {
                var boundObjectBaz,
                boundObjectWrapper = Omega.create();

                boundObject.foo = "initialBoundObjectValue";
                boundObjectWrapper.bar = boundObject;

                bindingDescriptor.boundObject = boundObjectWrapper;
                bindingDescriptor.boundObjectPropertyPath = "bar.foo";
                Object.defineBinding(sourceObject, "foo", bindingDescriptor);

                // changes are being deferred so these will be ignored
                boundObject.foo = "newBoundObjectValue";
                boundObject.foo = "lastBoundObjectValue";
                expect(sourceObject.foo).toBeNull();

                // insert new object midstream...
                boundObjectBaz = Alpha.create()
                boundObjectBaz.foo = "valueFromNewObject";
                boundObjectWrapper.bar = boundObjectBaz;
                expect(sourceObject.foo).toBeNull();

                Object.applyBindingsDeferredValues(sourceObject);
                expect(sourceObject.foo).toBe("valueFromNewObject");
            });

        });

    });

    describe("in a two-way binding", function() {

        it("must not propagate a change at the source object to the bound object", function() {
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

        describe("when applying deferredValues", function() {

            it("should propagate a change at the source object to the bound object", function() {
                Object.defineBinding(sourceObject, "foo", bindingDescriptor);

                sourceObject.foo = "changedSourceObjectValue";

                Object.applyBindingsDeferredValues(sourceObject);
                expect(boundObject.bar).toBe("changedSourceObjectValue");
            });

            it("should propagate a change at the bound object to the source object", function() {
                var boundObjectWrapper = Omega.create();

                boundObject.bar = "boundObjectInitialValue";
                boundObjectWrapper.bar = boundObject;

                bindingDescriptor.boundObject = boundObjectWrapper;
                bindingDescriptor.boundObjectPropertyPath = "bar.bar";
                Object.defineBinding(sourceObject, "foo", bindingDescriptor);

                boundObject.bar = "someNewBoundObjectValue";
                expect(sourceObject.foo).toBeNull();

                Object.applyBindingsDeferredValues(sourceObject);
                expect(sourceObject.foo).toBe("someNewBoundObjectValue");
            });

            it("should propagate the latest change at the bound object to the source object after several changes", function() {
                var boundObjectBaz,
                boundObjectWrapper = Omega.create();

                boundObject.foo = "initialBoundObjectValue";
                boundObjectWrapper.bar = boundObject;

                bindingDescriptor.boundObject = boundObjectWrapper;
                bindingDescriptor.boundObjectPropertyPath = "bar.foo";
                Object.defineBinding(sourceObject, "foo", bindingDescriptor);

                // changes are being deferred so these will be ignored
                boundObject.foo = "newBoundObjectValue";
                boundObject.foo = "lastBoundObjectValue";
                expect(sourceObject.foo).toBeNull();

                // insert new object midstream...
                boundObjectBaz = Alpha.create()
                boundObjectBaz.foo = "valueFromNewObject";
                boundObjectWrapper.bar = boundObjectBaz;
                expect(sourceObject.foo).toBeNull();

                Object.applyBindingsDeferredValues(sourceObject);
                expect(sourceObject.foo).toBe("valueFromNewObject");
            });

        });

    });

    it("should propagate a change from the bound object to the source object along a chain of bindings", function() {
        var anotherSourceObject = Alpha.create();

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
