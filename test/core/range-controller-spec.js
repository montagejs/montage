var Montage = require("montage").Montage;
var RangeController = require("montage/core/range-controller").RangeController;
var Set = require("montage/collections/set");

describe("core/range-controller-spec", function () {
    var rangeController;

    beforeEach(function () {
        rangeController = RangeController.create().initWithContent([0, 1, 2]);
    });

    describe("selection", function () {
        describe("constrained by uniqueness", function () {
            it("TODO should not allow duplicates");
            it("TODO should allow new item if duplicate deleted in same splice");
        });

        it("swap should select an object in case of for no-op when rangeController avoidsEmptySelection", function () {
            //Save state
            var avoidsEmptySelection = rangeController.avoidsEmptySelection;
            var selection = rangeController.selection;
            //Needed for spec
            rangeController.avoidsEmptySelection = true;
            var swapResult = rangeController.selection.swap(0,0,[]);
            //set property to what it was
            rangeController.avoidsEmptySelection = avoidsEmptySelection;
            rangeController.selection = selection;

            expect(swapResult.toArray()).toEqual([]);
            expect(rangeController.selection.toArray()).toEqual([0]);
        });

        it("should allow setting selection to null/undefined", function () {
            rangeController.selection = [1];
            expect(rangeController.selection.length).toBe(1);
            rangeController.selection = undefined;
            expect(rangeController.selection.length).toBe(0);

            rangeController.selection = [1];
            expect(rangeController.selection.length).toBe(1);
            rangeController.selection = null;
            expect(rangeController.selection.length).toBe(0);
        });

        describe("constrained to content", function () {
            it("should allow selection if subset of content", function () {
                rangeController.selection.add(1);
                expect(rangeController.selection.toArray()).toEqual([1]);
            });
            it("should disallow selection if not in content", function () {
                rangeController.selection.add(5);
                expect(rangeController.selection.toArray()).toEqual([]);
            });
            it("should remove selection if selected content is removed", function () {
                rangeController.selection.add(2);
                rangeController.pop();
                expect(rangeController.selection.toArray()).toEqual([]);
            });
            it("should not remove selection if other content is removed", function () {
                rangeController.selection.add(1);
                rangeController.pop();
                expect(rangeController.selection.toArray()).toEqual([1]);
            });
            it("should remove selection if selection is not in new content", function () {
                rangeController.selection.add(2);
                rangeController.content = [0, 1, 3];
                expect(rangeController.selection.toArray()).toEqual([]);
            });

            it("should not remove selection if selection is in new content", function () {
                rangeController.selection.add(1);
                rangeController.content = [0, 1];
                expect(rangeController.selection.toArray()).toEqual([1]);
            });
        });
        describe("constrained by multiSelect", function () {
            beforeEach(function () {
                rangeController.selection.add(0);
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

                it("TODO: test two-way bindings with multiple values");

                it("multiSelect splicing and setting", function () {
                    rangeController.selection.splice(1, 0, 2);
                    expect(rangeController.selection.toArray()).toEqual([2]);
                    rangeController.selection.splice(0, 1, 0, 1);
                    expect(rangeController.selection.toArray()).toEqual([1]);
                });

                it("results in correct calls to range change listeners", function () {
                    var spy = jasmine.createSpy();
                    rangeController.selection.addRangeChangeListener(spy);

                    rangeController.selection.add(2);

                    expect(spy).toHaveBeenCalled();
                    var args = spy.mostRecentCall.args;
                    expect(args[0]).toEqual([2]);
                    expect(args[1]).toEqual([0]);
                    expect(args[2]).toEqual(0);
                });

                it("correctly updates another RangeController's content", function () {
                    rangeController.selection.add(1);
                    expect(rangeController.selection.toArray()).toEqual([1]);

                    // from Repetition#content setter
                    var object = new RangeController().initWithContent(rangeController.selection);
                    expect(object.organizedContent.toArray()).toEqual([1]);

                    rangeController.selection.push(2);

                    expect(rangeController.selection.toArray()).toEqual([2]);
                    expect(object.organizedContent.toArray()).toEqual([2]);
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
                    rangeController.selection.splice(0, 1, 1, 2);
                    expect(rangeController.selection.toArray()).toEqual([1, 2]);
                });
            });
        });

        describe("constrained by avoidsEmptySelection", function () {
            beforeEach(function () {
                rangeController.multiSelect = true;
                rangeController.selection.splice(0, 0, 0, 1);
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

                it("allows a selected item to be set", function () {
                    rangeController.selection.splice(0, 100, 1);
                    expect(rangeController.selection.toArray()).toEqual([1]);
                });

                it("does not allow splice to clear selection", function () {
                    rangeController.selection.splice(0, 100);
                    expect(rangeController.selection.toArray()).toEqual([0]);
                });

                it("does not have an empty selection when selected content is removed", function () {
                    rangeController.multiSelect = false;
                    rangeController.selection = [0];

                    rangeController.content.delete(0);
                    expect(rangeController.selection.length).toBe(1);
                    expect(rangeController.selection.toArray()).not.toEqual([0]);
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

                it("allows splice to clear selection", function () {
                    rangeController.selection.splice(0, 100);
                    expect(rangeController.selection.toArray()).toEqual([]);
                });
            });
        });

        describe("constrained to always have one selection", function () {
            beforeEach(function () {
                rangeController.avoidsEmptySelection = false;
                rangeController.avoidsEmptySelection = true;
                rangeController.selection.add(0);
                expect(rangeController.selection.toArray()).toEqual([0]);
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

            it("only allows one selected item to be set", function () {
                rangeController.selection.splice(0, 0, 1, 2);
                expect(rangeController.selection.toArray()).toEqual([2]);
            });

            it("does not allow no selected items to be set", function () {
                rangeController.selection.splice(0, 100);
                expect(rangeController.selection.toArray()).toEqual([0]);
            });
        });

        describe("negative splice inputs", function () {
            it("can be spliced with a negative start", function () {
                rangeController.multiSelect = true;
                rangeController.selection = [0, 1, 2];

                expect(rangeController.selection.toArray()).toEqual([0, 1, 2]);

                var removed = rangeController.selection.splice(-1, 1);
                expect(removed).toEqual([2]);

                expect(rangeController.selection.toArray()).toEqual([0, 1]);
            });

            it("can be spliced with a negative start, and howMany more than length", function () {
                rangeController.multiSelect = true;
                rangeController.avoidsEmptySelection = true;
                rangeController.selection = [0, 1, 2];

                expect(rangeController.selection.toArray()).toEqual([0, 1, 2]);

                var removed = rangeController.selection.splice(-3, 5);
                expect(removed).toEqual([1, 2]);

                expect(rangeController.selection.toArray()).toEqual([0]);
            });
        });
    });

    xit("Test what happens if two selections are two-way bound and their owners have different settings. I assume total chaos.");

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

    describe("When content has a custom contentEquals", function () {
        beforeEach(function () {
            var content = [0, 1, 2];
            content.contentEquals = function (){ return true; };
            expect(content.find(42)).toBe(0);

            rangeController = RangeController.create().initWithContent(content);
            rangeController.multiSelect = true;
            rangeController.selection = [0];

            expect(rangeController.selection.toArray()).toEqual([0]);
        });

        it("should not allow duplicates according to the custom contentEquals", function () {
            rangeController.selection.add(1);
            expect(rangeController.selection.toArray()).toEqual([0]);
        });

        it("should check of selection is in content using the custom contentEquals", function () {
            rangeController.selection.splice(0, 1, 42);
            expect(rangeController.selection.toArray()).toEqual([42]);
        });
    });

    describe("swap", function () {
        it("should accept an array of added items, rather than being variadic.", function () {
            rangeController.content = [1, 2];
            rangeController.swap(1, 1, [3, 4]);
            expect(rangeController.content).toEqual([1, 3, 4]);
        });
    });

    describe("filtering, sorting and reversing", function () {
        it("filterPath should work as expected", function () {
            rangeController.content = [1, 2, 3, 4, 5];
            rangeController.filterPath = "%2";
            expect(rangeController.organizedContent).toEqual([1, 3, 5]);
            rangeController.content = [1, 2, 3];
            expect(rangeController.organizedContent).toEqual([1, 3]);
        });
        it("sortPath should work as expected", function () {
            rangeController.content = [3, 1, 5, 2, 4];
            rangeController.sortPath = "";
            expect(rangeController.organizedContent).toEqual([1, 2, 3, 4, 5]);
            rangeController.content = [2, 3, 1];
            expect(rangeController.organizedContent).toEqual([1, 2, 3]);
        });
        it("reversed should work as expected", function () {
            rangeController.content = [1, 2, 3, 4, 5];
            rangeController.reversed = true;
            expect(rangeController.organizedContent).toEqual([5, 4, 3, 2, 1]);
            rangeController.content = [1, 2, 3];
            expect(rangeController.organizedContent).toEqual([3, 2, 1]);
        });
        it("together should work as expected", function () {
            rangeController.content = [3, 1, 5, 2, 4];
            rangeController.filterPath = "%2";
            rangeController.sortPath = "";
            rangeController.reversed = true;
            expect(rangeController.organizedContent).toEqual([5, 3, 1]);
        });
    });

});
