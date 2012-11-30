
var O = require("../observers");

describe("average", function () {

    it("should react to array changes and replacements", function () {

        var average;
        var object = {array: [1,2,3]};

        var cancel = O.makeAverageObserver(
            O.makePropertyObserver(
                O.makeLiteralObserver(object),
                O.makeLiteralObserver('array')
            )
        )(function (_average) {
            average = _average;
        });

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
