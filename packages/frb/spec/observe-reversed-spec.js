
var O = require("../observers");

describe("observe reversed", function () {

    it("should reverse", function () {

        var spy = jasmine.createSpy();

        var array = [1,2,3];

        var cancel = O.makeReversedObserver(
            O.makeLiteralObserver(array)
        )(function (reversed) {
            function rangeChange(plus, minus, index) {
                spy(index, minus.slice(), plus.slice());
            }
            rangeChange(reversed, [], 0);
            reversed.addRangeChangeListener(rangeChange);
        });

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

    // TODO replacement

});

