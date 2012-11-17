
var parse = require("../parse");
var language = require("./language");

describe("parse", function () {
    language.forEach(function (test) {
        it("should parse " + JSON.stringify(test.path), function () {
            expect(parse(test.path)).toEqual(test.syntax);
        });
    })
});

