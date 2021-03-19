
var expand = require("../expand");
var parse = require("../parse");
var stringify = require("../stringify");
var compileObserver = require("../compile-observer");
var Scope = require("../scope");

var cases = [

    {
        input: "0",
        with: "@a",
        output: "0"
    },

    {
        input: "[a, 0]",
        with: "(2 + 2)",
        output: "[(2 + 2).a, 0]"
    },

    {
        input: "map{foo}",
        with: "@bar",
        output: "@bar.map{foo}"
    },

    {
        input: "a.b",
        with: "@x",
        output: "@x.a.b"
    },

    {
        input: "* 2",
        with: "3 + 4",
        output: "(3 + 4) * 2"
    },

    {
        input: "*",
        with: "2",
        output: "2 * 2"
    },

    {
        input: "y + z",
        with: "@a",
        output: "@a.y + @a.z"
    },

    {
        input: "?:",
        with: "$0",
        output: "$0 ? $0 : $0"
    },

    {
        input: "startsWith(())",
        with: "@x",
        output: "@x.startsWith(@x)"
    }

];

describe("expand", function () {

    // generic cases
    cases.forEach(function (test) {
        it("should expand " + JSON.stringify(test.input) + " with " + JSON.stringify(test.with), function () {
            var output = stringify(expand(parse(test.input), new Scope(parse(test.with))));
            expect(output).toEqual(test.output);
        });
    });


    it("should expand component labels from a serializer", function () {

        var syntax = parse("@a");
        var a = {};
        var observe = compileObserver(syntax);
        var scope = new Scope();
        scope.components = {
            getObjectByLabel: function (label) {
                expect(label).toBe("a");
                return a;
            }
        };
        var cancel = observe(function (_a) {
            expect(_a).toBe(a);
        }, scope);

        var scope = new Scope();
        scope.components = {
            getObjectLabel: function (_a) {
                expect(_a).toBe(a);
                return "b";
            },
        };
        syntax.component = a;
        var syntax = expand(syntax, scope);
        expect(stringify(syntax)).toBe("@b");

    });

});

