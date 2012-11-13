
var O = require("../observers");

describe("observe filter", function () {

    it("should work", function () {
        var input = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        var output;
        var cancel = O.makeContentObserver(O.makeFilterBlockObserver(
            O.makeLiteralObserver(input),
            O.makeRelationObserver(function (value) {
                return !(value & 1);
            })
        ))(function (_output) {
            output = _output.slice();
        });

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

