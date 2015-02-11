/*global require,exports,describe,it,expect */
var Montage = require("montage").Montage;
var TestPageLoader = require("montage-testing/testpageloader").TestPageLoader;

TestPageLoader.queueTest("collapsible-panel-test", function (testPage) {
    var test;
    beforeEach(function () {
        test = testPage.test;
    });
    describe("ui/collapsible-panel/collapsible-panel-spec", function () {
        describe("Collapsible panel is collapsed or expanded", function () {
            // Template-driven collapsible panel.
            it("1st panel should be closed in Test 1", function () {
                expect(test.templateObjects.test1CollapsiblePanel1.isExpanded).toEqual(false);
            });
            it("2nd panel should be open in Test 1", function () {
                expect(test.templateObjects.test1CollapsiblePanel2.isExpanded).toEqual(true);
            });
            it("1st panel should be closed in Test 2", function () {
                expect(testPage.querySelectorAll("[data-montage-id=test-2-collapsiblePanel]")[0].querySelectorAll(".montage-CollapsiblePanel--active").length).toEqual(0);
            });
            // Data-driven collapsible panel.
            it("2nd panel should be closed in Test 2", function () {
                expect(testPage.querySelectorAll("[data-montage-id=test-2-collapsiblePanel]")[1].querySelectorAll(".montage-CollapsiblePanel--active").length).toEqual(0);
            });
            it("3rd panel should be closed in Test 2", function () {
                expect(testPage.querySelectorAll("[data-montage-id=test-2-collapsiblePanel]")[2].querySelectorAll(".montage-CollapsiblePanel--active").length).toEqual(0);
            });
            it("4th panel should be open in Test 2", function () {
                expect(testPage.querySelectorAll("[data-montage-id=test-2-collapsiblePanel]")[3].querySelectorAll(".montage-CollapsiblePanel--active").length).toEqual(1);
            });
            it("5th panel should be closed in Test 2", function () {
                expect(testPage.querySelectorAll("[data-montage-id=test-2-collapsiblePanel]")[4].querySelectorAll(".montage-CollapsiblePanel--active").length).toEqual(0);
            });
            // Template-driven collapsible panel.
            it("1st panel should be open in Test 3", function () {
                expect(test.templateObjects.test3CollapsiblePanel1.isExpanded).toEqual(true);
            });
            it("2nd panel should be open in Test 3", function () {
                expect(test.templateObjects.test3CollapsiblePanel2.isExpanded).toEqual(true);
            });
            // Data-driven collapsible panel.
            it("1st panel should be open in Test 4", function () {
                expect(testPage.querySelectorAll("[data-montage-id=test-4-collapsiblePanel]")[0].querySelectorAll(".montage-CollapsiblePanel--active").length).toEqual(1);
            });
            it("2nd panel should be closed in Test 4", function () {
                expect(testPage.querySelectorAll("[data-montage-id=test-4-collapsiblePanel]")[1].querySelectorAll(".montage-CollapsiblePanel--active").length).toEqual(0);
            });
            it("3rd panel should be open in Test 4", function () {
                expect(testPage.querySelectorAll("[data-montage-id=test-4-collapsiblePanel]")[2].querySelectorAll(".montage-CollapsiblePanel--active").length).toEqual(1);
            });
            it("4th panel should be open in Test 4", function () {
                expect(testPage.querySelectorAll("[data-montage-id=test-4-collapsiblePanel]")[3].querySelectorAll(".montage-CollapsiblePanel--active").length).toEqual(1);
            });
            it("5th panel should be closed in Test 4", function () {
                expect(testPage.querySelectorAll("[data-montage-id=test-4-collapsiblePanel]")[4].querySelectorAll(".montage-CollapsiblePanel--active").length).toEqual(0);
            });
            // Click on template-driven collapsible panel header.
            it("1st panel should be open after clicking on the header in Test 1", function () {
                var header = testPage.querySelectorAll("[data-montage-id=test-1-header-1]")[0];
                testPage.mouseEvent({target: header}, "mousedown", function () {
                    testPage.mouseEvent({target: header}, "mouseup", function () {
                        expect(test.templateObjects.test1CollapsiblePanel1.isExpanded).toEqual(true);
                    });
                });
            });
            // Click on data-driven collapsible panel header.
            it("3rd panel should be closed after clicking on the header in Test 4", function () {
                var header = testPage.querySelectorAll("[data-montage-id=test-4-header]")[2];
                testPage.mouseEvent({target: header}, "mousedown", function () {
                    testPage.mouseEvent({target: header}, "mouseup", function () {
                        expect(testPage.querySelectorAll("[data-montage-id=test-4-collapsiblePanel]")[2].querySelectorAll(".montage-CollapsiblePanel--active").length).toEqual(0);
                    });
                });
            });
        });
    });
});
