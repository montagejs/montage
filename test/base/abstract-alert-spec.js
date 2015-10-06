var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    AbstractAlert = require("montage/ui/base/abstract-alert").AbstractAlert,
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

AbstractAlert.prototype.hasTemplate = false;

describe("test/base/abstract-alert-spec", function () {
    describe("creation", function () {
        beforeEach(function () {
            setupMockRootComponent();
        });

        afterEach(function () {
            setdownMockRootComponent();
        });

        it("cannot be instantiated directly", function () {
            expect(function () {
                new AbstractAlert();
            }).toThrow();
        });

        it("can be instantiated as a subtype", function () {
            var AlertSubtype = AbstractAlert.specialize( {});
            var anAlertSubtype;
            expect(function () {
                anAlertSubtype = new AlertSubtype();
            }).not.toThrow();
            expect(anAlertSubtype).toBeDefined();
        });
    });
    describe("properties", function () {
        var Alert = AbstractAlert.specialize( {}),
            anAlert;
        beforeEach(function () {
            anAlert = new Alert();
            anAlert.element = MockDOM.element(_document);
            anAlert._overlay = MockComponent.component();
            anAlert._overlay.show = function (){};
            anAlert._overlay.hide = function (){};
            anAlert._okButton = MockComponent.component();
        });

        describe("show", function () {
            it("should return a promise for the user action", function () {
                var promise = anAlert.show();

                expect(Promise.is(promise)).toBeTruthy();
            });

            it("should return the same promise for the user action when show is asked twice without any user action", function () {
                var anotherPromise = anAlert.show();
                var promise = anAlert.show();

                expect(promise).toBe(anotherPromise);
            });
        });

        describe("user action", function () {
            it("should resolve the user action promise when the ok button is pressed", function () {
                var event = {target: anAlert._okButton},
                    promise = anAlert.show();

                anAlert.handleAction(event);
                expect(promise.isFulfilled()).toBeTruthy();
            })
        });

        describe("static show", function () {
            var AlertSubtype;

            beforeEach(function () {
                setupMockRootComponent();
                AlertSubtype = AbstractAlert.specialize({});
            });

            afterEach(function () {
                setdownMockRootComponent();
            });

            it("should create an instance to show the alert", function () {
                AlertSubtype.show("message");
                expect(AlertSubtype._instance).toBeDefined();
            });

            it("should create an instance to show the alert and add it to the document", function () {
                AlertSubtype.show("message");

                expect(AlertSubtype._instance.element).toBeDefined();

                expect(AlertSubtype._instance.element.parentNode)
                    .toBe(_document.body);
            });

            it("should create an instance to show the alert and add it to the component tree", function () {
                AlertSubtype.show("message");

                expect(AlertSubtype._instance.parentComponent)
                    .toBe(_document.rootComponent);
            });

            it("should create an instance to show the alert and add request it to draw", function () {
                AlertSubtype.show("message");

                expect(AlertSubtype._instance.needsDraw).toBeTruthy();
            });

            it("should return a promise of user action", function () {
                var promise = AlertSubtype.show("message");

                expect(Promise.is(promise)).toBeTruthy();
            });

            it("should configure the alert with the message upon entering the document", function () {
                AlertSubtype.show("message");

                AlertSubtype._instance._overlay = MockComponent.component();
                AlertSubtype._instance._overlay.show = function (){};
                AlertSubtype._instance._overlay.hide = function (){};
                AlertSubtype._instance._okButton = MockComponent.component();
                AlertSubtype._instance.enterDocument(true);

                spyOn(AlertSubtype._instance, "show").andCallThrough();

                waitsFor(function () {
                    return AlertSubtype._instance.show.calls.length === 1;
                });
                runs(function () {
                    expect(AlertSubtype._instance.message).toBe("message");
                });
            });

            it("should configure the alert with the title upon entering the document", function () {
                AlertSubtype.show("message", "a title");

                AlertSubtype._instance._overlay = MockComponent.component();
                AlertSubtype._instance._overlay.show = function (){};
                AlertSubtype._instance._overlay.hide = function (){};
                AlertSubtype._instance._okButton = MockComponent.component();
                AlertSubtype._instance.enterDocument(true);

                spyOn(AlertSubtype._instance, "show").andCallThrough();

                waitsFor(function () {
                    return AlertSubtype._instance.show.calls.length === 1;
                });
                runs(function () {
                    expect(AlertSubtype._instance.title).toBe("a title");
                });
            });

            it("should configure the alert with the next title when the current alert is closed", function () {
                AlertSubtype.show("message", "a title");
                AlertSubtype.show("another message", "another title");

                AlertSubtype._instance._overlay = MockComponent.component();
                AlertSubtype._instance._overlay.show = function (){};
                AlertSubtype._instance._overlay.hide = function (){};
                AlertSubtype._instance._okButton = MockComponent.component();
                AlertSubtype._instance.enterDocument(true);

                spyOn(AlertSubtype._instance, "show").andCallThrough();

                waitsFor(function () {
                    return AlertSubtype._instance.show.calls.length === 1;
                });
                runs(function () {
                    AlertSubtype._instance.handleAction({target: AlertSubtype._instance._okButton});

                    waitsFor(function () {
                        return AlertSubtype._instance.show.calls.length === 2;
                    });

                    runs(function () {
                        expect(AlertSubtype._instance.title).toBe("another title");
                    });
                });
            });

            it("should configure the alert with the default message when the current alert is closed", function () {
                AlertSubtype.show("message", "a title");
                AlertSubtype.show("another message");

                AlertSubtype._instance._overlay = MockComponent.component();
                AlertSubtype._instance._overlay.show = function (){};
                AlertSubtype._instance._overlay.hide = function (){};
                AlertSubtype._instance._okButton = MockComponent.component();
                AlertSubtype._instance.enterDocument(true);

                spyOn(AlertSubtype._instance, "show").andCallThrough();

                waitsFor(function () {
                    return AlertSubtype._instance.show.calls.length === 1;
                });
                runs(function () {
                    AlertSubtype._instance.handleAction({target: AlertSubtype._instance._okButton});

                    waitsFor(function () {
                        return AlertSubtype._instance.show.calls.length === 2;
                    });

                    runs(function () {
                        expect(AlertSubtype._instance.title).toBe(AlertSubtype.prototype.title);
                    });
                });
            });

            it("should fulfill the show promise when the alert is closed", function () {
                var promise = AlertSubtype.show("message");

                AlertSubtype._instance._overlay = MockComponent.component();
                AlertSubtype._instance._overlay.show = function (){};
                AlertSubtype._instance._overlay.hide = function (){};
                AlertSubtype._instance._okButton = MockComponent.component();
                AlertSubtype._instance.enterDocument(true);

                spyOn(AlertSubtype._instance, "show").andCallThrough();

                waitsFor(function () {
                    return AlertSubtype._instance.show.calls.length === 1;
                });
                runs(function () {
                    AlertSubtype._instance.handleAction({target: AlertSubtype._instance._okButton});

                    expect(promise.isFulfilled()).toBeTruthy();
                });
            });
        });
    });

    describe("blueprint", function () {
        it("can be created", function () {
            var blueprintPromise = AbstractAlert.blueprint;
            return blueprintPromise.then(function (blueprint) {
                expect(blueprint).not.toBeNull();
            });
        });
    });
});
