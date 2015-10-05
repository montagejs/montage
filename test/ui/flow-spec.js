var TestPageLoader = require("montage-testing/testpageloader").TestPageLoader,
    RangeController = require("montage/core/range-controller").RangeController;

function cleanTextContent(element) {
    return element.textContent.replace(/\s\s+/g, ' ').trim();
}

TestPageLoader.queueTest("flow/flow", function (testPage) {

    describe("ui/flow/flow-spec", function () {
        describe("Flow", function () {
            var flow,
                flowRepetition,
                rangeController;

            beforeEach(function () {
                flow = testPage.querySelector(".flow").component;
            });

            it("can be created", function () {
                expect(flow).toBeDefined();
            });

            describe("currentIteration property", function () {
                it("should cause a deprecation warning", function () {
                    expectConsoleCallsFrom(function () {
                        flow.observeProperty("currentIteration", Function.noop, Function.noop );
                    }, testPage.window, "warn").toHaveBeenCalledWith("currentIteration is deprecated, use :iteration.object instead.", "");
                });
            });

            describe("objectAtCurrentIteration property", function () {
                it("should cause a deprecation warning", function () {
                    expectConsoleCallsFrom(function () {
                        flow.observeProperty("objectAtCurrentIteration", Function.noop, Function.noop );
                    }, testPage.window, "warn").toHaveBeenCalledWith("objectAtCurrentIteration is deprecated, use :iteration.object instead.", "");
                });
            });

            describe("contentAtCurrentIteration property", function () {
                it("should cause a deprecation warning", function () {
                    expectConsoleCallsFrom(function () {
                        flow.observeProperty("contentAtCurrentIteration", Function.noop, Function.noop );
                    }, testPage.window, "warn").toHaveBeenCalledWith("contentAtCurrentIteration is deprecated, use :iteration.object instead.", "");
                });
            });

            describe("setting up camera, paths and content", function () {
                it("should create the expected iterations", function () {
                    var content = [],
                        i;

                    for (i = 0; i < 100; i++) {
                        content.push(i);
                    }
                    flow.cameraPosition = [0, 0, 250];
                    flow.cameraTargetPoint = [0, 0, 0];
                    flow.cameraFov = 90;
                    flow.content = content;
                    flow.paths = [{
                        "knots": [
                            {
                                "knotPosition": [-5000, 0, 0],
                                "nextHandlerPosition": [-5000 / 3, 0, 0],
                                "previousDensity": 100,
                                "nextDensity": 100
                            },
                            {
                                "knotPosition": [5000, 0, 0],
                                "previousHandlerPosition": [5000 / 3, 0, 0],
                                "previousDensity": 100,
                                "nextDensity": 100
                            }
                        ],
                        "headOffset": 50,
                        "tailOffset": 50
                    }];
                    testPage.waitForComponentDraw(flow);
                    runs(function () {
                        flowRepetition = flow.element.children[0].children[0].component;
                        testPage.waitForComponentDraw(flow);
                    });
                    runs(function () {
                        expect(cleanTextContent(flowRepetition.element)).toBe("0 1 2");
                    });
                });
            });

            describe("updating content", function () {
                it("should update the visible iterations but not delete iterations", function () {
                    var content = [],
                        i;

                    for (i = 0; i < 2; i++) {
                        content.push("(" + i + ")");
                    }
                    flow.content = content;
                    testPage.waitForComponentDraw(flowRepetition);
                    runs(function () {
                        expect(cleanTextContent(flowRepetition.element)).toBe("(0) (1)");
                        expect(flowRepetition.element.children.length).toBe(3);
                    });
                });
            });

            describe("scrolling", function () {
                it("should update and recycle the iterations as expected", function () {
                    var content = [],
                        i;

                    for (i = 0; i < 100; i++) {
                        content.push(i);
                    }
                    flow.content = content;
                    flow.scroll = 0;
                    testPage.waitForComponentDraw(flowRepetition);
                    runs(function () {
                        expect(cleanTextContent(flowRepetition.element)).toBe("0 1 2");
                        flow.scroll = 3;
                        testPage.waitForComponentDraw(flowRepetition);
                    });
                    runs(function () {
                        expect(cleanTextContent(flowRepetition.element)).toBe("3 1 2 4 5");
                        flow.scroll = 2;
                        testPage.waitForComponentDraw(flowRepetition);
                    });
                    runs(function () {
                        expect(cleanTextContent(flowRepetition.element)).toBe("3 1 2 4 0");
                        flow.scroll = 0;
                        testPage.waitForComponentDraw(flow);
                    });
                    runs(function () {
                        expect(cleanTextContent(flowRepetition.element)).toBe("3 1 2 4 0");
                        expect(flowRepetition.element.children.length).toBe(5);
                    });
                });
            });

            describe("handling resize", function () {
                it("should regenerate iterations and trim the excess", function () {
                    flow.handleResize();
                    testPage.waitForComponentDraw(flowRepetition);
                    runs(function () {
                        expect(cleanTextContent(flowRepetition.element)).toBe("0 1 2");
                        expect(flowRepetition.element.children.length).toBe(3);
                    });
                });
                it("after flow changes in size should update frustum culling and iterations", function () {
                    flow.element.style.width = "300px";
                    flow.handleResize();
                    testPage.waitForComponentDraw(flowRepetition);
                    runs(function () {
                        expect(cleanTextContent(flowRepetition.element)).toBe("0 1");
                        expect(flowRepetition.element.children.length).toBe(2);
                        flow.element.style.width = "500px";
                        flow.handleResize();
                        testPage.waitForComponentDraw(flowRepetition);
                    });
                    runs(function () {
                        expect(cleanTextContent(flowRepetition.element)).toBe("0 1 2");
                        expect(flowRepetition.element.children.length).toBe(3);
                    });
                });
            });

            describe("updating contentController", function () {
                it("should update the visible iterations", function () {
                    var content = [],
                        i;

                    rangeController = new RangeController();
                    for (i = 0; i < 100; i++) {
                        content.push("(" + i + ")");
                    }
                    flow.contentController = rangeController;
                    rangeController.content = content;
                    testPage.waitForComponentDraw(flowRepetition);
                    runs(function () {
                        expect(cleanTextContent(flowRepetition.element)).toBe("(0) (1) (2)");
                        expect(flowRepetition.element.children.length).toBe(3);
                    });
                });
            });

            describe("selection", function () {
                it("modifying controller's selection should update iterations", function () {
                    rangeController.selection = ["(1)"];
                    expect(cleanTextContent(flowRepetition.element)).toBe("(0) (1) (2)");
                    expect(flowRepetition.element.children[0].children[0].component.iteration.selected).toBeFalsy();
                    expect(flowRepetition.element.children[1].children[0].component.iteration.selected).toBeTruthy();
                    expect(flowRepetition.element.children[2].children[0].component.iteration.selected).toBeFalsy();
                    rangeController.selection = ["(2)"];
                    expect(flowRepetition.element.children[0].children[0].component.iteration.selected).toBeFalsy();
                    expect(flowRepetition.element.children[1].children[0].component.iteration.selected).toBeFalsy();
                    expect(flowRepetition.element.children[2].children[0].component.iteration.selected).toBeTruthy();
                });
                it("modifying iterations's selected should update controller's selection", function () {
                    flowRepetition.element.children[0].children[0].component.iteration.selected = true;
                    expect(rangeController.selection.toString()).toBe("(0)");
                });
                it("changes in controller's selection should be reflected in flow's selection", function () {
                    expect(flow.selection.toString()).toBe("(0)");
                });
                it("changes in flow's selection should be reflected in controller's selection", function () {
                    flow.selection = ["(1)"];
                    expect(rangeController.selection.toString()).toBe("(1)");
                });
                it("after scrolling enough to hide selected iteration, no iteration should be selected", function () {
                    flow.scroll = 50;
                    testPage.waitForComponentDraw(flowRepetition);
                    runs(function () {
                        expect(cleanTextContent(flowRepetition.element)).toBe("(48) (49) (50) (51) (52)");
                        expect(flowRepetition.element.children[0].children[0].component.iteration.selected).toBeFalsy();
                        expect(flowRepetition.element.children[1].children[0].component.iteration.selected).toBeFalsy();
                        expect(flowRepetition.element.children[2].children[0].component.iteration.selected).toBeFalsy();
                        expect(flowRepetition.element.children[3].children[0].component.iteration.selected).toBeFalsy();
                        expect(flowRepetition.element.children[4].children[0].component.iteration.selected).toBeFalsy();
                    });
                });
                it("iterations in selection should be selected after they enter in the frustum area", function () {
                    flow.scroll = 0;
                    testPage.waitForComponentDraw(flowRepetition);
                    runs(function () {
                        expect(cleanTextContent(flowRepetition.element)).toBe("(0) (1) (2) (51) (52)");
                        expect(flowRepetition.element.children[0].children[0].component.iteration.selected).toBeFalsy();
                        expect(flowRepetition.element.children[1].children[0].component.iteration.selected).toBeTruthy();
                        expect(flowRepetition.element.children[2].children[0].component.iteration.selected).toBeFalsy();
                        expect(flowRepetition.element.children[3].children[0].component.iteration.selected).toBeFalsy();
                        expect(flowRepetition.element.children[4].children[0].component.iteration.selected).toBeFalsy();
                    });
                });
            });
        });
    });
});
