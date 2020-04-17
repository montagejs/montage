
var parse = require("../parse");
var evaluate = require("../evaluate");
var cases = require("./evaluate");

describe("evaluate", function () {
    cases.forEach(function (test) {
        it(
            "should evaluate " + JSON.stringify(test.path) +
            " of " + JSON.stringify(test.input),
            function () {
                var output = evaluate(
                    test.path,
                    test.input,
                    test.parameters,
                    test.document,
                    test.components
                );
                expect(output).toEqual(test.output);
            }
        );
    });

    it("should allow extensible polymorphic overrides", function () {

        var isBound = evaluate("a.isBound()", {
            a: {
                isBound: function () {
                    return true;
                }
            }
        });
        expect(isBound).toBe(true);
    });

    it("should be resilient to beginning of expression containing 'map' being undefined", function () {
        var result = evaluate("a.images.edges.map{node}", {
            a: {}
        });
        expect(result).toBe(undefined);
    });

    it("should be resilient to beginning of expression containing 'filter' being undefined", function () {
        var result = evaluate("a.images.edges.filter{node}", {
            a: {}
        });
        expect(result).toBe(undefined);
    });

    it("should be resilient to beginning of expression containing 'some' being undefined", function () {
        var result = evaluate("a.images.edges.some{node}", {
            a: {}
        });
        expect(result).toBe(undefined);
    });

    it("should be resilient to beginning of expression containing 'every' being undefined", function () {
        var result = evaluate("a.images.edges.every{node}", {
            a: {}
        });
        expect(result).toBe(undefined);
    });

    it("should be resilient to beginning of expression containing 'sorted' being undefined", function () {
        var result = evaluate("a.images.edges.sorted{node}", {
            a: {}
        });
        expect(result).toBe(undefined);
    });

    it("should be resilient to beginning of expression containing 'group' being undefined", function () {
        var result = evaluate("a.images.edges.group{node}", {
            a: {}
        });
        expect(result).toBe(undefined);
    });

    it("should be resilient to beginning of expression containing 'min' being undefined", function () {
        var result = evaluate("a.images.edges.min{node}", {
            a: {}
        });
        expect(result).toBe(undefined);
    });

    it("should be resilient to beginning of expression containing 'max' being undefined", function () {
        var result = evaluate("a.images.edges.max{node}", {
            a: {}
        });
        expect(result).toBe(undefined);
    });


});

