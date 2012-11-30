

var compute = require("../compute");

Error.stackTraceLimit = 100;

describe("compute", function () {

    it("basic", function () {

        var object = {a: 10, b: 20};
        var cancel = compute(object, "c", {
            args: ["a", "b"],
            compute: function (a, b) {
                return a + b;
            }
        });
        expect(object.c).toEqual(30);
        object.a = 30;
        expect(object.c).toEqual(50);
        cancel();
        object.b = 0;
        expect(object.c).toEqual(50);

    });

    it("moving target", function () {

        var object = {a: 10, b: 20, c: {}};
        var cancel = compute(object, "c.d", {
            args: ["a", "b"],
            compute: function (a, b) {
                return a + b;
            }
        });

        expect(object.c.d).toEqual(30);
        object.a = 30;
        expect(object.c.d).toEqual(50);

        // replace target
        var oldTarget = object.c;
        object.c = {};
        expect(object.c.d).toEqual(50);
        object.a = 0;
        expect(object.c.d).toEqual(20);
        expect(oldTarget.d).toEqual(50);

        // cancel
        cancel();
        object.b = 0;
        expect(object.c.d).toEqual(20);

    });

    it("content changes", function () {
        var object = {values: [1, 2, 3], offset: 0};
        var cancel = compute(object, "sum", {
            args: ["values.*", "offset"],
            compute: function (values, offset) {
                return values.map(function (value) {
                    return value + offset;
                }).sum();
            }
        });

        expect(object.sum).toEqual(6);
        object.values.push(4);
        expect(object.sum).toEqual(10);

        object.offset = 1;
        expect(object.sum).toEqual(14);

        cancel();
        object.offset = 0;
        expect(object.sum).toEqual(14);
    });

});

