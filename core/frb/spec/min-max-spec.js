
var Bindings = require("../bindings");

Error.stackTraceLimit = 100;

describe("min and max blocks", function () {
    it("should work", function () {

        var a = {x: 3};
        var b = {x: 2};
        var c = {x: 1};
        var d = {x: 0};

        var object = Bindings.defineBindings({}, {
            max: {"<-": "objects.max{x}"},
            min: {"<-": "objects.min{x}"}
        });

        expect(object.max).toBe(void 0);
        expect(object.min).toBe(void 0);

        object.objects = [d, a, c, b];
        expect(object.max.x).toBe(a.x);
        expect(object.min.x).toBe(0);

        object.objects.shift(); // [a, c, b]
        expect(object.max.x).toBe(a.x);
        expect(object.min.x).toBe(1);

        object.objects.shift(); // [c, b]
        expect(object.max.x).toBe(b.x);
        expect(object.min.x).toBe(1);

        object.objects.splice(1, 0, a); // [c, a, b]
        expect(object.max.x).toBe(a.x);
        expect(object.min.x).toBe(1);

        object.objects.clear();
        expect(object.max).toBe(void 0);
        expect(object.min).toBe(void 0);

        object.objects = [d];
        expect(object.max).toBe(d);
        expect(object.min).toBe(d);

        object.objects = null;
        expect(object.max).toBe(void 0);
        expect(object.min).toBe(void 0);

    });
});
