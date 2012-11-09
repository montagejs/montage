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

describe("binding/cycle-binding-spec", function() {

    var sourceObject, boundObject, endObject, bindingDescriptor;

    beforeEach(function() {
        sourceObject = Alpha.create();
        boundObject = Omega.create();
        endObject = Omega.create();

        boundObject.bar = endObject;

        bindingDescriptor = {
            boundObject: boundObject,
            boundObjectPropertyPath: "bar.baz"
        };
    });

    describe("a change that originated from the boundObject", function() {

        it("must not infinitely propagate a change back and forth between the boundObject and the sourceObject", function() {
            Object.defineBinding(sourceObject, "foo", bindingDescriptor);
            expect(function() {
                endObject.baz = "someValue";
            }).not.toThrow();
        });

    });

    describe("a change that originated from the sourceObject", function() {

        it("must not infinitely propagate a change back and forth between the boundObject and the sourceObject", function() {
            Object.defineBinding(sourceObject, "foo", bindingDescriptor);
            expect(function() {
                sourceObject.foo = "someValue";
            }).not.toThrow();
        });

        describe("that causes a change that should return to the sourceObject", function() {

            var originalEndObject, someOtherEndObject;

            beforeEach(function() {
                originalEndObject = Omega.create();
                someOtherEndObject = Omega.create();

                someOtherEndObject.baz = "changeReflectedFromBoundObject";

                // This simulates some part of the property path changing due to a change to this value;
                // this occurs sometimes within repetition
                // (e.g. checkbox in repetition affects membership in underlying organizedObjects)
                // In that example we want to make sure that a change from the checkbox is not ignored when
                // presented to the checkbox again (with a different value) just becasue the change originated
                // from the checkbox.
                // TODO this required some changes to the PCL system as well that should be tested at that lower level
                Montage.defineProperty(boundObject, "bar", {
                    dependencies: ["bar.baz"],
                    get: function() {
                        if ("valueChangedAtSource" === this._bar.baz) {
                            this._bar = someOtherEndObject;
                        }
                        return this._bar;
                    },
                    set: function(value) {
                        this._bar = value;
                    }
                });

                boundObject.bar = originalEndObject;

                bindingDescriptor.boundObjectPropertyPath = "bar.baz";
            });

            it("should be propagated back to the sourceObject", function() {
                Object.defineBinding(sourceObject, "foo", bindingDescriptor);

                sourceObject.foo = "valueChangedAtSource";
                expect(sourceObject.foo).toBe("changeReflectedFromBoundObject");
            });

            it("should be propagated to other bindings where this sourceObject ends up serving as the boundObject", function() {

                // Add the tricky binding before our "source" is involved in another binding as the boundObject
                Object.defineBinding(sourceObject, "foo", bindingDescriptor);

                var yetAnotherSourceObject = {};

                Object.defineBinding(yetAnotherSourceObject, "someProperty", {
                    boundObject: sourceObject,
                    boundObjectPropertyPath: "foo",
                    oneway: true
                });

                sourceObject.foo = "valueChangedAtSource";

                expect(yetAnotherSourceObject.someProperty).toBe("changeReflectedFromBoundObject");
            });

            it("should be propagated to other bindings where this sourceObject is already serving as the boundObject", function() {

                var yetAnotherSourceObject = {};

                Object.defineBinding(yetAnotherSourceObject, "someProperty", {
                    boundObject: sourceObject,
                    boundObjectPropertyPath: "foo",
                    oneway: true
                });

                // Add the tricky binding after our "source" is already involved in another binding as the boundObject
                Object.defineBinding(sourceObject, "foo", bindingDescriptor);

                sourceObject.foo = "valueChangedAtSource";

                expect(yetAnotherSourceObject.someProperty).toBe("changeReflectedFromBoundObject");
            });

        });

    });

});
