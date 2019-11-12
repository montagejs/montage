
var CountedSet = require("montage/core/counted-set").CountedSet;

describe("test/core/counted-set-spec", function () {

    function newSet(values) {
        return new CountedSet(values);
    }

    describe("forEach", function () {
        it("the callback should receive value, index, set", function () {
            var set = new CountedSet([1, 2, 3]);
            var other = new CountedSet([]);
            var i = 0;
            set.forEach(function (value, key, object) {
                expect(key).toBe(++i);
                other.add(value);
                expect(object).toBe(set);
            });
            expect(other.size).toBe(3);
            expect(other.union(set).size).toBe(3);
            expect(other.intersection(set).size).toBe(3);
            expect(other.difference(set).size).toBe(0);
        });
    });

    it("should be initially empty", function () {
        expect(new CountedSet().size).toBe(0);
    });

    it("cleared set should be empty", function () {
        var set = new CountedSet([1, 2]);
        expect(set.size).toBe(2);
        set.delete(1);
        expect(set.size).toBe(1);
        set.clear();
        expect(set.size).toBe(0);
    });

    it("can add and delete an object", function () {
        var set = new CountedSet();
        var object = {};
        set.add(object);
        expect(set.has(object)).toBe(true);
        set.delete(object);
        expect(set.size).toBe(0);
        expect(set.has(object)).toBe(false);
    });

    it("can deleteAll", function () {
        var set = new CountedSet([0]);
        expect(set.deleteAll(0)).toBe(1);
        expect(set.deleteAll(0)).toBe(0);
    });

    it("can add and delete objects from the same bucket", function () {
        var a = {id: 0}, b = {id: 1};
        var set = new CountedSet();
        set.add(a);
        expect(set.has(a)).toBe(true);
        set.add(b);
        expect(set.has(b)).toBe(true);
        set.delete(b);
        expect(set.has(b)).toBe(false);
        expect(set.has(a)).toBe(true);
        set.delete(a);
        expect(set.has(a)).toBe(false);
    });

    it("can read a deleted object", function () {
        var set = new CountedSet();
        var object = {};
        set.add(object);
        expect(set.has(object)).toBe(true);
        set.add(object);
        expect(set.size).toBe(1);
        set.delete(object);
        expect(set.size).toBe(1);
        expect(set.has(object)).toBe(true);
        set.add(object);
        expect(set.size).toBe(1);
        expect(set.has(object)).toBe(true);
        set.delete(object);
        set.delete(object);
        expect(set.size).toBe(0);

    });

    it("can be changed to an array", function () {
        var set = new CountedSet([0]);
        expect(set.toArray()).toEqual([0]);
    });

    it("is a reducible", function () {
        var set = new CountedSet([1, 1, 1, 2, 2, 2, 1, 2]);
        expect(set.size).toBe(2);
        expect(set.min()).toBe(1);
        expect(set.max()).toBe(2);
        expect(set.sum()).toBe(3);
        expect(set.average()).toBe(1.5);
        expect(set.map(function (n) {
            return n + 1;
        }).indexOf(3)).not.toBe(-1);
    });

    it("is concatenatable", function () {
        var array = new CountedSet([3, 2, 1]).concat([4, 5, 6]).toArray();
        array.sort();
        expect(array).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it("should compute unions", function () {
        expect(new CountedSet([1, 2, 3]).union([2, 3, 4]).sorted()).toEqual([1, 2, 3, 4]);
        expect(new CountedSet([1, 2, 3]).union([2, 3, 4]).equals([1, 2, 3, 4])).toBe(true);
    });

    it("should compute intersections", function () {
        expect(new CountedSet([1, 2, 3]).intersection([2, 3, 4]).sorted()).toEqual([2, 3]);
    });

    it("should compute differences", function () {
        expect(new CountedSet([1, 2, 3]).difference([2, 3, 4]).sorted()).toEqual([1]);
    });

    it("should compute symmetric differences", function () {
        expect(new CountedSet([1, 2, 3]).symmetricDifference([2, 3, 4]).sorted()).toEqual([1, 4]);
    });

    it("should dispatch range change on clear", function () {
        var set = new CountedSet([1, 2, 3]);
        var spy = jasmine.createSpy();
        set.addRangeChangeListener(spy);
        set.clear();
        expect(spy).toHaveBeenCalledWith([], [1, 2, 3], 0, set, undefined);
    });

    it("should dispatch range change on add", function () {
        var set = new CountedSet([1, 3]);
        var spy = jasmine.createSpy();
        set.addRangeChangeListener(spy);
        set.add(2);
        expect(set.toArray()).toEqual([1, 3, 2]);
        expect(spy).toHaveBeenCalledWith([2], [], 2, set, undefined);
    });

    it("should dispatch range change on delete", function () {
        var set = new CountedSet([1, 2, 3]);
        var spy = jasmine.createSpy();
        set.addRangeChangeListener(spy);
        set["delete"](2);
        expect(set.toArray()).toEqual([1, 3]);
        expect(spy).toHaveBeenCalledWith([], [2], 1, set, undefined);
    });

    it("should delete objects only after it's been deleted the same amount of tine it was added", function () {
        var set = new CountedSet(),
            a = {};
        set.add(a);
        expect(set.countFor(a)).toEqual(1);
        set.add(a);
        expect(set.countFor(a)).toEqual(2);
        set.delete(a);
        expect(set.countFor(a)).toEqual(1);
        expect(set.has(a)).toEqual(true);
        set.delete(a);
        expect(set.countFor(a)).toEqual(0);
        expect(set.has(a)).toEqual(false);
    });


});
