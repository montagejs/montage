
var Bindings = require("../bindings");

describe("", function () {

    it("entries update", function () {
        var object = Bindings.defineBindings({}, {
            output: {"<-": "input.enumerate()"}
        });
        expect(object.output).toEqual([]);

        object.input = ['a', 'b', 'c'];
        expect(object.output).toEqual([
            [0, 'a'],
            [1, 'b'],
            [2, 'c']
        ]);

        object.input.push('d');
        expect(object.output).toEqual([
            [0, 'a'],
            [1, 'b'],
            [2, 'c'],
            [3, 'd']
        ]);
    });

    it("index updates", function () {
        var object = Bindings.defineBindings({}, {
            output: {"<-": "input.enumerate()"}
        });
        expect(object.output).toEqual([]);

        object.input = ['b'];
        var b = object.output[0];
        expect(b).toEqual([0, 'b']);

        object.input.unshift('a');
        expect(object.output[1]).toBe(b);
        expect(b[0]).toBe(1);
    });

    it("annotation", function () {
        var input = [];
        var output = [];
        Bindings.defineBinding(output, "rangeContent()", {
            "<-": "enumerate()",
            source: input
        });
        var cancelers = [];
        output.addRangeChangeListener(function (plus, minus, index) {
            cancelers.swap(index, minus.length, plus.map(function (entry) {
                Bindings.defineBinding(entry, ".1.index", {
                    "<-": ".0"
                });
                return function cancel() {
                    Bindings.cancelBinding(entry, ".1.index");
                };
            })).forEach(function (cancel) {
                cancel && cancel();
            });
        });

        var b = {};
        input.push(b);
        expect(b.index).toBe(0);

        var a = {};
        input.unshift(a);
        expect(a.index).toBe(0);
        expect(b.index).toBe(1);

        input.swap(0, 2, [b, a]);
        expect(b.index).toBe(0);
        expect(a.index).toBe(1);
    });

});

