var Montage = require("montage/core/core").Montage,
    MontageSerializer = require("montage/core/serialization/serializer/montage-serializer").MontageSerializer,
    objects = require("spec/serialization/testobjects-v2").objects,
    ModuleReference = require("montage/core/module-reference").ModuleReference,
    Alias = require("montage/core/serialization/alias").Alias;

    function fakeGetSerializablePropertyNames(object, returnValues) {
        getSerializablePropertyNames = Montage.getSerializablePropertyNames;

        spyOn(Montage, "getSerializablePropertyNames").and.callFake(function (obj) {
            if (obj === object) {
                return returnValues;
            } else {
                return getSerializablePropertyNames.apply(Montage, arguments);
            }
        });
    }

    function createFakeElement(id) {
        var isElement = Element.isElement,
            element = {
                getAttribute: function (attributeName) {
                    if (attributeName === "data-montage-id") {
                        return id;
                    }
                }
            };

        spyOn(Element, "isElement").and.callFake(function (obj) {
            if (obj === element) {
                return true;
            } else {
                return isElement.apply(Element, arguments);
            }
        });

        return element;
    }

    function createFakeModuleReference(id, _require) {
        return new ModuleReference().initWithIdAndRequire(id, _require || require);
    }

describe("spec/serialization/montage-serializer-element-spec", function () {

    var serializer;
    var originalUnits;

    beforeEach(function () {
        originalUnits = MontageSerializer._units;
        MontageSerializer._units = {};
        serializer = new MontageSerializer().initWithRequire(require);
        serializer.setSerializationIndentation(4);
    });

    afterEach(function () {
        MontageSerializer._units = originalUnits;
    });

    describe("elements", function () {
        it("should serialize an element", function () {
            var object = createFakeElement("id"),
                serialization,
                expectedSerialization;

            expectedSerialization = {
                root: {
                    value: {"#": "id"}
                }
            };

            serialization = serializer.serializeObject(object);
            expect(JSON.parse(serialization))
            .toEqual(expectedSerialization);
        });

        it("should serialize an element as an object property", function () {
            var object = new objects.OneProp(),
                element = createFakeElement("id"),
                serialization,
                expectedSerialization;

            expectedSerialization = {
                root: {
                    prototype: "spec/serialization/testobjects-v2[OneProp]",
                    values: {
                        identifier: null,
                        prop: {"#": "id"}
                    }
                }
            };

            object.prop = element;

            serialization = serializer.serializeObject(object);

            expect(JSON.parse(serialization))
            .toEqual(expectedSerialization);
        });

        it("should serialize an element multiple times", function () {
            var object = new objects.TwoProps(),
                element = createFakeElement("id"),
                serialization,
                expectedSerialization;

            expectedSerialization = {
                root: {
                    prototype: "spec/serialization/testobjects-v2[TwoProps]",
                    values: {
                        identifier: null,
                        prop1: {"#": "id"},
                        prop2: {"#": "id"}
                    }
                }
            };

            object.prop1 = element;
            object.prop2 = element;

            serialization = serializer.serializeObject(object);
            expect(JSON.parse(serialization))
            .toEqual(expectedSerialization);
        });

        it("should serialize an element from a different document", function () {
            var context = createJavaScriptContext(),
                object = context.document.createElement("div"),
                serialization,
                expectedSerialization;

            expectedSerialization = {
                root: {
                    value: {"#": "id"}
                }
            };

            object.setAttribute("data-montage-id", "id");

            serialization = serializer.serializeObject(object);

            expect(JSON.parse(serialization))
            .toEqual(expectedSerialization);
        });
    });
});