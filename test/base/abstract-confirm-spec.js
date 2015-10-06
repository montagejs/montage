var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    AbstractConfirm = require("montage/ui/base/abstract-confirm").AbstractConfirm,
    Promise = require("montage/core/promise").Promise,
    MockDOM = require("mocks/dom"),
    MockComponent = require("mocks/component"),
    _document,
    originalRootComponentPropertyDescriptor,
    WAITS_FOR_TIMEOUT = 2500;

_document = MockDOM.document();

function setupMockRootComponent() {
    originalRootComponentPropertyDescriptor = Object.getOwnPropertyDescriptor(Component.prototype, "rootComponent");
    Object.defineProperty(Component.prototype, "rootComponent", {
        value: _document.rootComponent,
        configurable: true
    });
}

function setdownMockRootComponent() {
    Object.defineProperty(Component.prototype, "rootComponent", originalRootComponentPropertyDescriptor);
}

AbstractConfirm.prototype.hasTemplate = false;

describe("test/base/abstract-confirm-spec", function () {
    describe("creation", function () {
        it("cannot be instantiated directly", function () {
            expect(function () {
                new AbstractConfirm();
            }).toThrow();
        });
        it("can be instantiated as a subtype", function () {
            var ConfirmSubtype = AbstractConfirm.specialize( {});
            var aConfirmSubtype;
            expect(function () {
                aConfirmSubtype = new ConfirmSubtype();
            }).not.toThrow();
            expect(aConfirmSubtype).toBeDefined();
        });
    });
    describe("properties", function () {
        var Confirm = AbstractConfirm.specialize( {}),
            aConfirm;

        beforeEach(function () {
            setupMockRootComponent();
            aConfirm = new Confirm();
            aConfirm.element = MockDOM.element(_document);
            aConfirm._overlay = MockComponent.component();
            aConfirm._overlay.show = function (){};
            aConfirm._overlay.hide = function (){};
            aConfirm._okButton = MockComponent.component();
            aConfirm._cancelButton = MockComponent.component();
        });

        afterEach(function () {
            setdownMockRootComponent();
        });

        describe("show", function () {
            it("should return a promise for the user action", function () {
                var promise = aConfirm.show();

                expect(Promise.is(promise)).toBeTruthy();
            });

            it("should return the same promise for the user action when show is asked twice without any user action", function () {
                var anotherPromise = aConfirm.show();
                var promise = aConfirm.show();

                expect(promise).toBe(anotherPromise);
            });
        });

        describe("user action", function () {
            it("should resolve the user action promise when the ok button is pressed", function () {
                var event = {target: aConfirm._okButton},
                    promise = aConfirm.show();

                aConfirm.handleAction(event);
                expect(promise.isFulfilled()).toBeTruthy();
            });

            it("should resolve the user action promise to 'ok' when the ok button is pressed", function () {
                var event = {target: aConfirm._okButton},
                    promise = aConfirm.show();

                aConfirm.handleAction(event);

                return promise.then(function (buttonPressed) {
                    expect(buttonPressed).toBe(Confirm.OKButton);
                });
            });

            it("should resolve the user action promise when the cancel button is pressed", function () {
                var event = {target: aConfirm._cancelButton},
                    promise = aConfirm.show();

                aConfirm.handleAction(event);
                expect(promise.isFulfilled()).toBeTruthy();
            });

            it("should resolve the user action promise to 'cancel' when the ok button is pressed", function () {
                var event = {target: aConfirm._cancelButton},
                    promise = aConfirm.show();

                aConfirm.handleAction(event);

                return promise.then(function (buttonPressed) {
                    expect(buttonPressed).toBe(Confirm.CancelButton);
                });
            });
        });
    });

    describe("static show", function () {
        var ConfirmSubtype;

        beforeEach(function () {
            setupMockRootComponent();
            ConfirmSubtype = AbstractConfirm.specialize({});
        });

        afterEach(function () {
            setdownMockRootComponent();
        });

        it("should create an instance to show the alert", function () {
            ConfirmSubtype.show("message");
            expect(ConfirmSubtype._instance).toBeDefined();
        });

        it("should configure the confirm okLabel with the ok label upon entering the document", function () {
            ConfirmSubtype.show("Question", "Title", "Okay");

            ConfirmSubtype._instance._overlay = MockComponent.component();
            ConfirmSubtype._instance._overlay.show = function (){};
            ConfirmSubtype._instance._overlay.hide = function (){};
            ConfirmSubtype._instance._okButton = MockComponent.component();
            ConfirmSubtype._instance._cancelButton = MockComponent.component();
            ConfirmSubtype._instance.enterDocument(true);

            spyOn(ConfirmSubtype._instance, "show").andCallThrough();

            waitsFor(function () {
                return ConfirmSubtype._instance.show.calls.length === 1;
            });
            runs(function () {
                expect(ConfirmSubtype._instance.okLabel).toBe("Okay");
            });
        });

        it("should configure the confirm cancelLabel with the cancel label upon entering the document", function () {
            ConfirmSubtype.show("Question", "Title", "Okay", "Nay");

            ConfirmSubtype._instance._overlay = MockComponent.component();
            ConfirmSubtype._instance._overlay.show = function (){};
            ConfirmSubtype._instance._overlay.hide = function (){};
            ConfirmSubtype._instance._okButton = MockComponent.component();
            ConfirmSubtype._instance._cancelButton = MockComponent.component();
            ConfirmSubtype._instance.enterDocument(true);

            spyOn(ConfirmSubtype._instance, "show").andCallThrough();

            waitsFor(function () {
                return ConfirmSubtype._instance.show.calls.length === 1;
            });
            runs(function () {
                expect(ConfirmSubtype._instance.cancelLabel).toBe("Nay");
            });
        });

        it("should configure the confirm okButton with the next ok button label when the current alert is closed", function () {
            ConfirmSubtype.show("message", "a title", "Okay");
            ConfirmSubtype.show("another message", "another title", "Yap");

            ConfirmSubtype._instance._overlay = MockComponent.component();
            ConfirmSubtype._instance._overlay.show = function (){};
            ConfirmSubtype._instance._overlay.hide = function (){};
            ConfirmSubtype._instance._okButton = MockComponent.component();
            ConfirmSubtype._instance._cancelButton = MockComponent.component();
            ConfirmSubtype._instance.enterDocument(true);

            spyOn(ConfirmSubtype._instance, "show").andCallThrough();

            waitsFor(function () {
                return ConfirmSubtype._instance.show.calls.length === 1;
            });
            runs(function () {
                ConfirmSubtype._instance.handleAction({target: ConfirmSubtype._instance._okButton});

                waitsFor(function () {
                    return ConfirmSubtype._instance.show.calls.length === 2;
                });

                runs(function () {
                    expect(ConfirmSubtype._instance.okLabel).toBe("Yap");
                });
            });
        });

        it("should configure the confirm cancelButton with the next cancel button label when the current alert is closed", function () {
            ConfirmSubtype.show("message", "a title", "Okay", "Nay");
            ConfirmSubtype.show("another message", "another title", "Yap", "Nope");

            ConfirmSubtype._instance._overlay = MockComponent.component();
            ConfirmSubtype._instance._overlay.show = function (){};
            ConfirmSubtype._instance._overlay.hide = function (){};
            ConfirmSubtype._instance._okButton = MockComponent.component();
            ConfirmSubtype._instance._cancelButton = MockComponent.component();
            ConfirmSubtype._instance.enterDocument(true);

            spyOn(ConfirmSubtype._instance, "show").andCallThrough();

            waitsFor(function () {
                return ConfirmSubtype._instance.show.calls.length === 1;
            });
            runs(function () {
                ConfirmSubtype._instance.handleAction({target: ConfirmSubtype._instance._okButton});

                waitsFor(function () {
                    return ConfirmSubtype._instance.show.calls.length === 2;
                });

                runs(function () {
                    expect(ConfirmSubtype._instance.cancelLabel).toBe("Nope");
                });
            });
        });

        it("should configure the confirm okButton with the default label when the current alert is closed", function () {
            ConfirmSubtype.show("message", "a title", "Okay", "Nay");
            ConfirmSubtype.show("another message", "another title");

            ConfirmSubtype._instance._overlay = MockComponent.component();
            ConfirmSubtype._instance._overlay.show = function (){};
            ConfirmSubtype._instance._overlay.hide = function (){};
            ConfirmSubtype._instance._okButton = MockComponent.component();
            ConfirmSubtype._instance._cancelButton = MockComponent.component();
            ConfirmSubtype._instance.enterDocument(true);

            spyOn(ConfirmSubtype._instance, "show").andCallThrough();

            waitsFor(function () {
                return ConfirmSubtype._instance.show.calls.length === 1;
            });
            runs(function () {
                ConfirmSubtype._instance.handleAction({target: ConfirmSubtype._instance._okButton});

                waitsFor(function () {
                    return ConfirmSubtype._instance.show.calls.length === 2;
                });

                runs(function () {
                    expect(ConfirmSubtype._instance.okButton).toBe(ConfirmSubtype.prototype.okButton);
                });
            });
        });

        it("should configure the confirm cancelButton with the default label when the current alert is closed", function () {
            ConfirmSubtype.show("message", "a title", "Okay", "Nay");
            ConfirmSubtype.show("another message", "another title");

            ConfirmSubtype._instance._overlay = MockComponent.component();
            ConfirmSubtype._instance._overlay.show = function (){};
            ConfirmSubtype._instance._overlay.hide = function (){};
            ConfirmSubtype._instance._okButton = MockComponent.component();
            ConfirmSubtype._instance._cancelButton = MockComponent.component();
            ConfirmSubtype._instance.enterDocument(true);

            spyOn(ConfirmSubtype._instance, "show").andCallThrough();

            waitsFor(function () {
                return ConfirmSubtype._instance.show.calls.length === 1;
            });
            runs(function () {
                ConfirmSubtype._instance.handleAction({target: ConfirmSubtype._instance._okButton});

                waitsFor(function () {
                    return ConfirmSubtype._instance.show.calls.length === 2;
                });

                runs(function () {
                    expect(ConfirmSubtype._instance.cancelLabel).toBe(ConfirmSubtype.prototype.cancelLabel);
                });
            });
        });
    });

    describe("blueprint", function () {
        it("can be created", function () {
            var blueprintPromise = AbstractConfirm.blueprint;
            return blueprintPromise.then(function (blueprint) {
                expect(blueprint).not.toBeNull();
            });
        });
    });
});
