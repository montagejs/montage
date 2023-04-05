
var Bindings = require("../bindings");

describe("filter", function () {

    it("should handle NaN predicates", function () {
        var object = Bindings.defineBinding({}, "filtered", {
            "<-": "array.filter{}"
        });
        expect(object.filtered).toEqual([]);

        object.array = [NaN, true, true, true];
        expect(object.filtered.length).toEqual(3);

        object.array.set(2,  false);
        expect(object.filtered.length).toEqual(2);
    });

    it("should handle >1 numeric predicates", function () {
        var object = Bindings.defineBinding({}, "filtered", {
            "<-": "array.filter{}"
        });
        expect(object.filtered).toEqual([]);

        object.array = [2, 3, 4];
        expect(object.filtered.length).toEqual(3);
        object.array.set(2, 0);
        expect(object.filtered.length).toEqual(2);
    });

    it("should avoid optimizing away a subtle swap with one unchanged value", function () {
        var object = Bindings.defineBinding({}, "filtered", {
            "<-": "array.filter{}"
        });

        object.array = [0, 1, 1, 2, 0];
        expect(object.filtered).toEqual([1, 1, 2]);

        object.array.splice(0, 4, 0, 1, 2, 1, 0);
        expect(object.filtered).toEqual([1, 2, 1]);

    });

});
