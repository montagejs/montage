/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    PagedArrayController = require("montage/ui/controller/paged-array-controller").PagedArrayController;

var Bug = Montage.create(Montage, {

    name: {
        enumerable: false,
        value: null
    },

    species: {
        enumerable: false,
        value: null
    },

    initWithName: {
        enumerable: false,
        value: function(aName) {
            this.name = aName;
            return this;
        }
    }

});

describe("controller/paged-array-controller-spec.js", function() {

    var controller;

    beforeEach(function() {
        controller = PagedArrayController.create();
    });

    describe("initializing a pagination controller", function() {

        it("pageIndex should be 0 by default", function() {
            expect(controller.pageIndex).toEqual(0);
        });

        it("pageNumber should be 1 by default", function() {
            expect(controller.pageNumber).toEqual(1);
        });

        it("pageSize should be 10 by default", function() {
            expect(controller.pageSize).toEqual(10);
        });

        it("padding should be 0 by default", function() {
            expect(controller.padding).toEqual(0);
        });

    });

    describe("with content", function() {

        var flick, atta, dot, queen, heimlich, gypsy, rosie, francis, slim, hopper, molt, manny, dim, tuck, roll, flea;

        beforeEach(function() {
            flick = Bug.create().initWithName("Flik"); //0
            flick.species = "ant";

            atta = Bug.create().initWithName("Atta"); // 1
            atta.species = "ant";

            dot = Bug.create().initWithName("Dot"); // 2
            dot.species = "ant";

            queen = Bug.create().initWithName("Queen"); // 3
            queen.species = "ant";

            heimlich = Bug.create().initWithName("Heimlich"); // 4
            heimlich.species = "caterpillar";

            gypsy = Bug.create().initWithName("Gypsy"); // 5
            gypsy.species = "moth";

            rosie = Bug.create().initWithName("Rosie"); // 6
            rosie.species = "spider";

            francis = Bug.create().initWithName("Francis"); // 7
            francis.species = "ladybug";

            slim = Bug.create().initWithName("Slim"); // 8
            slim.species = "stick";

            hopper = Bug.create().initWithName("Hopper"); // 9
            hopper.species = "grasshoper";

            molt = Bug.create().initWithName("Molt"); // 10
            molt.species = "grasshoper";

            manny = Bug.create().initWithName("Manny"); // 11
            manny.species = "mantis";

            dim = Bug.create().initWithName("Dim"); // 12
            dim.species = "beetle";

            tuck = Bug.create().initWithName("Tuck"); // 13
            tuck.species = "woodlice";

            roll = Bug.create().initWithName("Roll"); // 14
            roll.species = "woodlice";

            flea = Bug.create().initWithName("Flea"); // 15
            flea.species = "flea";

            controller.initWithContent([flick, atta, dot, queen, heimlich, gypsy, rosie, francis, slim, hopper, molt, manny, dim, tuck, roll, flea]);
        });

        it("should update the pageCount", function() {
            expect(controller.pageCount).toBe(2);
        });

        it("should have correct range", function() {
            expect(controller.startIndex).toBe(0);
            expect(controller.endIndex).toBe(10);
        });

        describe("calling gotoPage(1)", function() {
            beforeEach(function() {
               controller.gotoPage(1);
            });
            it("should increment pageIndex", function() {
                expect(controller.pageIndex).toBe(1);
            });
            it("should have correct range", function() {
                expect(controller.startIndex).toBe(10);
                expect(controller.endIndex).toBe(16);
            });
        });

        describe("changing pageSize", function() {
            beforeEach(function() {
               controller.pageSize = 5;
            });
            it("should update the pageCount", function() {
                expect(controller.pageCount).toBe(4)
            });

            describe("calling gotoLastPage()", function() {
                beforeEach(function() {
                   controller.gotoLastPage();
                });
                it("should increment pageIndex", function() {
                    expect(controller.pageIndex).toBe(3);
                });
                it("should have correct range", function() {
                    expect(controller.startIndex).toBe(15);
                    expect(controller.endIndex).toBe(16);
                });

                describe("then calling gotoFirstPage()", function() {
                    beforeEach(function() {
                       controller.gotoFirstPage();
                    });
                    it("should increment pageIndex", function() {
                        expect(controller.pageIndex).toBe(0);
                    });
                    it("should have correct range", function() {
                        expect(controller.startIndex).toBe(0);
                        expect(controller.endIndex).toBe(5);
                    });
                });

            });

            describe("calling gotoNextPage()", function() {
                beforeEach(function() {
                   controller.gotoNextPage();
                });
                it("should increment pageIndex", function() {
                    expect(controller.pageIndex).toBe(1);
                });
                it("should have correct range", function() {
                    expect(controller.startIndex).toBe(5);
                    expect(controller.endIndex).toBe(10);
                });
            });

            describe("calling gotoPreviousPage()", function() {
                beforeEach(function() {
                   controller.gotoPreviousPage();
                });
                it("should increment pageIndex", function() {
                    expect(controller.pageIndex).toBe(0);
                });
                it("should have correct range", function() {
                    expect(controller.startIndex).toBe(0);
                    expect(controller.endIndex).toBe(5);
                });
            });

            describe("calling gotoContentIndex()", function() {
                var targetIndex = 8;
                beforeEach(function() {
                   controller.gotoContentIndex(targetIndex);
                });
                it("should go to the correct page", function() {
                    expect(controller.pageIndex).toBe(1);
                });
                it("should have correct range", function() {
                    expect(controller.startIndex-1).toBeLessThan(targetIndex);
                    expect(controller.endIndex).toBeGreaterThan(targetIndex);
                });
            });

            describe("calling gotoContentIndex() with out of bounds index", function() {
                it("should go to the first page if index is too small", function() {
                    controller.gotoContentIndex(-5);
                    expect(controller.pageIndex).toBe(0);
                });
                it("should go to the last page if index is too large", function() {
                    controller.gotoContentIndex(99);
                    expect(controller.pageNumber).toBe(controller.pageCount);
                });
            });

            describe("changeEvents", function() {
                it("should be dispatched for pageCount", function() {
                    var expectChange = expectationToDispatch(controller, "change@pageCount", function(event) {
                        expect(event.minus).toBe(4);
                        expect(event.plus).toBe(8);
                    });
                    controller.pageSize = 2;
                    expectChange();
                });
                it("shouldn't be dispatched for pageCount if not necessary", function() {
                    var expectChange = expectationToDispatch(controller, "change@pageCount");
                    controller.gotoContentIndex = 1;
                    expectChange(true);
                });
                it("should be dispatched for pageSize", function() {
                    var expectChange = expectationToDispatch(controller, "change@pageSize", function(event) {
                        expect(event.minus).toBe(5);
                        expect(event.plus).toBe(2);
                    });
                    controller.pageSize = 2;
                    expectChange();
                });
                it("shouldn't be dispatched for pageSize if not necessary", function() {
                    var expectChange = expectationToDispatch(controller, "change@pageSize");
                    controller.gotoContentIndex = 1;
                    expectChange(true);
                });
                it("should be dispatched for pageIndex", function() {
                    var expectChange = expectationToDispatch(controller, "change@pageIndex", function(event) {
                        expect(event.minus).toBe(0);
                        expect(event.plus).toBe(2);
                    });
                    controller.pageIndex = 2;
                    expectChange();
                });
                it("shouldn't be dispatched for pageIndex if not necessary", function() {
                    var expectChange = expectationToDispatch(controller, "change@pageIndex");
                    controller.gotoContentIndex = 1;
                    expectChange(true);
                });
                it("should be dispatched for padding", function() {
                    var expectChange = expectationToDispatch(controller, "change@padding", function(event) {
                        expect(event.minus).toBe(0);
                        expect(event.plus).toBe(4);
                    });
                    controller.padding = 4;
                    expectChange();
                });
                it("shouldn't be dispatched for padding if not necessary", function() {
                    var expectChange = expectationToDispatch(controller, "change@padding");
                    controller.gotoContentIndex = 1;
                    expectChange(true);
                });
                it("should be dispatched for endIndex", function() {
                    var expectChange = expectationToDispatch(controller, "change@endIndex", function(event) {
                        expect(event.minus).toBe(5);
                        expect(event.plus).toBe(15);
                    });
                    controller.pageIndex = 2;
                    expectChange();
                });
                it("shouldn't be dispatched for endIndex if not necessary", function() {
                    var expectChange = expectationToDispatch(controller, "change@endIndex");
                    controller.gotoContentIndex = 1;
                    expectChange(true);
                });
                it("should be dispatched for startIndex", function() {
                    var expectChange = expectationToDispatch(controller, "change@startIndex", function(event) {
                        expect(event.minus).toBe(0);
                        expect(event.plus).toBe(10);
                    });
                    controller.pageIndex = 2;
                    expectChange();
                });
                it("shouldn't be dispatched for startIndex if not necessary", function() {
                    var expectChange = expectationToDispatch(controller, "change@startIndex");
                    controller.gotoContentIndex = 1;
                    expectChange(true);
                });
            });

        });

        describe("with padding set", function() {
            beforeEach(function() {
                controller.pageSize = 5;
                controller.padding = 2;
            });
            it("should have correct range", function() {
                expect(controller.startIndex).toBe(0);
                expect(controller.endIndex).toBe(7);
            });

            describe("calling gotoNextPage()", function() {
                beforeEach(function() {
                   controller.gotoNextPage();
                });
                it("should increment pageIndex", function() {
                    expect(controller.pageIndex).toBe(1);
                });
                it("should have correct range", function() {
                    expect(controller.startIndex).toBe(3);
                    expect(controller.endIndex).toBe(12);
                });
            });

            describe("calling gotoLastPage()", function() {
                beforeEach(function() {
                   controller.gotoLastPage();
                });
                it("should increment pageIndex", function() {
                    expect(controller.pageIndex).toBe(3);
                });
                it("should have correct range", function() {
                    expect(controller.startIndex).toBe(13);
                    expect(controller.endIndex).toBe(16);
                });
            });

        });

    });
});
