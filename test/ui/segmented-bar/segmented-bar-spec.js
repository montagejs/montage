// "use strict"; // TODO: causes q to throw, will reinstate when q is replaced by bluebird

var TestPageLoader = require("montage-testing/testpageloader").TestPageLoader;

TestPageLoader.queueTest("segmented-bar-test", function (testPage) {
    describe("ui/segmented-bar/segmented-bar-spec", function () {
        var segmentedBarComponent;
        var segmentElements;
        beforeEach(function () {
            segmentedBarComponent = testPage.getElementById("segmentedBar1").component;
            segmentElements = testPage.querySelectorAll("[data-montage-id=segment1]");
        });

        afterEach(function () {
            segmentedBarComponent.exitDocument();
        });

        describe("SegmentedBar", function () {
            it("should instantiate with content array", function () {
                expect(segmentedBarComponent).toBeDefined();
            });

            it("should instantiate with RangeController", function () {
                segmentedBarComponent = testPage.getElementById("segmentedBar2").component;
                expect(segmentedBarComponent).toBeDefined();
            });

            it("should instantiate with TreeController", function () {
                segmentedBarComponent = testPage.getElementById("segmentedBar3").component;
                expect(segmentedBarComponent).toBeDefined();
            });

            it("should render according to parentElement's dimensions", function () {
                expect(segmentedBarComponent.element.clientHeight).toEqual(30);
                expect(segmentedBarComponent.element.clientWidth)
                    .toEqual(segmentedBarComponent.element.parentElement.clientWidth);
            });

            it("should repeat the right number of segments", function () {
                expect(segmentElements.length).toEqual(6);
            });

            describe("SegmentedBar events", function () {
                var _handler;
                beforeEach(function () {
                    _handler = jasmine.createSpy().andCallFake(function (event) {
                        expect(event.detail.get("data").label).toEqual("region1");
                    });
                    segmentedBarComponent.addEventListener("action", _handler);
                });
                afterEach(function () {
                    segmentedBarComponent.removeEventListener("action", _handler);
                });

                it("should dispatch an action event with correct .detail data", function () {
                    testPage.mouseEvent({target: segmentElements[0]}, "mousedown", function () {
                        testPage.mouseEvent({target: segmentElements[0]}, "mouseup", function () {
                            expect(_handler).toHaveBeenCalled();
                        });
                    });
                });

                it("should not dispatchActionEvent when enabled === false", function () {
                    segmentElements = testPage.querySelectorAll("[data-montage-id=segment2]");
                    testPage.mouseEvent({target: segmentElements[0]}, "mousedown", function () {
                        testPage.mouseEvent({target: segmentElements[0]}, "mouseup", function () {
                            expect(_handler).not.toHaveBeenCalled();
                        });
                    });
                });
            });
        });

        describe("Segment", function () {
            it("should instantiate", function () {
                expect(segmentElements[0].component).toBeDefined();
            });

            it("should render with correct text label from content array", function () {
                expect(segmentElements[3].component.templateObjects.text.element.textContent).toEqual("region4");
            });

            it("should render with correct text label from RangeController", function () {
                segmentElements = testPage.querySelectorAll("[data-montage-id=segment2]");
                expect(segmentElements[3].component.templateObjects.text.element.textContent).toEqual("region4");
            });

            it("should render with correct text label from TreeController", function () {
                segmentElements = testPage.querySelectorAll("[data-montage-id=segment3]");
                expect(segmentElements[1].component.templateObjects.text.element.textContent).toEqual("CA");
            });

            it("should render with correct width in horizontal orientation", function () {
                expect(segmentElements[0].clientWidth).toEqual(96);
            });

            it("should render with correct height in vertical orientation", function () {
                segmentElements = testPage.querySelectorAll("[data-montage-id=segment4]");
                expect(segmentElements[0].clientHeight).toEqual(96);
            });
        });
    });
});
