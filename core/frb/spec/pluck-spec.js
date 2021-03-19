
var Bindings = require("../bindings");

describe("plucking indexes", function () {

    it("a pluck array should reflect values from the input", function () {

        var object = Bindings.defineBindings({
            input: ["a", "b", "c", "d"],
            pluck: null
        }, {
            output: {
                "<-": "pluck.defined() ? pluck.filter{<$input.length}.map{$input[()]} : []"
            }
        });

        expect(object.output).toEqual([])

        object.pluck = [1, 2];
        expect(object.output).toEqual(["b", "c"])

        object.pluck = [1, 2];
        expect(object.output).toEqual(["b", "c"])

        object.pluck.splice(0, object.pluck.length, 1, 2);
        expect(object.output).toEqual(["b", "c"])

        object.pluck.splice(1, 0, 0, 0);
        expect(object.output).toEqual(["b", "a", "a", "c"])

        // out of range
        object.pluck = [10];
        expect(object.output).toEqual([]);
    });

    // There was a bug in this particular sub-case, using filter.
    it("should work", function () {

        var object = Bindings.defineBindings({
            input: ["a", "b", "c", "d"],
            pluck: []
        }, {
            output: {
                "<-": "pluck.filter{<$input.length}"
            }
        });

        expect(object.output).toEqual([]);

        object.pluck = [1, 2];
        expect(object.output).toEqual([1, 2])

        object.pluck = [1, 2];
        expect(object.output).toEqual([1, 2])

        object.pluck.splice(0, object.pluck.length, 1, 2);
        expect(object.output).toEqual([1, 2])

    });

});

