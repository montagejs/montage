
var parse = require("../parse");
var language = require("./language");

describe("parse", function () {
    language.forEach(function (test) {
        if (test.invalid) {
            it("should not parse " + JSON.stringify(test.path), function () {
                expect(function () {
                    parse(test.path);
                }).toThrow(); // TODO iron out the error messages
            });
        } else {
            it("should parse " + JSON.stringify(test.path), function () {
                expect(parse(test.path, test.options)).toEqual(test.syntax);
            });
        }
    })
});

