var Montage = require("montage").Montage;
var Component = require("montage/ui/component").Component;
var TestPageLoader = require("montage-testing/testpageloader").TestPageLoader;

TestPageLoader.queueTest("active-target-test/active-target-test", function(testPage) {
    describe("events/active-target-spec", function () {

        var testDocument;

        beforeEach(function () {
            testDocument = testPage.iframe.contentDocument;
        });

        describe("selecting the activeTarget", function () {

            var eventManager, proximalElement, proximalComponent;

            describe("when interaction starts on a proximal target that accepts focus", function () {

                beforeEach(function () {
                    proximalElement = testDocument.querySelector("[data-montage-id=C0C0B0]");
                    proximalComponent = proximalElement.component;
                    eventManager = proximalComponent.eventManager;

                    proximalElement.blur();
                    eventManager.activeTarget = null;
                });

                it("should focus on a target when a target's own element receives focus", function () {
                    proximalElement.focus();
                    expect(eventManager.activeTarget).toBe(proximalComponent);
                    expect(proximalComponent.isActiveTarget).toBeTruthy();
                });

                it("should focus on a target when a target's own element receives mousedown", function () {
                    testPage.mouseEvent({target: proximalElement}, "mousedown");
                    expect(eventManager.activeTarget).toBe(proximalComponent);
                    expect(proximalComponent.isActiveTarget).toBeTruthy();
                });

                //TODO well this will work for now, but this whole forking strategy will need to be rethought (euphemism intended)
                // The activation eventHandler still works in either/or mode for now
                if (window.Touch) {
                    it("should focus on a target when a target's own element receives touchstart", function () {
                        testPage.touchEvent({target: proximalElement}, "touchstart");
                        expect(eventManager.activeTarget).toBe(proximalComponent);
                        expect(proximalComponent.isActiveTarget).toBeTruthy();
                    });
                }

            });

            describe("when interaction starts on a proximal target that does not accept focus", function () {

                var activeElement, activeComponent;

                beforeEach(function () {
                    proximalElement = testDocument.querySelector("[data-montage-id=C0C0B0]");
                    proximalComponent = proximalElement.component;
                    proximalComponent.acceptsActiveTarget = false;

                    activeElement = testDocument.querySelector("[data-montage-id=C0C0]");
                    activeComponent = activeElement.component;

                    eventManager = proximalComponent.eventManager;

                    proximalElement.blur();
                    eventManager.activeTarget = null;
                });

                it("must not focus on the proximal target when the target receives focus", function () {
                    proximalElement.focus();
                    expect(proximalComponent.isActiveTarget).toBeFalsy();
                });

                it("should focus on some nextTarget that accepts focus when the proximal target receives focus", function () {
                    proximalElement.focus();
                    expect(eventManager.activeTarget).toBe(activeComponent);
                    expect(activeComponent.isActiveTarget).toBeTruthy();
                });

                it("must not focus on the proximal target when the target receives mousedown", function () {
                    testPage.mouseEvent({target: proximalElement}, "mousedown");
                    expect(proximalComponent.isActiveTarget).toBeFalsy();
                });

                it("should focus on some nextTarget that accepts focus when the proximal target receives mousedown", function () {
                    testPage.mouseEvent({target: proximalElement}, "mousedown");
                    expect(eventManager.activeTarget).toBe(activeComponent);
                    expect(activeComponent.isActiveTarget).toBeTruthy();
                });

                if (window.Touch) {
                    it("must not focus on the proximal target when the target receives touchstart", function () {
                        testPage.touchEvent({target: proximalElement}, "touchstart");
                        expect(proximalComponent.isActiveTarget).toBeFalsy();
                    });

                    it("should focus on some nextTarget that accepts focus when the proximal target receives touchstart", function () {
                        testPage.mouseEvent({target: proximalElement}, "touchstart");
                        expect(eventManager.activeTarget).toBe(activeComponent);
                        expect(activeComponent.isActiveTarget).toBeTruthy();
                    });
                }

            });

            describe("when a cycle is encountered while determining the activeTarget", function () {

                var eventManager;

                beforeEach(function () {
                    var proximalElement = testDocument.querySelector("[data-montage-id=C0C0B0]");
                    proximalComponent = proximalElement.component;

                    eventManager = proximalComponent.eventManager;
                });

                it("should return no activeTarget when encountering a self-referential cycle", function () {
                    var foo = Montage.create();
                    foo.nextTarget = foo;
                    expect(eventManager._findActiveTarget(foo)).toBeNull();
                });

                it("should return no activeTarget when encountering a distant cycle", function () {
                    var foo = Montage.create();
                    var bar = Montage.create();
                    foo.nextTarget = bar;
                    bar.nextTarget = foo;
                    expect(eventManager._findActiveTarget(foo)).toBeNull();
                });

            });

        });

        describe("dispatching focused events", function () {

            var testTarget, proximalComponent, eventManager;

            beforeEach(function () {
                testTarget = testDocument.defaultView.montageRequire("core/target").Target;
                var proximalElement = testDocument.querySelector("[data-montage-id=C0C0B0]");
                proximalComponent = proximalElement.component;

                eventManager = proximalComponent.eventManager;
                eventManager.activeTarget = proximalComponent;
            });

            describe("using dispatchEvent", function () {

                it("must have the activeTarget as the target of the event", function () {
                    var listener = {
                        handleFoo: function (evt) {
                            expect(evt.target).toBe(proximalComponent);
                        }
                    };

                    spyOn(listener, "handleFoo").andCallThrough();
                    proximalComponent.addEventListener("foo", listener);

                    var MutableEvent = testDocument.defaultView.montageRequire("core/event/mutable-event").MutableEvent;

                    eventManager.activeTarget.dispatchEvent(MutableEvent.fromType("foo", true, true));
                    expect(listener.handleFoo).toHaveBeenCalled();
                });

            });

            describe("using dispatchEventNamed", function () {

                it("must have the activeTarget as the target of the event", function () {
                    var listener = {
                        handleFoo: function (evt) {
                            expect(evt.target).toBe(proximalComponent);
                        }
                    };

                    spyOn(listener, "handleFoo").andCallThrough();
                    proximalComponent.addEventListener("foo", listener);

                    eventManager.activeTarget.dispatchEventNamed("foo", true, true);
                    expect(listener.handleFoo).toHaveBeenCalled();
                });

            });

        });

    });
});
