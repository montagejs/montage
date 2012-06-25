
require("montage");

describe("core/extras/string", function () {

    // not testing String.isString because it should be deprecated
    // TODO remove this note if isString is removed

    describe("String#equals", function () {

        it("should recognize a string", function () {
            expect("abc".equals("abc")).toBe(true);
        });

        it("should recognize a boxed string", function () {
            expect("abc".equals(new String("abc"))).toBe(true);
        });

        it("should distinguish a number containing the same value", function () {
            expect("0".equals(0)).toBe(false);
        });

    });

    describe("String#contains", function () {

        it("should recognize a substring", function () {
            expect("abc".contains("bc")).toBe(true);
        });

        it("should distinguish a non-existent substring", function () {
            expect("abc".contains("cde")).toBe(false);
        });

    });

    describe("String#toCapitalized", function () {

        it("should capitalize the first and only the first character", function () {
            expect("der herr der ringe".toCapitalized()).toEqual("Der herr der ringe");
        });

    });

    // not much to test with addEventListener that would not be independently
    // verified by generic event listener tests

});

