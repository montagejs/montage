var Montage = require("montage").Montage,
    AbstractTextArea = require("montage/ui/base/abstract-text-area").AbstractTextArea,
    MockDOM = require("mocks/dom");

describe("test/base/abstract-text-area-spec", function () {

    describe("creation", function () {
        it("cannot be instantiated directly", function () {
            expect(function () {
                new AbstractTextArea();
            }).toThrow();
        });

        it("can be instantiated as a subtype", function () {
            var TextAreaSubtype = AbstractTextArea.specialize( {});
            var aTextAreaSubtype = null;
            expect(function () {
                aTextAreaSubtype = new TextAreaSubtype();
            }).not.toThrow();
            expect(aTextAreaSubtype).toBeDefined();
        });
    });

    describe("properties", function () {
        var TextArea = AbstractTextArea.specialize( {}),
            aTextArea;

        beforeEach(function () {
            aTextArea = new TextArea();
            aTextArea.element = MockDOM.element();
        });

        describe("value", function () {
            beforeEach(function () {
                aTextArea = new TextArea();
                aTextArea.element = MockDOM.element();
                aTextArea.enterDocument(true);
            });

            it("should be the value of the element when input is fired", function() {
                aTextArea.element.value = "A text";

                var anEvent = document.createEvent("CustomEvent");
                anEvent.initCustomEvent("input", true, true, null);
                aTextArea.element.dispatchEvent(anEvent);

                expect(aTextArea.value).toBe("A text");
            });

            it("should be the value of the element when change is fired", function() {
                aTextArea.element.value = "A text";

                var anEvent = document.createEvent("CustomEvent");
                anEvent.initCustomEvent("change", true, true, null);
                aTextArea.element.dispatchEvent(anEvent);

                expect(aTextArea.value).toBe("A text");
            });
        });

        describe("enabled", function () {
            beforeEach(function () {
                aTextArea = new TextArea();
                aTextArea.element = MockDOM.element();
            });

            it("should add the corresponding class name to classList when enabled is false", function() {
                aTextArea.enabled = false;

                expect(aTextArea.classList.contains("montage--disabled")).toBe(true);
            });
        });
    });

    describe("draw", function () {
        var TextArea = AbstractTextArea.specialize( {}),
            aTextArea;

        beforeEach(function () {
            aTextArea = new TextArea();
            aTextArea.element = MockDOM.element();
        });

        it("should be requested after enabled state is changed", function () {
            aTextArea.enabled = ! aTextArea.enabled;
            expect(aTextArea.needsDraw).toBeTruthy();
        });

        it("should be requested after value is changed", function () {
            aTextArea.value = "a text";
            expect(aTextArea.needsDraw).toBeTruthy();
        });

        it("should set the value on the element", function () {
            aTextArea.value = "a text";

            aTextArea.draw();

            expect(aTextArea.element.value).toBe(aTextArea.value);
        });
    });

    describe("events", function () {
        var TextArea = AbstractTextArea.specialize( {}),
            aTextArea, anElement, listener;

        beforeEach(function () {
            aTextArea = new TextArea();
            anElement = MockDOM.element();
            listener = {
                handleEvent: function() {}
            };
        });

        it("should listen for element input after enterDocument", function() {
            aTextArea.element = anElement;
            aTextArea.enterDocument(true);

            expect(aTextArea.element.hasEventListener("input", aTextArea)).toBe(true);
        });

        it("should listen for element change after enterDocument", function() {
            aTextArea.element = anElement;
            aTextArea.enterDocument(true);

            expect(aTextArea.element.hasEventListener("change", aTextArea)).toBe(true);
        });
    });
    describe("blueprint", function () {
        it("can be created", function () {
            var blueprintPromise = AbstractTextArea.blueprint;
            return blueprintPromise.then(function (blueprint) {
                expect(blueprint).not.toBeNull();
            });
        });
    });
});
