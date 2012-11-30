
var parse = require("../parse");
var evaluate = require("../evaluate");
var cases = require("./evaluate");

describe("evaluate", function () {
    cases.forEach(function (test) {
        it(
            "should evaluate " + JSON.stringify(test.path) +
            " of " + JSON.stringify(test.input),
            function () {
                var output = evaluate(test.path, test.input, test.parameters);
                expect(output).toEqual(test.output);
            }
        );
    });
});

