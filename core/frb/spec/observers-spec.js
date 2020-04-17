
require("collections/shim");
var Map = require("collections/map");
var Observers = require("../observers");
var Operators = require("../operators");
var Scope = require("../scope");
var Signal = require("../signal");

// This observer is not used by the language, but is useful for testing
function makeRelationObserver(relation, thisp) {
    return function observeRelation(emit, scope) {
        return emit(relation.call(thisp, scope.value)) || Function.noop;
    };
}

describe("makeLiteralObserver", function () {
    // TODO
});

describe("observeValue", function () {
    // TODO
});

describe("observeParent", function () {
    // TODO
});

describe("makeElementObserver", function () {
    // TODO
});

describe("makeComponentObserver", function () {
    // TODO
});

describe("makeConverterObserver", function () {
    // TODO
});

describe("makeComputerObserver", function () {
    // TODO
});

describe("observeProperty", function () {
    it("should work", function () {
        var object = {};
        var spy = jasmine.createSpy();
        var cancel = Observers.observeProperty(object, "a", spy, new Scope());
        expect(spy).toHaveBeenCalledWith(undefined, "a", object);
        object.a = 10;
        expect(spy).toHaveBeenCalledWith(10, "a", object);
        cancel();
        object.a = 20;
    });

    it("should be cancelable", function () {
        var object = {};
        var spy = jasmine.createSpy();
        var cancel = Observers.observeProperty(object, "a", spy, new Scope());
        object.a = 10;
        cancel();
        object.b = 20;
        expect(spy.argsForCall).toEqual([
            [undefined, "a", object],
            [10, "a", object]
        ]);
    });

    // Note that we cannot observe property deletion because that is a
    // configuration change, not intercepted by "set" on a property descriptor.

});

describe("makePropertyObserver", function () {

    it("should react to property changes", function () {

        var object = {foo: 10};

        var cancel = Observers.makePropertyObserver(
            Observers.makeLiteralObserver(object),
            Observers.makeLiteralObserver("foo")
        )(function (value) {
            object.bar = value;
        }, new Scope());

        object.foo = 20;
        expect(object.bar).toBe(20);

        cancel();
        object.foo = 30;
        expect(object.bar).toBe(20);

    });

    it("should react to property changes", function () {

        var object = {};
        var observeObject = Observers.observeValue;
        var observeKey = Observers.makeLiteralObserver("foo");
        var observeValue = Observers.makePropertyObserver(observeObject, observeKey);
        var spy = jasmine.createSpy();
        var cancel = observeValue(spy, new Scope(object));

        expect(spy).toHaveBeenCalledWith(undefined, "foo", object);
        object.foo = 10;

        cancel();
        object.foo = 20;
        expect(spy).toHaveBeenCalledWith(10, "foo", object);
        expect(spy.callCount).toBe(2);

    });

});

describe("observeGet", function () {

    it("should work", function () {
        var map = new Map();
        var spy = jasmine.createSpy();
        var cancel = Observers.observeGet(map, "a", spy, new Scope());
        expect(spy).toHaveBeenCalledWith(undefined, "a", map);
        map.set("a", 10);
        expect(spy).toHaveBeenCalledWith(10, "a", map);
        cancel();
        map.set("a", 20);
    });

    it("should be cancelable", function () {
        var map = new Map();
        var spy = jasmine.createSpy();
        var cancel = Observers.observeGet(map, "a", spy, new Scope());
        map.set("a", 10);
        cancel();
        map.set("b", 20);
        expect(spy.argsForCall).toEqual([
            [undefined, "a", map],
            [10, "a", map]
        ]);
    });

    it("should observe deletion", function () {
        var map = Map.from({a: 10});
        var spy = jasmine.createSpy();
        var cancel = Observers.observeGet(map, "a", spy, new Scope());
        map.delete("a");
        cancel();
        map.set("a", 20);
        expect(spy.argsForCall).toEqual([
            [10, "a", map],
            [undefined, "a", map]
        ]);
    });

});

describe("makeGetObserver", function () {
    // TODO
});

describe("makeHasObserver", function () {
    // TODO
});

// Compound Literals

describe("makeArrayObserver", function () {

    it("should react to changes to each value", function () {

        var array;
        var object = {a: 1, b: 2, c: 3};

        var cancel = Observers.makeArrayObserver(
            Observers.makePropertyObserver(
                Observers.makeLiteralObserver(object),
                Observers.makeLiteralObserver('a')
            ),
            Observers.makePropertyObserver(
                Observers.makeLiteralObserver(object),
                Observers.makeLiteralObserver('b')
            ),
            Observers.makePropertyObserver(
                Observers.makeLiteralObserver(object),
                Observers.makeLiteralObserver('c')
            )
        )(function (_array) {
            array = _array;
        }, new Scope());

        expect(array).toEqual([1, 2, 3]);
        object.a = 0;
        expect(array).toEqual([0, 2, 3]);
        cancel();
        object.a = 1;
        expect(array).toEqual([0, 2, 3]);

    });

});

// TODO makeObjectObserver

// Operators

describe("makeNotObserver", function () {

    it("should work", function () {
        var valueSignal = new Signal(false);
        var makeNotObserver = Observers.makeOperatorObserverMaker(Operators.not);
        var observeNot = makeNotObserver(valueSignal.observe);
        var spy = jasmine.createSpy();
        var cancel = observeNot(spy, new Scope());
        expect(spy).toHaveBeenCalledWith(true);
        valueSignal.emit(true);
        expect(spy).toHaveBeenCalledWith(false);
        cancel();
        valueSignal.emit(false);
        expect(spy.callCount).toBe(2);
    });

});

describe("makeDefinedObserver", function () {

    it("should work", function () {
        var valueSignal = new Signal();
        var observeDefined = Observers.makeDefinedObserver(valueSignal.observe);
        var spy = jasmine.createSpy();
        var cancel = observeDefined(spy, new Scope());
        expect(spy).toHaveBeenCalledWith(false);
        valueSignal.emit(1);
        cancel();
    });

});

describe("makeDefinedObserver", function () {
    // TODO
});

describe("makeDefaultObserver", function () {
    // TODO
});

// Comprehensions

describe("makeMapBlockObserver", function () {

    it("should project range content changes", function () {

        var spy = jasmine.createSpy();

        var array = [1,2,3];

        var cancel = Observers.makeMapBlockObserver(
            Observers.makeLiteralObserver(array),
            makeRelationObserver(function (n) {
                return n * 2;
            })
        )(function (mapped) {
            function rangeChange(plus, minus, index) {
                spy(index, minus.slice(), plus.slice());
            }
            rangeChange(mapped, [], 0);
            mapped.addRangeChangeListener(rangeChange);
        }, new Scope());

        array.push(4);
        array.set(0, 0);
        cancel();
        array.push(5);

        expect(spy.argsForCall).toEqual([
            [0, [], [2, 4, 6]],
            [3, [], [8]],
            [0, [2], [0]]
        ]);

    });

    it("should project replacement of the source", function () {

        var spy = jasmine.createSpy();

        var object = {array: [1,2,3]};

        var cancel = Observers.makeMapBlockObserver(
            Observers.makePropertyObserver(
                Observers.makeLiteralObserver(object),
                Observers.makeLiteralObserver('array')
            ),
            makeRelationObserver(function (n) {
                return n * 2;
            })
        )(function (mapped) {
            function rangeChange(plus, minus, index) {
                spy(index, minus.slice(), plus.slice());
            }
            rangeChange(mapped, [], 0);
            mapped.addRangeChangeListener(rangeChange);
        }, new Scope());

        object.array.push(4);
        object.array = [];
        object.array.push(1, 2, 3);
        var array = object.array;

        cancel();
        array.push('a');
        object.array = 10;

        expect(spy.argsForCall).toEqual([
            [0, [], [2, 4, 6]],
            [3, [], [8]],
            [0, [2, 4, 6, 8], []],
            [0, [], [2, 4, 6]]
        ]);

    });

    it("should grant access to the parent scope", function () {
        var input = {values: [1, 2, 3], factor: 2};
        // values.map{this * ^factor}
        var observeValues = Observers.makeMapBlockObserver(
            Observers.makePropertyObserver(
                Observers.observeValue,
                Observers.makeLiteralObserver("values")
            ),
            Observers.makeOperatorObserverMaker(Operators.mul)(
                Observers.observeValue,
                Observers.makeParentObserver(
                    Observers.makePropertyObserver(
                        Observers.observeValue,
                        Observers.makeLiteralObserver("factor")
                    )
                )
            )
        );
        var spy = jasmine.createSpy();
        var cancel = observeValues(spy, new Scope(input));
        expect(spy).toHaveBeenCalledWith([2, 4, 6]);
    });

});

describe("makeFilterBlockObserver", function () {

    it("should work", function () {
        var input = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        var output;
        var cancel = Observers.makeRangeContentObserver(Observers.makeFilterBlockObserver(
            Observers.makeLiteralObserver(input),
            makeRelationObserver(function (value) {
                return !(value & 1);
            })
        ))(function (_output) {
            output = _output.slice();
        }, new Scope());

        expect(output).toEqual([2, 4, 6, 8]);

        input.push(10, 11, 12);
        expect(output).toEqual([2, 4, 6, 8, 10, 12]);

        input.splice(2, 4);
        expect(output).toEqual([2, 8, 10, 12]);

        input.shift();
        expect(output).toEqual([2, 8, 10, 12]);

        input.shift();
        expect(output).toEqual([8, 10, 12]);

        input.push(13, 13, 13, 13, 13, 13);
        expect(output).toEqual([8, 10, 12]);

        input.push(14);
        expect(output).toEqual([8, 10, 12, 14]);

    });

});

describe("makeSortedBlockObserver", function () {

    it("should work", function () {

        var input = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        var output;
        var cancel = Observers.makeRangeContentObserver(Observers.makeSortedBlockObserver(
            Observers.makeLiteralObserver(input),
            makeRelationObserver(function (value) {
                return -value;
            })
        ))(function (_output) {
            output = _output.slice();
        }, new Scope());

        expect(output).toEqual([9, 8, 7, 6, 5, 4, 3, 2, 1]);

        input.shift();
        expect(output).toEqual([9, 8, 7, 6, 5, 4, 3, 2]);

        input.reverse();
        expect(output).toEqual([9, 8, 7, 6, 5, 4, 3, 2]);

        input.sort();
        expect(output).toEqual([9, 8, 7, 6, 5, 4, 3, 2]);

        input.pop();
        expect(output).toEqual([8, 7, 6, 5, 4, 3, 2]);

        input.push(4.5);
        expect(output).toEqual([8, 7, 6, 5, 4.5, 4, 3, 2]);

        cancel();

        input.clear();
        expect(output).toEqual([8, 7, 6, 5, 4.5, 4, 3, 2]);

    });
});

// TODO makeSomeBlockObserver
// TODO makeEveryBlockObserver
// TODO makeMinBlockObserver
// TODO makeMaxBlockObserver
// TODO makeSortedSetBlockObserver

describe("makeReversedObserver", function () {

    it("should reverse", function () {

        var spy = jasmine.createSpy();

        var array = [1,2,3];

        var cancel = Observers.makeReversedObserver(
            Observers.makeLiteralObserver(array)
        )(function (reversed) {
            function rangeChange(plus, minus, index) {
                spy(index, minus.slice(), plus.slice());
            }
            rangeChange(reversed, [], 0);
            reversed.addRangeChangeListener(rangeChange);
        }, new Scope());

        array.push(4);
        array.set(0, 0);
        cancel();
        array.push(5);

        expect(spy.argsForCall).toEqual([
            [0, [], [3, 2, 1]],
            [0, [], [4]],
            [3, [1], [0]]
        ]);

    });
});

describe("makeFlattenObserver", function () {

    it("should work", function () {

        var input = [[1, 2, 3], [7, 8, 9]];
        var output;
        var calls = 0;

        var cancel = Observers.makeFlattenObserver(Observers.makeLiteralObserver(input))
        (function (_output) {
            output = _output;
            calls++;
        }, new Scope());

        input.swap(1, 0, [[4, 5, 6]]);
        //expect(input).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9]]);
        expect(output).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);

        input[1].splice(1, 1);
        //expect(input).toEqual([[1, 2, 3], [4, 6], [7, 8, 9]]);
        expect(output).toEqual([1, 2, 3, 4, 6, 7, 8, 9]);

        input.splice(1, 1);
        //expect(input).toEqual([[1, 2, 3], [7, 8, 9]]);
        expect(output).toEqual([1, 2, 3, 7, 8, 9]);

        input.push([10]);
        //expect(input).toEqual([[1, 2, 3], [7, 8, 9], [10]]);
        expect(output).toEqual([1, 2, 3, 7, 8, 9, 10]);

        input.shift();
        //expect(input).toEqual([[7, 8, 9], [10]]);
        expect(output).toEqual([7, 8, 9, 10]);

        input.unshift([1, 2, 3]);
        //expect(input).toEqual([[1, 2, 3], [7, 8, 9], [10]]);
        expect(output).toEqual([1, 2, 3, 7, 8, 9, 10]);

        input[0].push(4, 5, 6);
        //expect(input).toEqual([[1, 2, 3, 4, 5, 6], [7, 8, 9], [10]]);
        expect(output).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

        cancel();
        input.push([11]);
        input[0].unshift(0);
        //expect(input).toEqual([[0, 1, 2, 3, 4, 5, 6], [7, 8, 9], [10], [11]]);
        expect(output).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

        expect(calls).toBe(1);

    });

    it("should work when the source is replaced", function () {

        var array = [[1, 2, 3], [7, 8, 9]];
        var object = {array: array};
        var output;

        var cancel = Observers.makeFlattenObserver(
            Observers.makePropertyObserver(
                Observers.makeLiteralObserver(object),
                Observers.makeLiteralObserver('array')
            )
        )(function (_output) {
            output = _output;
        }, new Scope());

        expect(output).toEqual([1, 2, 3, 7, 8, 9]);

        array.splice(1, 0, [4, 5, 6]);
        expect(output).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);

        array[1].splice(1, 1);
        expect(output).toEqual([1, 2, 3, 4, 6, 7, 8, 9]);

        object.array = [];
        expect(output).toEqual([]);

        object.array.push([1, 2, 3]);
        expect(output).toEqual([1, 2, 3]);

        cancel();

        array.push([10]);
        object.array = [['a', 'b', 'c']];
        expect(output).toEqual([1, 2, 3]);

    });

});

describe("makeSumObserver", function () {
    it("should react to array changes and replacements", function () {

        var sum;
        var object = {array: [1,2,3]};

        var cancel = Observers.makeSumObserver(
            Observers.makePropertyObserver(
                Observers.makeLiteralObserver(object),
                Observers.makeLiteralObserver('array')
            )
        )(function (_sum) {
            sum = _sum;
        }, new Scope());

        expect(sum).toBe(6);

        object.array.push(4);
        expect(sum).toBe(10);

        object.array = [];
        expect(sum).toBe(0);

        object.array.push(1, 2, 3);
        expect(sum).toBe(6);

        object.array.push(0);
        expect(sum).toBe(6);

    });

});

describe("makeAverageObserver", function () {

    it("should react to array changes and replacements", function () {

        var average;
        var object = {array: [1,2,3]};

        var cancel = Observers.makeAverageObserver(
            Observers.makePropertyObserver(
                Observers.makeLiteralObserver(object),
                Observers.makeLiteralObserver('array')
            )
        )(function (_average) {
            average = _average;
        }, new Scope());

        expect(average).toBe(2);

        object.array.push(4);
        expect(average).toBe(2.5);

        object.array = [];
        expect(isNaN(average)).toBe(true);

        object.array.push(1, 2, 3);
        expect(average).toBe(2);

        object.array.push(0);
        expect(average).toBe(1.5);

    });

});

describe("makeViewObserver", function () {
    // TODO
});

// Advanced Compound Observers

xdescribe("makeExpressionObserver", function () {

    it("should work", function () {
        var inputSignal = new Signal();
        var expressionSignal = new Signal();
        var observeOutput = Observers.makeExpressionObserver(
            inputSignal.observe,
            expressionSignal.observe
        );
        var spy = jasmine.createSpy();
        var cancel = observeOutput(spy, new Scope());
        expect(spy).not.toHaveBeenCalled();

        inputSignal.emit(10);
        expect(spy).not.toHaveBeenCalled();

        expressionSignal.emit("this + 1");
        expect(spy).toHaveBeenCalledWith(11);

    });

});

describe("makeWithObserver", function () {
    // TODO
});

describe("makeConditionalObserver", function () {
    // TODO
});

describe("makeOrObserver", function () {
    // TODO
});

describe("makeAndObserver", function () {
    // TODO
});

describe("makeOnlyObserver", function () {
    it("should work", function () {
        var collectionSignal = new Signal;
        var observeOutput = Observers.makeOnlyObserver(
            collectionSignal.observe
        );
        var spy = jasmine.createSpy();
        var cancel = observeOutput(spy, new Scope());
        expect(spy).not.toHaveBeenCalled();

        collectionSignal.emit([1]);
        expect(spy).toHaveBeenCalledWith(1);
    })
});


// Utility Methods
// ---------------

describe("makeUniq", function () {
    // TODO
});

describe("autoCancelPrevious", function () {
    // TODO
});

describe("once", function () {
    // TODO
});
