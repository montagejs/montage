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

        it("should allow selection is subset of content", function () {
            rangeController.content = [0, 1, 2];
            rangeController.selection = [1];
            expect(rangeController.selection).toEqual([1]);
        });

        it("should not allow selection that is not subset of content", function () {
            rangeController.content = [0, 1, 2];
            rangeController.selection = [3];
            expect(rangeController.selection).toEqual([]);
        });

        it("should not allow adding element to selection that is not in content", function () {
            rangeController.content = [0, 1, 2];
            rangeController.selection.push(3);
            expect(rangeController.selection).toEqual([0, 1]);
        });

        it("should remove selection if selected content is removed", function () {
            rangeController.content = [0, 1, 2];
            rangeController.selection = [2];
            rangeController.pop();
            expect(rangeController.selection).toEqual([]);
        });

        it("should not remove selection if other content is removed", function () {
            rangeController.content = [0, 1, 2];
            rangeController.selection = [1];
            rangeController.pop();
            expect(rangeController.selection).toEqual([1]);
        });

        it("should remove selection if selection is not in new content", function () {
            rangeController.content = [0, 1, 2];
            rangeController.selection = [2];
            rangeController.content = [0, 1, 3];
            expect(rangeController.selection).toEqual([]);
        });

        it("should not remove selection if selection is in new content", function () {
            rangeController.content = [0, 1, 2];
            rangeController.selection = [1];
            rangeController.content = [0, 1];
            expect(rangeController.selection).toEqual([1]);
        });

    });

    describe("multiSelect", function () {

        beforeEach(function () {
            rangeController.selection = [0];
            expect(rangeController.selection).toEqual([0]);
        });

        describe("when false", function () {
            beforeEach(function () {
                rangeController.multiSelect = false;
            });

            it("allows a selected item to be added", function () {
                rangeController.selection.push(1);
                expect(rangeController.selection).toEqual([1]);
            });

            it("does not allow multiple selected items to be added", function () {
                rangeController.selection.push(1, 2);
                expect(rangeController.selection).toEqual([2]);
            });

            it("allows a selected item to be set", function () {
                rangeController.selection = [1];
                expect(rangeController.selection).toEqual([1]);
            });

            it("does not allow multiple selected items to be set", function () {
                rangeController.selection = [1, 2];
                expect(rangeController.selection).toEqual([2]);
            });

        });

        describe("when true", function () {
            beforeEach(function () {
                rangeController.multiSelect = true;
            });

            it("allows multiple selected items to be added", function () {
                rangeController.selection.push(1, 2);
                expect(rangeController.selection).toEqual([0, 1, 2]);
            });

            it("allows multiple selected items to be set", function () {
                rangeController.selection = [1, 2];
                expect(rangeController.selection).toEqual([1, 2]);
            });
        });

    });

    describe("avoidsEmptySelection", function () {
        beforeEach(function () {
            rangeController.multiSelect = true;
            rangeController.selection = [0, 1];
            expect(rangeController.selection).toEqual([0, 1]);
        });

        describe("when true", function () {
            beforeEach(function () {
                rangeController.avoidsEmptySelection = true;
            });

            it("allows a selected item to be removed", function () {
                rangeController.selection.pop();
                expect(rangeController.selection).toEqual([0]);
            });

            it("does not allow all items to be removed", function () {
                rangeController.selection.splice(0, 2);
                expect(rangeController.selection).toEqual([0]);
            });

            it("allows a selected item to be set", function () {
                rangeController.selection = [1];
                expect(rangeController.selection).toEqual([1]);
            });

            it("does not allow no selected items to be set", function () {
                rangeController.selection = [];
                expect(rangeController.selection).toEqual([0]);
            });
        });

        describe("when false", function () {
            beforeEach(function () {
                rangeController.avoidsEmptySelection = false;
            });

            it("allows all selected items to be removed", function () {
                rangeController.selection.splice(0, 2);
                expect(rangeController.selection).toEqual([]);
            });

            it("allows no selected items to be set", function () {
                rangeController.selection = [];
                expect(rangeController.selection).toEqual([]);
            });
        });
    });

    describe("!multiSelect and avoidsEmptySelection", function () {

        beforeEach(function () {
            rangeController.avoidsEmptySelection = false;
            rangeController.avoidsEmptySelection = true;
            rangeController.selection = [0];
        });

        it("does not allow the selected item to be removed", function () {
            rangeController.selection.pop();
            expect(rangeController.selection).toEqual([0]);
        });

        it("does not allow another selected item to be added", function () {
            rangeController.selection.push(1);
            expect(rangeController.selection).toEqual([1]);
        });

        it("does not allow all items to be removed", function () {
            rangeController.selection.splice(0, 2);
            expect(rangeController.selection).toEqual([0]);
        });

        it("allows a selected item to be set", function () {
            rangeController.selection = [1];
            expect(rangeController.selection).toEqual([1]);
        });

        it("only allows one selected item to be set", function () {
            rangeController.selection = [1, 2];
            expect(rangeController.selection).toEqual([2]);
        });

        it("does not allow no selected items to be set", function () {
            rangeController.selection = [];
            expect(rangeController.selection).toEqual([0]);
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

        it("should use a default content constructor when no content is available", function () {
            rangeController = RangeController.create();
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
