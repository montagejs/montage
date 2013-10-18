var Montage = require("montage").Montage;
var RangeController = require("montage/core/range-controller").RangeController;
var Set = require("montage/collections/set");

describe("core/range-controller-spec", function() {
    var rangeController;

    beforeEach(function () {
        rangeController = RangeController.create().initWithContent([0, 1, 2]);

    });

    describe("selection as array", function() {

        it("when set to null/undefined clears the selection", function () {
            var original = [1];

            rangeController.selection = original;

            rangeController.selection = undefined;
            expect(rangeController.selection).not.toBe(original);
            expect(rangeController.selection).toBeNull();

            rangeController.selection = original;
            expect(rangeController.selection).toBe(original);

            rangeController.selection = null;
            expect(rangeController.selection).not.toBe(original);
            expect(rangeController.selection).toBeNull();
        });

        describe("selection content constraints", function() {
            it("should allow selection is subset of content", function () {
                rangeController.content = [0, 1, 2];
                rangeController.selection = [1];
                expect(rangeController.selection).toEqual([1]);
            });

            it("should not allow selection that is not subset of content", function () {
                rangeController.selection = [3];
                expect(rangeController.selection).toEqual([]);
            });

            it("should not allow adding element to selection that is not in content", function () {
                rangeController.selection = [];
                rangeController.selection.add(3);
                expect(rangeController.selection).toEqual([]);
            });

            it("should remove selection if selected content is removed", function () {
                rangeController.selection = [2];
                rangeController.pop();
                expect(rangeController.selection).toEqual([]);
            });

            it("should not remove selection if other content is removed", function () {
                rangeController.selection = [1];
                rangeController.pop();
                expect(rangeController.selection).toEqual([1]);
            });

            it("should remove selection if selection is not in new content", function () {
                rangeController.selection = [2];
                rangeController.content = [0, 1, 3];
                expect(rangeController.selection).toEqual([]);
            });

            it("should not remove selection if selection is in new content", function () {
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
                    rangeController.selection.add(1);
                    expect(rangeController.selection).toEqual([1]);
                });

                it("does not allow multiple selected items to be added", function () {
                    rangeController.selection.add(1)
                    rangeController.selection.add(2);
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

                it("multiSelect splicing and setting", function() {
                    rangeController.multiSelect = false;
                    var selection = [1];
                    rangeController.selection = selection;
                    expect(rangeController.selection).toEqual([1]);
                    selection.splice(1, 0, 2);
                    expect(rangeController.selection).toEqual([2]);
                    rangeController.selection = [0, 1];
                    expect(rangeController.selection).toEqual([1]);
                });
            });

            describe("when true", function () {
                beforeEach(function () {
                    rangeController.multiSelect = true;
                });

                it("allows multiple selected items to be added", function () {
                    rangeController.selection.add(1);
                    rangeController.selection.add(2);
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

                it("does not allow selection to be cleared", function () {
                    rangeController.selection.clear();
                    expect(rangeController.selection).toEqual([0]);
                });

                it("does not allow selection to be set to null", function () {
                    rangeController.selection = null;
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

                it("avoidsEmptySelection setting new selection", function() {
                    rangeController.avoidsEmptySelection = true;
                    rangeController.selection = [1];
                    expect(rangeController.selection).toEqual([1]);
                    rangeController.selection = [];
                    expect(rangeController.selection).toEqual([1]);
                    rangeController.selection = null;
                    expect(rangeController.selection).toEqual([1]);
                });

                it("avoidsEmptySelection setting null and modifying array", function() {
                    rangeController.avoidsEmptySelection = true;
                    var sel = [1];
                    rangeController.selection = sel;
                    expect(rangeController.selection).toEqual([1]);
                    rangeController.selection = null;
                    expect(rangeController.selection).toEqual([1]);
                    sel.clear();
                    expect(rangeController.selection).toEqual([1]);
                });

                });

            describe("when false", function () {
                beforeEach(function () {
                    rangeController.avoidsEmptySelection = false;
                });

                it("allows selection to be cleared", function () {
                    rangeController.selection.clear();
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
                rangeController.selection.add(1);
                expect(rangeController.selection).toEqual([1]);
            });

            it("does not allow all selection to be cleared", function () {
                rangeController.selection.clear();
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

    });

    describe("selection as set", function() {

        it("when set to null/undefined clears the selection", function () {
            var original = new Set([1]);
            rangeController.selection = original;

            rangeController.selection = undefined;
            expect(rangeController.selection).not.toBe(original);
            expect(rangeController.selection).toBeNull();

            rangeController.selection = original;
            expect(rangeController.selection).toBe(original);

            rangeController.selection = null;
            expect(rangeController.selection).not.toBe(original);
            expect(rangeController.selection).toBeNull();
        });

        describe("selection content constraints", function() {
            it("should allow selection is subset of content", function () {
                rangeController.selection = new Set([1]);
                expect(rangeController.selection.toArray()).toEqual([1]);
            });

            it("should not allow selection that is not subset of content", function () {
                rangeController.selection = new Set([3]);
                expect(rangeController.selection.toArray()).toEqual([]);
            });

            it("should not allow adding element to selection that is not in content", function () {
                rangeController.selection = new Set([]);
                rangeController.selection.add(3);
                expect(rangeController.selection.toArray()).toEqual([]);
            });

            it("should remove selection if selected content is removed", function () {
                rangeController.selection = new Set([2]);
                rangeController.pop();
                expect(rangeController.selection.toArray()).toEqual([]);
            });

            it("should not remove selection if other content is removed", function () {
                rangeController.selection = new Set([1]);
                rangeController.pop();
                expect(rangeController.selection.toArray()).toEqual([1]);
            });

            it("should remove selection if selection is not in new content", function () {
                rangeController.selection = new Set([2]);
                rangeController.content = [0, 1, 3];
                expect(rangeController.selection.toArray()).toEqual([]);
            });

            it("should not remove selection if selection is in new content", function () {
                rangeController.selection = new Set([1]);
                rangeController.content = [0, 1];
                expect(rangeController.selection.toArray()).toEqual([1]);
            });
        });

        describe("multiSelect", function () {

            beforeEach(function () {
                rangeController.selection = new Set([0]);
                expect(rangeController.selection.toArray()).toEqual([0]);
            });

            describe("when false", function () {
                beforeEach(function () {
                    rangeController.multiSelect = false;
                });

                it("allows a selected item to be added", function () {
                    rangeController.selection.add(1);
                    expect(rangeController.selection.toArray()).toEqual([1]);
                });

                it("does not allow multiple selected items to be added", function () {
                    rangeController.selection.add(1)
                    rangeController.selection.add(2);
                    expect(rangeController.selection.toArray()).toEqual([2]);
                });

                it("allows a selected item to be set", function () {
                    rangeController.selection = new Set([1]);
                    expect(rangeController.selection.toArray()).toEqual([1]);
                });

                it("does not allow multiple selected items to be set", function () {
                    rangeController.selection = new Set([1, 2]);
                    expect(rangeController.selection.toArray()).toEqual([2]);
                });

            });

            describe("when true", function () {
                beforeEach(function () {
                    rangeController.multiSelect = true;
                });

                it("allows multiple selected items to be added", function () {
                    rangeController.selection.add(1);
                    rangeController.selection.add(2);
                    expect(rangeController.selection.toArray()).toEqual([0, 1, 2]);
                });

                it("allows multiple selected items to be set", function () {
                    rangeController.selection = new Set([1, 2]);
                    expect(rangeController.selection.toArray()).toEqual([1, 2]);
                });
            });

        });

        describe("avoidsEmptySelection", function () {
            beforeEach(function () {
                rangeController.multiSelect = true;
                rangeController.selection = new Set([0, 1]);
                expect(rangeController.selection.toArray()).toEqual([0, 1]);
            });

            describe("when true", function () {
                beforeEach(function () {
                    rangeController.avoidsEmptySelection = true;
                });

                it("allows a selected item to be removed", function () {
                    rangeController.selection.pop();
                    expect(rangeController.selection.toArray()).toEqual([0]);
                });

                it("does not allow selection to be cleared", function () {
                    rangeController.selection.clear();
                    expect(rangeController.selection.toArray()).toEqual([0]);
                });

                it("does not allow selection to be set to null", function () {
                    rangeController.selection = null;
                    expect(rangeController.selection.toArray()).toEqual([0]);
                });

                it("allows a selected item to be set", function () {
                    rangeController.selection = new Set([1]);
                    expect(rangeController.selection.toArray()).toEqual([1]);
                });

                it("does not allow no selected items to be set", function () {
                    rangeController.selection = new Set([]);
                    expect(rangeController.selection.toArray()).toEqual([0]);
                });
            });

            describe("when false", function () {
                beforeEach(function () {
                    rangeController.avoidsEmptySelection = false;
                });

                it("allows selection to be cleared", function () {
                    rangeController.selection.clear();
                    expect(rangeController.selection.toArray()).toEqual([]);
                });

                it("allows no selected items to be set", function () {
                    rangeController.selection = new Set([]);
                    expect(rangeController.selection.toArray()).toEqual([]);
                });
            });
        });

        describe("!multiSelect and avoidsEmptySelection", function () {

            beforeEach(function () {
                rangeController.avoidsEmptySelection = false;
                rangeController.avoidsEmptySelection = true;
                rangeController.selection = new Set([0]);
            });

            it("does not allow the selected item to be removed", function () {
                rangeController.selection.pop();
                expect(rangeController.selection.toArray()).toEqual([0]);
            });

            it("does not allow another selected item to be added", function () {
                rangeController.selection.add(1);
                expect(rangeController.selection.toArray()).toEqual([1]);
            });

            it("does not allow all selection to be cleared", function () {
                rangeController.selection.clear();
                expect(rangeController.selection.toArray()).toEqual([0]);
            });

            it("allows a selected item to be set", function () {
                rangeController.selection = new Set([1]);
                expect(rangeController.selection.toArray()).toEqual([1]);
            });

            it("only allows one selected item to be set", function () {
                rangeController.selection = new Set([1, 2]);
                expect(rangeController.selection.toArray()).toEqual([2]);
            });

            it("does not allow no selected items to be set", function () {
                rangeController.selection = new Set([]);
                expect(rangeController.selection.toArray()).toEqual([0]);
            });

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
