
var O = require("../observers");

describe("sum", function () {

    it("should react to array changes and replacements", function () {

        var sum;
        var object = {array: [1,2,3]};

        var cancel = O.makeSumObserver(
            O.makePropertyObserver(
                O.makeLiteralObserver(object),
                O.makeLiteralObserver('array')
            )
        )(function (_sum) {
            sum = _sum;
        });

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
