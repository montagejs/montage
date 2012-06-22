/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Converter = require("montage/core/converter/converter").Converter;

var TestConverter = Montage.create(Converter, {

    convert: {
        value: function(value) {
            return "CONVERT" + value;
        }
    },

    revert: {
        value: function(value) {
            return value.replace("CONVERT", "");
        }
    }

});

describe("binding/binding-converter-spec", function() {

    var sourceObject, boundObject, bindingDescriptor;

    beforeEach(function() {
        sourceObject = Montage.create();
        boundObject = Montage.create();

        bindingDescriptor = {
            boundObject: boundObject,
            boundObjectPropertyPath: "bar",
            converter: TestConverter
        };
    })

    describe("involved in a two way binding", function() {

        it("should convert the value passed to the source when the binding is established", function() {
            boundObject.bar = "bar";

            Object.defineBinding(sourceObject, "foo", bindingDescriptor);

            expect(sourceObject.foo).toBe("CONVERTbar")
        });

        it("should convert the value passed to the source when the bound object's value changes", function() {
            boundObject.bar = "bar";

            Object.defineBinding(sourceObject, "foo", bindingDescriptor);

            boundObject.bar = "baz";

            expect(sourceObject.foo).toBe("CONVERTbaz")
        });


        it("should revert the value passed to the bound object when the source object's value changes", function() {
            boundObject.bar = "bar";

            Object.defineBinding(sourceObject, "foo", bindingDescriptor);

            sourceObject.foo = "CONVERTbaz";

            expect(boundObject.bar).toBe("baz")
        });

    });

    describe("involved in a one way binding", function() {

        beforeEach(function() {
            bindingDescriptor.oneway = true;
        });

        it("should convert the value passed to the source when the binding is established", function() {
            boundObject.bar = "bar";

            Object.defineBinding(sourceObject, "foo", bindingDescriptor);

            expect(sourceObject.foo).toBe("CONVERTbar")
        });

        it("should convert the value passed to the source when the bound object's value changes", function() {
            boundObject.bar = "bar";

            Object.defineBinding(sourceObject, "foo", bindingDescriptor);

            boundObject.bar = "baz";

            expect(sourceObject.foo).toBe("CONVERTbaz")
        });

        it("must not enable propagating a value from the source object to the bound object", function() {
            boundObject.bar = "bar";

            Object.defineBinding(sourceObject, "foo", bindingDescriptor);

            sourceObject.foo = "CONVERTbaz";

            expect(boundObject.bar).toBe("bar")
        });

    });

});
