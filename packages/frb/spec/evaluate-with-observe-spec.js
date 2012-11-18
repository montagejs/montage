var parse = require("../parse");
var compile = require("../compile-observer");
var cases = require("./evaluate");

describe("observe", function () {
    cases.forEach(function (test) {
        it(
            "should observe initial value of " + JSON.stringify(test.path) +
            " with " + JSON.stringify(test.input),
            function () {
                var syntax = parse(test.path);
                var observe = compile(syntax);
                var output;
                var cancel = observe(function (initial) {
                    output = initial;
                }, test.input, test.parameters);
                cancel();
                expect(output).toEqual(test.output);
            }
        );
    });
});
