
var stringify = require("../stringify");
var language = require("./language");

describe("stringify", function () {
    language.forEach(function (test) {
        if (!test.nonCanon) {
            it("should stringify " + JSON.stringify(test.syntax), function () {
                expect(stringify(test.syntax)).toEqual(test.path);
            });
        }
    })
});

