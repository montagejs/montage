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

describe("binding/disabled-binding-spec", function() {

    var sourceObject, boundObject, bindingDescriptor;

        beforeEach(function() {
            sourceObject = Alpha.create();
            boundObject = Omega.create();

            bindingDescriptor = {
                boundObject: boundObject,
                boundObjectPropertyPath: "bar"
            };

            Object.disableBindings(sourceObject);
        });

    it("must not propagate a change from the bound object's bound property path to the source object's source property path if the bindings are disabled", function() {
        boundObject.bar = "foo";

        Object.defineBinding(sourceObject, "foo", bindingDescriptor);
        expect(sourceObject.foo).toBeNull();

        boundObject.bar = "bar";
        expect(sourceObject.foo).toBeNull();
    });

    it("should propagate a change from the bound object's bound property path to the source object's source property path when bindings are enabled", function() {
        Object.defineBinding(sourceObject, "foo", bindingDescriptor);

        boundObject.bar = "bar";

        Object.enableBindings(sourceObject);
        expect(sourceObject.foo).toBe("bar");
    });

    it("must not propagate a change from the bound object's bound property path to the source object's source property path for deferred bindings when bindings are enabled", function() {
        var sourceObject = Alpha.create(),
        boundObject = Omega.create();

        bindingDescriptor.deferred = true;
        Object.defineBinding(sourceObject, "foo", bindingDescriptor);

        boundObject.bar = "bar";

        Object.enableBindings(sourceObject);
        expect(sourceObject.foo).toBeNull();
    });
});
