
var bind = require("../bind");

describe("observe enumeration", function () {

    it("simple pipeline", function () {
        var input = ['a', 'b', 'c'];
        var output = [];
        var cancel = bind(output, "rangeContent()", {
            "<-": "enumerate()",
            source: input
        });
        var a = output[0];
        var b = output[1];
        var c = output[2];
        expect(output).toEqual([
            [0, 'a'],
            [1, 'b'],
            [2, 'c']
        ]);
        input.unshift('z');
        expect(output).toEqual([
            [0, 'z'],
            [1, 'a'],
            [2, 'b'],
            [3, 'c']
        ]);
        expect(a[0]).toEqual(1);
    });

    it("complex pipeline", function () {
        var input = ['b', 'c', 'd', 'e'];
        var output = [];
        var cancel = bind(output, "rangeContent()", {
            "<-": "enumerate().map{!(.0 % 2)}",
            source: input
        });
        expect(output).toEqual([true, false, true, false]);
        input.unshift('a');
        expect(output).toEqual([true, false, true, false, true]);
    });

    it("values at even indexes", function () {
        var input = ['b', 'c', 'd', 'e'];
        var output = [];
        var cancel = bind(output, "rangeContent()", {
            "<-": "enumerate().filter{!(.0 % 2)}.map{.1}",
            source: input
        });
        expect(output).toEqual(['b', 'd']);
        input.unshift('a');
        expect(output).toEqual(['a', 'c', 'e']);
    });

});

