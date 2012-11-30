
var O = require("../observers");

describe("observe flatten", function () {

    it("relation", function () {

        var input = [[1, 2, 3], [7, 8, 9]];
        var output;
        var calls = 0;

        var cancel = O.makeFlattenObserver(O.makeLiteralObserver(input))
        (function (_output) {
            output = _output;
            calls++;
        });

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

    it("replacement", function () {

        var array = [[1, 2, 3], [7, 8, 9]];
        var object = {array: array};
        var output;

        var cancel = O.makeFlattenObserver(
            O.makePropertyObserver(
                O.makeLiteralObserver(object),
                O.makeLiteralObserver('array')
            )
        )(function (_output) {
            output = _output;
        });

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

