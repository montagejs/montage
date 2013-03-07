var Montage = require("montage").Montage;
var Component = require("montage/ui/component").Component;
var TestPageLoader = require("support/testpageloader").TestPageLoader;

var testPage = TestPageLoader.queueTest("active-target-test", function () {
    describe("events/active-target-spec", function () {

        it("should load", function () {
            expect(testPage.loaded).toBeTruthy();
        });

        var eventManager;

        beforeEach(function () {
            var testDocument = testPage.iframe.contentDocument,
                testApplication = testDocument.application;

            eventManager = testApplication.eventManager;
            eventManager.reset();
        });

        describe("selecting the activeTarget", function () {

            it("should focus on a target when a target's own element receives focus and the target accepts focus");
            it("should focus on a target when a target's own element receives mousedown and the target accepts focus");
            it("should focus on a target when a target's own element receives touchstart and the target accepts focus");

            it("should focus on a target when a child of a target that does not accept focus receives focus and the component accepts focus");
            it("should focus on a target when a child of a target that does not accept focus receives mousedown and the component accepts focus");
            it("should focus on a target when a child of a target that does not accept focus receives touchstart and the component accepts focus");

        });

        describe("dispatching focused events", function () {

            describe("using dispatchFocusedEvent")
            describe("using dispatchFocusedEventName")

        });

    });
});
