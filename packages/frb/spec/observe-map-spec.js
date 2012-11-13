
var O = require("../observers");

describe("observe map", function () {

    it("relation", function () {

        var spy = jasmine.createSpy();

        var array = [1,2,3];

        var cancel = O.makeMapBlockObserver(
            O.makeLiteralObserver(array),
            O.makeRelationObserver(function (n) {
                return n * 2;
            })
        )(function (mapped) {
            function rangeChange(plus, minus, index) {
                spy(index, minus.slice(), plus.slice());
            }
            rangeChange(mapped, [], 0);
            mapped.addRangeChangeListener(rangeChange);
        });

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

    it("replacement", function () {

        var spy = jasmine.createSpy();

        var object = {array: [1,2,3]};

        var cancel = O.makeMapBlockObserver(
            O.makePropertyObserver(
                O.makeLiteralObserver(object),
                O.makeLiteralObserver('array')
            ),
            O.makeRelationObserver(function (n) {
                return n * 2;
            })
        )(function (mapped) {
            function rangeChange(plus, minus, index) {
                spy(index, minus.slice(), plus.slice());
            }
            rangeChange(mapped, [], 0);
            mapped.addRangeChangeListener(rangeChange);
        });

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

});

