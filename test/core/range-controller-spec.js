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

    describe("addContent and contentConstructor", function () {

        it("should instantiate a configured content type", function () {
            rangeController.contentConstructor = function FromTheFirstDimension() {
                this.x = 10;
            };
            var content = rangeController.addContent();
            expect(content).toEqual({x: 10});
            expect(rangeController.content).toContain({x: 10});
        });

        it("should defer to the content type of the backing collection", function () {
            var content = [];
            content.contentConstructor = function FromTheFirstDimension() {
                this.x = 10;
            };
            rangeController.content = content;
            var content = rangeController.addContent();
            expect(content).toEqual({x: 10});
            expect(rangeController.content).toContain({x: 10});
        });

        it("should use a default content constructor otherwise", function () {
            var content = rangeController.addContent();
            expect(content).toEqual({});
            expect(rangeController.content).toContain({});
        });

        it("should ensure homogeneous content type", function () {
            rangeController.content = [];
            rangeController.contentConstructor = Date;
            rangeController.addContent();
            rangeController.addContent();
            rangeController.addContent();
            expect(rangeController.content.every(function (date) {
                return date instanceof rangeController.contentConstructor;
            })).toBe(true);
        });

    });

});
