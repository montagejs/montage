var Montage = require("montage").Montage;
var TestPageLoader = require("montage-testing/testpageloader").TestPageLoader;

TestPageLoader.queueTest("../../../../ui/text-field.info/sample/index", function (testPage) {
    describe("text-field.info/test/converter", function () {
        var testDocument;

        beforeEach(function () {
            testDocument = testPage.iframe.contentDocument;
        });

        describe("selecting the activeTarget", function () {
            var eventManager, proximalElement, proximalComponent;

            describe("when interaction starts on a proximal target that accepts focus", function () {
                beforeEach(function () {
                    numberFieldElement = testDocument.querySelector("[data-montage-id=number-field]");
                    numberFieldComponent = proximalElement.component;
                    eventManager = proximalComponent.eventManager;

                    numberFieldElement.blur();
                    eventManager.activeTarget = null;
                });

                xit("should focus on a target when a target's own element receives focus", function () {
                    proximalElement.focus();
                    expect(eventManager.activeTarget).toBe(proximalComponent);
                    expect(proximalComponent.isActiveTarget).toBeTruthy();
                });

                if (!window.PointerEvent && !(window.MSPointerEvent && window.navigator.msPointerEnabled)) {
                    it("should focus on a target when a target's own element receives touchstart", function () {
                        testPage.touchEvent({target: proximalElement}, "touchstart");
                        expect(eventManager.activeTarget).toBe(proximalComponent);
                        expect(proximalComponent.isActiveTarget).toBeTruthy();
                    });

                    it("should focus on a target when a target's own element receives mousedown", function () {
                        testPage.mouseEvent({target: proximalElement}, "mousedown");
                        expect(eventManager.activeTarget).toBe(proximalComponent);
                        expect(proximalComponent.isActiveTarget).toBeTruthy();
                    });
                }

            });

        });

    });
});
