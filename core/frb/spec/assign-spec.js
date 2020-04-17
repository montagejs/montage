
var assign = require("../assign");
var Map = require("collections/map");

describe("assign", function () {

    it("should assign to a property", function () {
        var object = {a: {b: {c: {}}}};
        assign(object, "a.b.c.d", 10);
        expect(object.a.b.c.d).toBe(10);
        expect(object).toEqual({a: {b: {c: {d: 10}}}});
    });

    it("should be able to assign to a key of a map", function () {
        var object = {map: new Map()};
        assign(object, "map.get($key)", 10, {key: 'key'});
        expect(object.map.get('key')).toBe(10);
    });

    it("should be able to assign to whether a collection has a value", function () {
        var object = {array: []};
        assign(object, "array.has(1)", true);
        expect(object.array).toEqual([1]);
        assign(object, "array.has(1)", false);
        expect(object.array).toEqual([]);
    });

    it("should be able to assign to equality", function () {
        var object = {a: 10};
        assign(object, "a==20", true);
        expect(object.a).toBe(20);
        assign(object, "a==20", false);
        expect(object.a).toBe(20); // still, since the value could be arbitrary
    });

    it("should be able to assign to consequent or alternate of a ternary operator", function () {
        var object = {a: 10, b: 20};
        assign(object, "guard == 'a' ? a : b", 30);
        expect(object).toEqual({a: 10, b: 20});
        object.guard = '';
        assign(object, "guard == 'a' ? a : b", 30);
        expect(object.b).toBe(30);
        object.guard = 'a';
        assign(object, "guard == 'a' ? a : b", 40);
        expect(object.a).toBe(40);
    });

    it("should be able to assign to a logical expression", function () {

        var object = {};
        assign(object, "a && b", true);
        expect(object.a).toBe(true);
        expect(object.b).toBe(true);
        assign(object, "a && b", false);
        expect(object.a).toBe(false);
        expect(object.b).toBe(true);

        var object = {};
        assign(object, "a && b", false);
        expect(object.a).toBe(undefined);
        expect(object.b).toBe(undefined);

        var object = {};
        assign(object, "a || b", false);
        expect(object.a).toBe(false);
        expect(object.b).toBe(false);
        assign(object, "a || b", true);
        expect(object.a).toBe(true);
        expect(object.b).toBe(false);

        var object = {};
        assign(object, "a || b", true);
        expect(object.a).toBe(true);
        expect(object.b).toBe(undefined);

        var object = {};
        assign(object, "a || !b", true);
        expect(object.a).toBe(false);
        expect(object.b).toBe(undefined);

        var object = {b: true};
        assign(object, "a || !b", true);
        expect(object.a).toBe(true);
        expect(object.b).toBe(true);
    });

    it("should be able to assign into the content of a ranged collection", function () {
        var object = {};
        assign(object, "array.rangeContent()", [1, 2, 3]);
        expect(object).toEqual({});
        object.array = [];
        assign(object, "array.rangeContent()", [1, 2, 3]);
        expect(object.array).toEqual([1, 2, 3]);
    });

    /*
        New Spec to experiment how to mutate an array via frb
        add: spec is clear, append at the end
        worth adding if we splice?
    */
    it("should be able to add into the content of a ranged collection", function () {
        var object = {};
        object.array = [0, 1, 2, 3];
        assign(object, "array.rangeAdd()", [4, 5, 6]);
        expect(object.array).toEqual([0, 1, 2, 3, 4, 5, 6]);
    });

    /*
        New Spec to experiment how to mutate an array via frb
        remove: is a bit muddy, no primitive in js to do so, it would mean remove all occurences?
        worth adding?
    */
    it("should be able to remove into the content of a ranged collection", function () {
        var object = {};
        object.array = [0, 1, 2, 3, 4, 5, 6];
        assign(object, "array.rangeRemove()", [4, 5, 6]);
        expect(object.array).toEqual([0, 1, 2, 3]);
    });

    /*
        New Spec to experiment how to mutate an array via frb
        splice method in JS Array:
        let arrDeletedItems = array.splice(start[, deleteCount[, item1[, item2[, ...]]]])
        is the most efficient primitive available as it does deletion and addition in one call.

        when start is 0, and deleteCount is 0, it's basically equivallent to the current rangeContent().
        So, it might be easier to add splice and make rangeContent() work on top of it.
        rangeContent() take as argument the whole scope, so for a splice, the scope needs to contain, start, deleteCount
    */
    it("should be able to splice into the content of a ranged collection", function () {
        var object = {};
        object.array = [0, 1, 2, 3, 4, 5, 6];
        assign(object, "array.rangeSplice()", [2 /*start*/, 3 /*deleteCount*/, 7, 8, 9]);
        expect(object.array).toEqual([0, 1, 2, 3, 6, 7, 8, 9]);
    });


    it("should be able to assign into the content of a mapped array", function () {
        var object = {};
        assign(object, "array.mapContent()", [1, 2, 3]);
        expect(object).toEqual({});
        object.array = [];
        assign(object, "array.mapContent()", [1, 2, 3]);
        expect(object.array).toEqual([1, 2, 3]);
    });

    it("should be able to assign into the content of a map", function () {
        var object = {};
        assign(object, "map.mapContent()", Map.from({a: 10}));
        expect(object).toEqual({});
        object.map = new Map();
        assign(object, "map.mapContent()", Map.from({a: 10, b: 20}));
        expect(object.map.toObject()).toEqual({a: 10, b: 20});
    });

    it("should be able to assign in reverse order", function () {
        var object = {array: []};
        assign(object, "array.reversed()", [1, 2, 3]);
        expect(object.array).toEqual([3, 2, 1]);
    });

    it("should assign to every value in a collection", function () {
        var options = [{}, {}, {}];
        assign(options, "every{checked}", true);
        expect(options.every(function (option) {
            return option.checked;
        })).toBe(true);
        assign(options, "every{checked}", false);
        expect(options.every(function (option) {
            return option.checked; // still
        })).toBe(true);
    });

});
