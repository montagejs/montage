var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    logger = require("montage/core/logger").logger("deserializer-spec"),
    Deserializer = require("montage/core/serialization/deserializer/montage-deserializer").MontageDeserializer,
    deserialize = require("montage/core/serialization/deserializer/montage-deserializer").deserialize,
    Alias = require("montage/core/serialization/alias").Alias,
    Bindings = require("montage/frb"),
    defaultEventManager = require("montage/core/event/event-manager").defaultEventManager,
    Promise = require("montage/core/promise").Promise,
    objects = require("spec/serialization/testobjects-v2").objects;

logger.isError = true;

describe("serialization/montage-deserializer-element-spec", function () {
    var deserializer;

    beforeEach(function () {
        deserializer = new Deserializer();
    });

    describe("Element Reference Deserialization", function () {
        var rootEl = document.createElement("div");

        it("should deserialize an element reference", function (done) {
            var serialization = {
                    "rootEl": {
                        "value": {"#": "id"}
                    }
                },
                serializationString = JSON.stringify(serialization);

            rootEl.innerHTML = '<div data-montage-id="id">content</div>';
            deserializer.init(
                serializationString, require);

            deserializer.deserialize(null, rootEl).then(function (objects) {
                expect(objects.rootEl instanceof Element).toBe(true);
                expect(objects.rootEl.textContent).toBe("content");
            }).finally(function () {
                done();
            });

            //for (var i = 0; i < 3; i++) {
            //    deserializer.deserializeObjectWithElement(rootEl, function (object) {
            //        expect(object.element instanceof Element).toBe(true);
            //        expect(object.element.textContent).toBe("content");
            //    });
            //}
        });

        it("should deserialize an element reference and add event listeners", function (done) {
            var serialization = {
                    "rootEl": {
                        "value": {"#": "id"},
                        "listeners": [
                            {
                                "type": "click",
                                "listener": {"@": "rootEl"}
                            }
                        ]
                    }
                },
                serializationString = JSON.stringify(serialization);

            rootEl.innerHTML = '<div data-montage-id="id">content</div>';
            deserializer.init(serializationString, require);

            deserializer.deserialize(null, rootEl).then(function (objects) {
                expect(defaultEventManager._registeredBubbleEventListeners.has("click")).toBe(true);
                var registeredEventListeners = defaultEventManager._registeredBubbleEventListeners.get("click");
                var proxyElement = registeredEventListeners.keysArray()[0];
                return new Promise(function (resolve) {
                    expect(proxyElement).toBeTruthy();
                    objects.rootEl.addEventListener("action", function () {
                        resolve();
                    });
                    proxyElement.dispatchEvent.call(proxyElement, new CustomEvent("action"));
                }).timeout(500);
            }).catch(function (err) {
                fail(err);
            }).finally(function () {
                done();
            });
        });

        it("should deserialize an element reference and set its values/bindings", function (done) {
            var serialization = {
                "rootEl": {
                    "value": { "#": "id" },
                    "values": {
                        "foo": 42,
                        "bar": {
                            "<-": "@rootEl.foo + 58"
                        }
                    }
                }
            },
                serializationString = JSON.stringify(serialization);

            rootEl.innerHTML = '<div data-montage-id="id">content</div>';
            deserializer.init(serializationString, require);

            deserializer.deserialize(null, rootEl).then(function (objects) {
                expect(objects.rootEl instanceof Element).toBe(true);
                expect(objects.rootEl.foo).toBe(42);
                expect(objects.rootEl.bar).toBe(100);
            }).finally(function () {
                done();
            });
        });

        it("should deserialize an element reference and set its classNames", function (done) {
            var serialization = {
                "rootEl": {
                    "value": { "#": "id" },
                    "values": {
                        "foo": true,
                        "classList.has('foo')": {
                            "<-": "@rootEl.foo"
                        }
                    }
                }
            },
                serializationString = JSON.stringify(serialization);

            rootEl.innerHTML = '<div data-montage-id="id">content</div>';
            deserializer.init(serializationString, require);

            deserializer.deserialize(null, rootEl).then(function (objects) {
                expect(objects.rootEl instanceof Element).toBe(true);
                expect(objects.rootEl.classList.contains('foo')).toBe(true);
            }).finally(function () {
                done();
            });
        });

        it("should deserialize an element reference and set properties as attributes", function (done) {
            var serialization = {
                "rootEl": {
                    "value": { "#": "id" },
                    "values": {
                        "foo": 42,
                        "qux": "bar",
                        "dataset.foo": { "=": "'montage'" },
                        "quuz": { "<->": "foo" },
                        "baz": { "<->": "quux" }
                    }
                }
            },
                serializationString = JSON.stringify(serialization);

            rootEl.innerHTML = '<div data-montage-id="id">content</div>';
            deserializer.init(serializationString, require);

            deserializer.deserialize(null, rootEl).then(function (objects) {
                expect(objects.rootEl instanceof Element).toBe(true);
                expect(objects.rootEl.getAttribute('foo')).toBe('42');
                expect(objects.rootEl.getAttribute('qux')).toBe('bar');
                expect(objects.rootEl.dataset.foo).toBe('montage');
                expect(objects.rootEl.foo).toBe(42);
                expect(objects.rootEl.quuz).toBe(42);
                objects.rootEl.foo = 0;
                expect(objects.rootEl.foo).toBe(0);
                expect(objects.rootEl.quuz).toBe(0);
                expect(objects.rootEl.getAttribute('foo')).toBe('0');
                expect(objects.rootEl.getAttribute('baz')).toBe(null);
                expect(objects.rootEl.qux).toBe('bar');
            }).finally(function () {
                done();
            });
        });

        it("should deserialize a custom element reference and set properties", function (done) {
            if (typeof document.defaultView.Reflect !== 'undefined') {
                var serialization = {
                    "rootEl": {
                        "value": { "#": "id" },
                        "values": {
                            "name": "World",
                            "defaultGreeting": "Hello",
                            "greeting": { "<-": "defaultGreeting" }
                        }
                    }
                },
                    serializationString = JSON.stringify(serialization),
                    constructor = function () {
                        return Reflect.construct(
                            HTMLElement, [], constructor
                        );
                    };;

                Object.setPrototypeOf(constructor.prototype, HTMLElement.prototype);
                Object.setPrototypeOf(constructor, HTMLElement);
                Object.defineProperty(constructor, 'observedAttributes', {
                    get: function () {
                        return ['name', 'greeting'];
                    }
                });

                constructor.prototype.attributeChangedCallback = function (attr, oldValue, newValue) {
                    if (attr == 'name' || attr == 'greeting') {
                        this.textContent = this.greeting + ", " + this.name;
                    }
                };

                document.defaultView.customElements.define('hello-element', constructor);

                rootEl.innerHTML = '<hello-element data-montage-id="id"></hello-element>';
                deserializer.init(serializationString, require);

                deserializer.deserialize(null, rootEl).then(function (objects) {
                    expect(objects.rootEl instanceof Element).toBe(true);
                    expect(objects.rootEl.name).toBe('World');
                    expect(objects.rootEl.getAttribute('name')).toBe('World');
                    expect(objects.rootEl.textContent).toBe('Hello, World');
                    objects.rootEl.name = 'Montage';
                    expect(objects.rootEl.textContent).toBe('Hello, Montage');
                    expect(objects.rootEl.getAttribute('name')).toBe('Montage');
                    objects.rootEl.defaultGreeting = 'Bonjour';
                    expect(objects.rootEl.textContent).toBe('Bonjour, Montage');
                }).finally(function () {
                    done();
                });
            }
        });
    });

    xdescribe("Object Element Deserialization", function () {
        var rootEl = document.createElement("div");

        it("should deserialize an element reference through data-montage-id over id", function () {
           rootEl.innerHTML = '<div id="id">content1</div>' +
                            '<div data-montage-id="id">content2</div>';

           deserializer.init({
               rootEl: {
                   value: {
                       "element": {"#": "id"}
                   }
               }
           });

           for (var i = 0; i < 3; i++) {
               deserializer.deserializeObjectWithElement(rootEl, function (object) {
                   expect(object.element instanceof Element).toBe(true);
                   expect(object.element.textContent).toBe("content2");
               });
           }
        });

        it("should deserialize an element with id and data-montage-id", function () {
           rootEl.innerHTML = '<div id="realId" data-montage-id="id">content</div>';
           deserializer.init({
               rootEl: {
                   value: {
                       "element": {"#": "id"}
                   }
               }
           });

           for (var i = 0; i < 3; i++) {
               deserializer.deserializeObjectWithElement(rootEl, function (object) {
                   expect(object.element instanceof Element).toBe(true);
                   expect(object.element.textContent).toBe("content");
               });
           }
        });

        it("should deserialize an element with the same id and data-montage-id", function () {
           rootEl.innerHTML = '<div id="id" data-montage-id="id">content</div>';
           deserializer.init({
               rootEl: {
                   value: {
                       "element": {"#": "id"}
                   }
               }
           });

           for (var i = 0; i < 3; i++) {
               deserializer.deserializeObjectWithElement(rootEl, function (object) {
                   expect(object.element instanceof Element).toBe(true);
                   expect(object.element.textContent).toBe("content");
               });
           }
        });

        it("should deserialize an element reference through id w/ optimization", function () {
           rootEl.innerHTML = '<div id="id">content</div>';
           deserializer.init({
               rootEl: {
                   value: {
                       "element": {"#": "id"}
                   }
               }
           });
           deserializer.optimizeForDocument(rootEl);

           for (var i = 0; i < 3; i++) {
               deserializer.deserializeObjectWithElement(rootEl, function (object) {
                   expect(object.element instanceof Element).toBe(true);
                   expect(object.element.textContent).toBe("content");
                   expect(object.element.getAttribute("id")).toBe("id");
               });
           }
        });

        it("should deserialize an element reference through data-montage-id w/ optimization", function () {
           rootEl.innerHTML = '<div data-montage-id="id">content</div>';
           deserializer.init({
               rootEl: {
                   value: {
                       "element": {"#": "id"}
                   }
               }
           });
           deserializer.optimizeForDocument(rootEl);

           for (var i = 0; i < 3; i++) {
               deserializer.deserializeObjectWithElement(rootEl, function (object) {
                   expect(object.element instanceof Element).toBe(true);
                   expect(object.element.textContent).toBe("content");
                   expect(object.element.getAttribute("id")).toBeNull();
               });
           }
        });

        it("should deserialize an element reference through data-montage-id over id w/ optimization", function () {
           rootEl.innerHTML = '<div id="id">content1</div>' +
                            '<div data-montage-id="id">content2</div>';
           deserializer.init({
               rootEl: {
                   value: {
                       "element": {"#": "id"}
                   }
               }
           });
           deserializer.optimizeForDocument(rootEl);

           for (var i = 0; i < 3; i++) {
               deserializer.deserializeObjectWithElement(rootEl, function (object) {
                   expect(object.element instanceof Element).toBe(true);
                   expect(object.element.textContent).toBe("content2");
                   expect(object.element.getAttribute("id")).toBeNull();
               });
           }
        });

        it("should deserialize an element with id and data-montage-id w/ optimization", function () {
           rootEl.innerHTML = '<div id="realId" data-montage-id="id">content</div>';
           deserializer.init({
               rootEl: {
                   value: {
                       "element": {"#": "id"}
                   }
               }
           });
           deserializer.optimizeForDocument(rootEl);

           for (var i = 0; i < 3; i++) {
               deserializer.deserializeObjectWithElement(rootEl, function (object) {
                   expect(object.element instanceof Element).toBe(true);
                   expect(object.element.textContent).toBe("content");
                   expect(object.element.getAttribute("id")).toBe("realId");
               });
           }
        });

        it("should deserialize an element with the same id and data-montage-id w/ optimization", function () {
           rootEl.innerHTML = '<div id="id" data-montage-id="id">content</div>';
           deserializer.init({
               rootEl: {
                   value: {
                       "element": {"#": "id"}
                   }
               }
           });
           deserializer.optimizeForDocument(rootEl);

           for (var i = 0; i < 3; i++) {
               deserializer.deserializeObjectWithElement(rootEl, function (object) {
                   expect(object.element instanceof Element).toBe(true);
                   expect(object.element.textContent).toBe("content");
                   expect(object.element.getAttribute("id")).toBe("id");
               });
           }
        });
    });
});
