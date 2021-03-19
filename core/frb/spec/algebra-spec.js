
var solve = require("../algebra");

var specs = [

    // !!x <- y
    // x <- y
    {
        input: {
            target: {type: "not", args: [
                {type: "not", args: [
                    {type: "value"}
                ]}
            ]},
            source: {type: "value"}
        },
        output: {
            target: {type: "value"},
            source: {type: "value"}
        }
    },

    // some{x} <- y
    // every{!x} <- !y
    {
        input: {
            target: {type: "someBlock", args: [
                {type: "value"},
                {type: "value"}
            ]},
            source: {type: "value"}
        },
        output: {
            target: {type: "everyBlock", args: [
                {type: "value"},
                {type: "not", args: [
                    {type: "value"}
                ]}
            ]},
            source: {type: "not", args: [
                {type: "value"}
            ]}
        }
    }
]

specs.forEach(function (spec) {
    describe(JSON.stringify(spec.input), function () {
        it("should simplify to " + JSON.stringify(spec.output), function () {
            expect(solve(spec.input.target, spec.input.source)).toEqual([
                spec.output.target,
                spec.output.source
            ]);
        });
    });
});
