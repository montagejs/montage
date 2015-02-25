var Alias = require("montage/core/serialization/alias").Alias,
    Promise = require("montage/core/promise").Promise;

describe("serialization/alias-spec", function () {
    var alias;

    beforeEach(function () {
        alias = new Alias();
    });

    describe("Template Property Alias", function () {
        describe("invalid alias syntax", function () {
            it("should reject invalid component name", function () {
                expect(function () {
                    alias.value = "componentMissingAt:propertyName";
                }).toThrow();
            });

            it("should reject missing property name", function () {
                expect(function () {
                    alias.value = "@component";
                }).toThrow();
            });

            it("should reject a template property with path", function () {
                expect(function () {
                    alias.value = "@component:propertyName.path";
                }).toThrow();
            });
        });

        describe("valid alias syntax", function () {
            it("should accept a template property", function () {
                expect(function () {
                    alias.value = "@component:propertyName";
                }).not.toThrow();
            });

            it("should initialize with the value", function () {
                var value = "@component:propertyName";

                alias.init(value);

                expect(alias.value).toBe(value);
            })
        });
    });
});
