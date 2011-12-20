/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;
var Converter = require("montage/core/converter/converter").Converter;


var StrToBoolConverter = Montage.create(Converter, {
    convert: {
        value: function(value) {
            return value === "yes";
        }
    },
    revert: {
        value: function(value) {
            return value ? "yes" : "no";
        }
    }
});

describe("binding/self-binding-spec.js", function() {

    var theObject,
        bindingDescriptor;

    beforeEach(function() {
        theObject = {
            foo: true,
            bar: "yes"
        };

        bindingDescriptor = {
            boundObject: theObject,
            boundObjectPropertyPath: "bar"
        }
    });

    describe("with a oneway binding", function() {

        beforeEach(function() {
            bindingDescriptor.oneway = true;
        });

        it ("should propagate a change at the bound property to the source property", function() {
            Object.defineBinding(theObject, "foo", bindingDescriptor);
            theObject.bar = "new bar value";

            expect(theObject.foo).toBe("new bar value");
            expect(theObject.bar).toBe("new bar value");
        });

        it ("must not propagate a change at the source property to the bound property", function() {
            Object.defineBinding(theObject, "foo", bindingDescriptor);
            theObject.foo = "new foo value";

            expect(theObject.bar).toBe("yes");
            expect(theObject.foo).toBe("new foo value");
        });

        describe("with a converter in place", function() {

            var converter;

            beforeEach(function() {
                converter = StrToBoolConverter;
                bindingDescriptor.converter = converter;
            });

            it ("should propagate a change at the bound property as a 'converted' value to the source property", function() {
                Object.defineBinding(theObject, "foo", bindingDescriptor);
                theObject.bar = "no";

                expect(theObject.foo).toBe(false);
                expect(theObject.bar).toBe("no");
            });


            it ("must not propagate a change at the source property to the bound property", function() {
                Object.defineBinding(theObject, "foo", bindingDescriptor);
                theObject.foo = false;

                expect(theObject.foo).toBe(false);
                expect(theObject.bar).toBe("yes");
            });

            it ("should propagate a change at the source property as a 'reverted' value to the bound property if this change is not the first time the binding is fired", function() {
                Object.defineBinding(theObject, "foo", bindingDescriptor);
                theObject.foo = false;
                theObject.foo = true;

                expect(theObject.foo).toBe(true);
                expect(theObject.bar).toBe("yes");
            });

        });

    });

    describe("with a twoway binding", function() {

        it ("should propagate a change at the bound property to the source property", function() {
            Object.defineBinding(theObject, "foo", bindingDescriptor);
            theObject.bar = "new bar value";

            expect(theObject.foo).toBe("new bar value");
            expect(theObject.bar).toBe("new bar value");
        });

        it ("should propagate a change at the source property to the bound property", function() {
            Object.defineBinding(theObject, "foo", bindingDescriptor);
            theObject.foo = "new foo value";

            expect(theObject.foo).toBe("new foo value");
            expect(theObject.bar).toBe("new foo value");
        });

        describe("with a converter in place", function() {

            var converter;

            beforeEach(function() {
                converter = StrToBoolConverter;
                bindingDescriptor.converter = converter;
            });

            it ("should propagate a change at the bound property as a 'converted' value to the source property the first time such a change occurs", function() {
                Object.defineBinding(theObject, "foo", bindingDescriptor);
                theObject.bar = "no";

                expect(theObject.foo).toBe(false);
                expect(theObject.bar).toBe("no");
            });

            it ("should propagate a change at the bound property as a 'converted' value to the source property if this change is not the first time the binding is fired", function() {
                Object.defineBinding(theObject, "foo", bindingDescriptor);
                theObject.bar = "no";
                theObject.bar = "yes";

                expect(theObject.foo).toBe(true);
                expect(theObject.bar).toBe("yes");
            });

            it ("should propagate a change at the source property as a 'reverted' value to the bound property the first time such a change occurs", function() {
                Object.defineBinding(theObject, "foo", bindingDescriptor);
                theObject.foo = false;

                expect(theObject.foo).toBe(false);
                expect(theObject.bar).toBe("no");
            });

            it ("should propagate a change at the source property as a 'reverted' value to the bound property if this change is not the first time the binding is fired", function() {
                Object.defineBinding(theObject, "foo", bindingDescriptor);

                theObject.foo = false;
                theObject.foo = true;

                expect(theObject.foo).toBe(true);
                expect(theObject.bar).toBe("yes");
            });

        });

    });


});
