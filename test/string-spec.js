/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;

describe("string-spec", function() {

    describe("when capitalizing", function() {

        it('should capitalize the the first word', function() {
            expect("foo".toCapitalized()).toBe("Foo");
        });

        it ("should not alter a word that is already properly capitalized", function() {
            expect("Foo".toCapitalized()).toBe("Foo");
        });

        it ('must not capitalize any "words" beyond the first', function() {
            expect("foo bar baz".toCapitalized()).toBe("Foo bar baz");
        });

        it ("must not alter the capitalization of characters beyond the first character of the first word", function() {
            expect("fooBarBaz".toCapitalized()).toBe("FooBarBaz");
        });

    });

    describe("when comparing equality with the equals method", function() {
        it("should be equal to the same string", function() {
            expect("foo".equals("foo")).toBeTruthy();
        });
    });

});
