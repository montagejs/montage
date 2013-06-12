var Montage = require("montage").Montage;
var RangeController = require("montage/core/range-controller").RangeController;

describe("core/range-controller-spec", function() {
    var rangeController;

    beforeEach(function () {
        rangeController = RangeController.create().initWithContent([0, 1, 2]);
    });

    describe("selection", function() {

        it("when set to null/undefined clears the selection", function () {
            var original = [1];
            rangeController.selection = original;

            rangeController.selection = undefined;
            expect(rangeController.selection).not.toBe(original);
            expect(rangeController.selection).toEqual([]);
            original = rangeController.selection;

            rangeController.selection = null;
            expect(rangeController.selection).not.toBe(original);
            expect(rangeController.selection).toEqual([]);
        });

    });

});
