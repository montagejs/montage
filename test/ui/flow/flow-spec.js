var Montage = require("montage").Montage;
var TestPageLoader = require("montage-testing/testpageloader").TestPageLoader;

TestPageLoader.queueTest("flow-test", function(testPage) {

    describe("ui/flow/flow-spec", function() {
        it("should load", function() {
            expect(testPage.loaded).toBe(true);
        });

        describe("Flow", function() {
            var flow;

            beforeEach(function () {
                flow = testPage.test.flow;
            });

            it("can be created", function() {
                expect(testPage.test.flow).toBeDefined();
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

        });
    });
});
