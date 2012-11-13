
var bind = require("../bind");
var SortedSet = require("collections/sorted-set");

Error.stackTraceLimit = 100;

describe("bind", function () {

    describe("<-", function () {
        var source = {foo: {bar: {baz: 10}}};
        var target = {foo: {bar: {baz: undefined}}};

        var cancel = bind(target, "foo.bar.baz", {
            "<-": "foo.bar.baz",
            "source": source
        });

        it("initial", function () {
            expect(source.foo.bar.baz).toEqual(10);
            expect(target.foo.bar.baz).toEqual(10);
        });

    });

    describe("<->", function () {

        var object = {bar: 10};
        object.self = object;

        var cancel = bind(object, "self.foo", {"<->": "self.bar"});

        it("initial", function () {
            expect(object.foo).toBe(10);
            expect(object.bar).toBe(10);
        });

        it("<-", function () {
            object.bar = 20;
            expect(object.foo).toBe(20);
            expect(object.bar).toBe(20);
        });

        it("->", function () {
            object.foo = 30;
            expect(object.foo).toBe(30);
            expect(object.bar).toBe(30);
        });

        it("cancel", function () {
            cancel();
            expect(object.foo).toBe(30);
            expect(object.bar).toBe(30);
        });

        it("unbound after cancel", function () {
            object.foo = 10;
            expect(object.bar).toBe(30);
        });

    });

    describe("sum", function () {
        var object = {values: [1,2,3]};
        var cancel = bind(object, "sum", {"<-": "values.sum{}"});
        expect(object.sum).toBe(6);
        object.values.push(4);
        expect(object.sum).toBe(10);
        cancel();
        object.values.unshift();
        expect(object.sum).toBe(10);
    });

    describe("average", function () {
        var object = {values: [1,2,3]};
        var cancel = bind(object, "average", {"<-": "values.average{}"});
        expect(object.average).toBe(2);
        object.values.push(4);
        expect(object.average).toBe(2.5);
        cancel();
        object.values.unshift();
        expect(object.average).toBe(2.5);
    });

    describe("content", function () {
        var foo = [1, 2, 3];
        var bar = [];
        var object = {foo: foo, bar: bar};
        var cancel = bind(object, "bar.*", {"<->": "foo.*"});
        expect(object.bar.slice()).toEqual([1, 2, 3]);
        foo.push(4);
        bar.push(5);
        expect(object.foo.slice()).toEqual([1, 2, 3, 4, 5]);
        expect(object.bar.slice()).toEqual([1, 2, 3, 4, 5]);
        expect(object.foo).toBe(foo);
        expect(object.bar).toBe(bar);
    });

    describe("reversed", function () {
        var object = {foo: [1,2,3]};
        var cancel = bind(object, "bar", {"<-": "foo.reversed{}"});
        expect(object.bar).toEqual([3, 2, 1]);
        object.foo.push(4);
        expect(object.bar).toEqual([4, 3, 2, 1]);
        object.foo.swap(2, 0, ['a', 'b', 'c']);
        expect(object.bar).toEqual([4, 3, 'c', 'b', 'a', 2, 1]);
        cancel();
        object.foo.splice(2, 3);
        expect(object.bar).toEqual([4, 3, 'c', 'b', 'a', 2, 1]);
    });

    describe("reversed left hand side", function () {
        var object = {foo: [1,2,3]};
        var cancel = bind(object, "bar", {"<->": "foo.reversed()"});
        // object.bar has to be sliced since observable arrays are not
        // equal to plain arrays in jasmine, because of a differing
        // prototype
        expect(object.bar.slice()).toEqual([3, 2, 1]);
        object.foo.push(4);
        expect(object.bar.slice()).toEqual([4, 3, 2, 1]);
        object.foo.swap(2, 0, ['a', 'b', 'c']);
        expect(object.bar.slice()).toEqual([4, 3, 'c', 'b', 'a', 2, 1]);
        object.bar.pop();
        expect(object.bar.slice()).toEqual([4, 3, 'c', 'b', 'a', 2]);
        expect(object.foo.slice()).toEqual([2, 'a', 'b', 'c', 3, 4]);
        cancel();
        object.foo.splice(2, 3);
        expect(object.bar.slice()).toEqual([4, 3, 'c', 'b', 'a', 2]);
    });

    describe("tuple", function () {
        var object = {a: 10, b: 20, c: 30};
        var cancel = bind(object, "d", {"<-": "[a, b, c]"});
        expect(object.d).toEqual([10, 20, 30]);
        cancel();
        object.c = 40;
        expect(object.d).toEqual([10, 20, 30]);
    });

    describe("record", function () {
        var object = {foo: 10, bar: 20};
        var cancel = bind(object, "record", {"<-": "{a: foo, b: bar}"});
        expect(object.record).toEqual({a: 10, b: 20});
        object.foo = 20;
        expect(object.record).toEqual({a: 20, b: 20});
        cancel();
        object.foo = 10;
        expect(object.record).toEqual({a: 20, b: 20});
    });

    describe("record map", function () {
        var object = {arrays: [[1, 2, 3], [4, 5, 6]]};
        var cancel = bind(object, "summaries", {
            "<-": "arrays.map{{length: length, sum: sum()}}"
        });
        expect(object.summaries).toEqual([
            {length: 3, sum: 6},
            {length: 3, sum: 15}
        ]);
        object.arrays.pop();
        expect(object.summaries).toEqual([
            {length: 3, sum: 6}
        ]);
        object.arrays[0].push(4);
        expect(object.summaries).toEqual([
            {length: 4, sum: 10}
        ]);
    });

    describe("literals", function () {
        var object = {};
        var cancel = bind(object, "literals", {"<-": "[0, 'foo bar']"});
        expect(object.literals).toEqual([0, "foo bar"]);
    });

    describe("has", function () {
        var object = {set: [1, 2, 3], sought: 2};
        var cancel = bind(object, "has", {"<-": "set.has(sought)"});

        expect(object.has).toBe(true);
        expect(object.set.slice()).toEqual([1, 2, 3]);

        object.sought = 4;
        expect(object.has).toBe(false);
        expect(object.set.slice()).toEqual([1, 2, 3]);

        object.set.push(4);
        expect(object.has).toBe(true);
        expect(object.set.slice()).toEqual([1, 2, 3, 4]);

        object.set.pop();
        expect(object.has).toBe(false);
        expect(object.set.slice()).toEqual([1, 2, 3]);

        cancel();
        object.set.push(4);
        expect(object.has).toBe(false);
        expect(object.set.slice()).toEqual([1, 2, 3, 4]);
    });

    describe("has <-", function () {
        var object = {set: [1, 2, 3], sought: 2};
        var cancel = bind(object, "set.has(sought)", {"<->": "has"});

        expect(object.set.slice()).toEqual([1, 2, 3]);
        object.has = false;
        expect(object.set.slice()).toEqual([1, 3]);
        object.set.push(2);
        expect(object.has).toEqual(true);
        expect(object.set.slice()).toEqual([1, 3, 2]);

    });

    describe("map", function () {
        var object = {
            foo: [{bar: 10}, {bar: 20}, {bar: 30}]
        };
        var cancel = bind(object, "baz", {
            "<-": "foo.map{bar}"
        });
        expect(object.baz).toEqual([10, 20, 30]);
        object.foo.push({bar: 40});
        expect(object.baz).toEqual([10, 20, 30, 40]);
    });

    describe("map function", function () {
        var object = {
            foo: [
                {bar: 10, baz: 1},
                {bar: 20, baz: 2},
                {bar: 30, baz: 3}
            ]
        };
        var cancel = bind(object, "mapped", {
            "<-": "foo.map(get)"
        });
        expect(object.mapped).toEqual([]);
        object.get = function (object) {
            return object.bar;
        };
        expect(object.mapped).toEqual([10, 20, 30]);
        object.foo.push({bar: 40, baz: 4});
        expect(object.mapped).toEqual([10, 20, 30, 40]);
        object.foo.shift();
        expect(object.mapped).toEqual([20, 30, 40]);
        object.get = function (object) {
            return object.baz;
        };
        expect(object.mapped).toEqual([2, 3, 4]);
    });

    describe("filter", function () {
        var object = {
            foo: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        };
        var cancel = bind(object, "bar", {
            "<-": "foo.filter{!(%2)}"
        });
        expect(object.bar).toEqual([2, 4, 6, 8, 10]);
    });

    describe("flatten", function () {
        var object = {
            foo: [[1], [2, 3], [4]]
        };
        var cancel = bind(object, "baz", {
            "<-": "foo.flatten{}"
        });
        expect(object.baz).toEqual([1, 2, 3, 4]);

        object.foo.push([]);
        expect(object.baz).toEqual([1, 2, 3, 4]);

        object.foo.push([5, 6]);
        expect(object.baz).toEqual([1, 2, 3, 4, 5, 6]);

        object.foo[0].unshift(0);
        expect(object.baz).toEqual([0, 1, 2, 3, 4, 5, 6]);

        expect(object.foo[1].slice()).toEqual([2, 3]);
        object.foo.splice(1, 1);
        expect(object.baz).toEqual([0, 1, 4, 5, 6]);

        cancel();
        object.foo.pop();
        expect(object.baz).toEqual([0, 1, 4, 5, 6]);
    });

    describe("flatten map", function () {
        var object = {
            foo: [{bar: [1]}, {bar: [2, 3]}, {bar: [4]}]
        };
        var cancel = bind(object, "baz", {
            "<-": "foo.flatten{bar}"
        });
        expect(object.baz).toEqual([1, 2, 3, 4]);

        object.foo.push({bar: []});
        expect(object.baz).toEqual([1, 2, 3, 4]);

        object.foo.push({bar: [5, 6]});
        expect(object.baz).toEqual([1, 2, 3, 4, 5, 6]);

        object.foo[0].bar.unshift(0);
        expect(object.baz).toEqual([0, 1, 2, 3, 4, 5, 6]);

        expect(object.foo[1].bar.slice()).toEqual([2, 3]);
        object.foo.splice(1, 1);
        expect(object.baz).toEqual([0, 1, 4, 5, 6]);

        cancel();
        object.foo.pop();
        expect(object.baz).toEqual([0, 1, 4, 5, 6]);
    });

    describe("tree replacement", function () {
        var object = {qux: 10, foo: {bar: {baz: null}}};
        var cancel = bind(object, "foo.bar.baz", {"<->": "qux"});
        expect(object.foo.bar.baz).toEqual(10);
        object.foo = {bar: {baz: null}}; // gets overwritten by binder
        // (source to target precedes target to source) // TODO consider alts
        expect(object.foo.bar.baz).toEqual(10);
        object.qux = 20;
        expect(object.foo.bar.baz).toEqual(20);
        object.foo.bar.baz = 30;
        expect(object.qux).toEqual(30);
    });

    describe("parameters", function () {
        var object = {};
        var parameters = {a: 10, b: 20, c: 30};
        var source = [1, 2, 3];
        var cancel = bind(object, "foo", {
            "<-": "[$a, $b, map{$c}]",
            parameters: parameters,
            source: source
        });
        expect(object.foo).toEqual([10, 20, [30, 30, 30]]);
        parameters.a = 0;
        expect(object.foo).toEqual([0, 20, [30, 30, 30]]);
        source.push(4);
        expect(object.foo).toEqual([0, 20, [30, 30, 30, 30]]);
    });

    describe("equality and addition", function () {
        var object = {a: 2, b: 1, c: 1};
        var cancel = bind(object, "d", {"<->": "a == b + c"});
        expect(object.d).toEqual(true);
        object.a = 3;
        expect(object.d).toEqual(false);
        object.b = 2;
        expect(object.d).toEqual(true);
        object.c = 2;
        expect(object.d).toEqual(false);
        expect(object.a).toEqual(4);
        object.d = true;
        expect(object.a).toEqual(4);
    });

    describe("two-way negation", function () {
        var object = {};

        bind(object, "a", {"<->": "!b"});
        expect(object.a).toBe(undefined);
        object.b = false;
        expect(object.a).toBe(true);
        expect(object.b).toBe(false);

        object.b = true;
        expect(object.a).toBe(false);
        object.b = false;
        expect(object.a).toBe(true);

        object.a = false;
        expect(object.b).toBe(true);
        object.a = true;
        expect(object.b).toBe(false);
    });

    describe("equality and assignment", function () {
        var object = {choice: 2, a: 2, b: 3};
        bind(object, "isA", {"<->": "!isB"});
        bind(object, "choice == a", {"<->": "isA"});
        bind(object, "choice == b", {"<->": "isB"});

        expect(object.choice).toBe(2);

        object.isB = true;
        expect(object.isB).toBe(true);
        expect(object.isA).toBe(false);
        expect(object.choice).toBe(3);

        object.b = 4;
        expect(object.isB).toBe(true);
        expect(object.isA).toBe(false);
        expect(object.choice).toBe(4);

        object.isB = true;
        expect(object.choice).toBe(4);

        object.isA = true;
        expect(object.choice).toBe(2);

        object.isA = false;
        expect(object.isB).toBe(true);
        expect(object.choice).toBe(4);
    });

    describe("gt", function () {
        var object = {a: 1, b: 2};
        bind(object, "gt", {"<-": "a > b"});
        expect(object.gt).toBe(false);
        object.b = 0;
        expect(object.gt).toBe(true);
    });

    describe("algebra", function () {
        var object = {};
        bind(object, "result", {"<-": "2 ** 3 * 3 + 7"});
        expect(object.result).toBe(Math.pow(2, 3) * 3 + 7);
    });

    describe("logic", function () {
        var object = {a: false, b: false};
        bind(object, "result", {"<-": "a || b"});
        expect(object.result).toBe(false);
        object.a = true;
        expect(object.result).toBe(true);
        object.b = true;
        expect(object.result).toBe(true);
        object.a = false;
        object.b = false;
        expect(object.result).toBe(false);
    });

    describe("convert, revert", function () {
        var object = {a: 10};
        var cancel = bind(object, "b", {
            "<->": "a",
            convert: function (a) {
                return a + 1;
            },
            revert: function (b) {
                return b - 1;
            }
        });
        expect(object.b).toEqual(11);
        object.b = 12;
        expect(object.a).toEqual(11);
        cancel();
        object.a = 1000;
        expect(object.b).toEqual(12);
    });

    describe("add <-> sub", function () {
        var object = {a: 10};
        var cancel = bind(object, "b", {
            "<->": "a + 1"
        });
        expect(object.b).toEqual(11);
        object.b = 12;
        expect(object.a).toEqual(11);
        cancel();
        object.a = 1000;
        expect(object.b).toEqual(12);
    });

    describe("pow <-> log", function () {
        var object = {a: 2, b: 3};
        var cancel = bind(object, "c", {
            "<->": "a ** b"
        });
        expect(object.c).toEqual(8);
        object.c = 27;
        expect(object.a).toEqual(3);
        object.b = 2;
        expect(object.c).toEqual(9);
    });

    describe("converter", function () {
        var object = {a: 10};
        var cancel = bind(object, "b", {
            "<->": "a",
            converter: {
                convert: function (a) {
                    return a + 1;
                },
                revert: function (b) {
                    return b - 1;
                }
            }
        });
        expect(object.b).toEqual(11); // 12
        object.b = 12;
        expect(object.a).toEqual(11);
        cancel();
        object.a = 1000;
        expect(object.b).toEqual(12);
    });

    describe("content binding from sorted set", function () {
        var array = ['a', 'c', 'b'];
        var set = SortedSet([4, 5, 1, 3, 45, 1, 8]);
        var cancel = bind(array, "*", {"<-": "", source: set});
        expect(array.slice()).toEqual([1, 3, 4, 5, 8, 45]);
        set.add(2);
        expect(array.slice()).toEqual([1, 2, 3, 4, 5, 8, 45]);
        set.delete(45);
        expect(array.slice()).toEqual([1, 2, 3, 4, 5, 8]);
    });

    describe("view of a array", function () {
        var source = {
            content: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            index: 2,
            length: 3
        };
        var target = [];
        var cancel = bind(target, "*", {
            "<-": "content.view(index, length)",
            source: source
        });
        expect(target.slice()).toEqual([2, 3, 4]);
        source.content.shift();
        expect(target.slice()).toEqual([3, 4, 5]);
        source.length = 2;
        expect(target.slice()).toEqual([3, 4]);
        source.index = 3;
        expect(target.slice()).toEqual([4, 5]);
        source.content.unshift(0);
        expect(target.slice()).toEqual([3, 4]);
    });

    describe("view of a sorted set", function () {
        var array = ['a', 'c', 'b'];
        var set = SortedSet([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        var source = {
            set: set,
            index: 2,
            length: 3
        };
        var cancel = bind(array, "*", {
            "<-": "set.view(index, length)",
            source: source
        });
        expect(array.slice()).toEqual([2, 3, 4]);
        // remove before the view
        set.shift();
        expect(array.slice()).toEqual([3, 4, 5]);
        // change view length
        source.length = 2;
        expect(array.slice()).toEqual([3, 4]);
        // change view index
        source.index = 3;
        expect(array.slice()).toEqual([4, 5]);
        // add before the view
        set.unshift(0);
        expect(array.slice()).toEqual([3, 4]);
        // change view length (again)
        source.length = 4;
        expect(array.slice()).toEqual([3, 4, 5, 6]);
        // remove within
        set.delete(4);
        expect(array.slice()).toEqual([3, 5, 6, 7]);
        // add within
        set.add(4);
        expect(array.slice()).toEqual([3, 4, 5, 6]);
        // add after
        set.add(11);
        expect(array.slice()).toEqual([3, 4, 5, 6]);
        // remove after
        set.delete(7);
        expect(array.slice()).toEqual([3, 4, 5, 6]);
    });

});

