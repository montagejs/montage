
var Montage = require("montage").Montage;

describe("paths-spec", function () {

    it("should return snapshot of map-change array", function () {

        var object = Montage.create();
        object.array = [{foo: 1}, {foo: 2}, {foo: 3}];

        var foos = object.getPath("array.map{foo}");
        expect(foos).toEqual([1, 2, 3]);

        object.array.push({foo: 3});
        expect(foos).toEqual([1, 2, 3]); // still

    });

    it("should set a property", function () {

        var object = Montage.create();
        Object.addEach(object, {a: {b: {c: {}}}});
        object.setPath("a.b.c.d", 10);
        expect(object.a.b.c.d).toBe(10);

    });

    // These two tests verify the interface for getPath and setPath.
    // The behavior of the underlying evaluate and assign are well-speced in FRB:
    // https://github.com/montagejs/frb/blob/master/spec/assign-spec.js
    // https://github.com/montagejs/frb/blob/master/spec/evaluate-spec.js
    // https://github.com/montagejs/frb/blob/master/spec/evaluate.js

});


