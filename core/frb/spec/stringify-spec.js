
var stringify = require("../stringify");
var parse = require("../parse");
var language = require("./language");

describe("stringify", function () {
    language.forEach(function (test) {
        if (!test.nonCanon && !test.invalid) {
            it("should stringify " + JSON.stringify(test.syntax), function () {
                expect(stringify(test.syntax)).toEqual(test.path);
            });
            it("stringify should round-trip through parse " + JSON.stringify(test.syntax), function () {
                expect(stringify(parse(test.path, test.options))).toEqual(test.path);
            });
            it("parse should round-trip through stringify " + JSON.stringify(test.syntax), function () {
                expect(parse(stringify(test.syntax), test.options)).toEqual(test.syntax);
            });
        }
    })
});

