/* <copyright>
 </copyright> */
/**
 @module montage/data/blueprint-spec.js
 @requires montage/core/core
 @requires montage/core/logger
 */
var Montage = require("montage").Montage;
var Converter = require("montage/core/converter/converter").Converter;
var UpperCaseConverter = require("montage/core/converter/upper-case-converter").UpperCaseConverter;
var LowerCaseConverter = require("montage/core/converter/lower-case-converter").LowerCaseConverter;
var InvertConverter = require("montage/core/converter/invert-converter").InvertConverter;
var TrimConverter = require("montage/core/converter/trim-converter").TrimConverter;
var NumberConverter = require("montage/core/converter/number-converter").NumberConverter;
var BytesConverter = require("montage/core/converter/bytes-converter").BytesConverter;
var DateConverter = require("montage/core/converter/date-converter").DateConverter;
var CurrencyConverter = require("montage/core/converter/currency-converter").CurrencyConverter;

var Blueprint = require("montage/core/meta/blueprint").Blueprint;
var Binder = require("montage/core/meta/blueprint").Binder;
var PropertyBlueprint = require("montage/core/meta/blueprint").PropertyBlueprint;
var AssociationBlueprint = require("montage/core/meta/blueprint").AssociationBlueprint;

describe("meta/converter-blueprint-spec", function () {

    var converter,
        ucaseConverter,
        lcaseConverter,
        trimConverter,
        invertConverter,
        numberConverter,
        bytesConverter,
        dateConverter,
        currencyConverter;

    beforeEach(function () {
        converter = Converter;
        ucaseConverter = UpperCaseConverter;
        lcaseConverter = LowerCaseConverter;
        trimConverter = TrimConverter;
        invertConverter = InvertConverter;
        numberConverter = NumberConverter;
        bytesConverter = BytesConverter;
        dateConverter = DateConverter;
        currencyConverter = CurrencyConverter;
    });

    describe("test converter blueprint", function () {
        it("should exist", function () {
            var blueprintPromise = converter.blueprint;
            return blueprintPromise.then(function (blueprint) {
                expect(blueprint).toBeTruthy();
            });
        });

        it("should have allowPartialConversion property blueprint", function () {
            var blueprintPromise = converter.blueprint;
            return blueprintPromise.then(function (blueprint) {
                var propertyBlueprint = blueprint.propertyBlueprintForName("allowPartialConversion");
                expect(propertyBlueprint).toBeTruthy();
                expect(propertyBlueprint.valueType).toBe("boolean");
                expect(propertyBlueprint.readOnly).toBe(true);
            });
        });
    });

    describe("test upper case converter blueprint", function () {
        it("should exist", function () {
            var blueprintPromise = ucaseConverter.blueprint;
            return blueprintPromise.then(function (blueprint) {
                expect(blueprint).toBeTruthy();
            });
        });
    });

    describe("test lower case converter blueprint", function () {
        it("should exist", function () {
            var blueprintPromise = lcaseConverter.blueprint;
            return blueprintPromise.then(function (blueprint) {
                expect(blueprint).toBeTruthy();
            });
        });
    });

    describe("test invert converter blueprint", function () {
        it("should exist", function () {
            var blueprintPromise = invertConverter.blueprint;
            return blueprintPromise.then(function (blueprint) {
                expect(blueprint).toBeTruthy();
            });
        });
    });

    describe("test trim converter blueprint", function () {
        it("should exist", function () {
            var blueprintPromise = trimConverter.blueprint;
            return blueprintPromise.then(function (blueprint) {
                expect(blueprint).toBeTruthy();
            });
        });
    });

    describe("test number converter blueprint", function () {
        it("should exist", function () {
            var blueprintPromise = converter.blueprint;
            return blueprintPromise.then(function (blueprint) {
                expect(blueprint).toBeTruthy();
            });
        });

        it("should have shorten property blueprint", function () {
            var blueprintPromise = numberConverter.blueprint;
            return blueprintPromise.then(function (blueprint) {
                var propertyBlueprint = blueprint.propertyBlueprintForName("shorten");
                expect(propertyBlueprint).toBeTruthy();
                expect(propertyBlueprint.valueType).toBe("boolean");
            });
        });

        it("should have decimals property blueprint", function () {
            var blueprintPromise = numberConverter.blueprint;
            return blueprintPromise.then(function (blueprint) {
                var propertyBlueprint = blueprint.propertyBlueprintForName("decimals");
                expect(propertyBlueprint).toBeTruthy();
                expect(propertyBlueprint.valueType).toBe("number");
            });
        });

        it("should have round property blueprint", function () {
            var blueprintPromise = numberConverter.blueprint;
            return blueprintPromise.then(function (blueprint) {
                var propertyBlueprint = blueprint.propertyBlueprintForName("round");
                expect(propertyBlueprint).toBeTruthy();
                expect(propertyBlueprint.valueType).toBe("boolean");
            });
        });

        it("should have allowFloat property blueprint", function () {
            var blueprintPromise = numberConverter.blueprint;
            return blueprintPromise.then(function (blueprint) {
                var propertyBlueprint = blueprint.propertyBlueprintForName("allowFloat");
                expect(propertyBlueprint).toBeTruthy();
                expect(propertyBlueprint.valueType).toBe("boolean");
            });
        });

        it("should have allowNegative promerty blueprint", function () {
            var blueprintPromise = numberConverter.blueprint;
            return blueprintPromise.then(function (blueprint) {
                var propertyBlueprint = blueprint.propertyBlueprintForName("allowNegative");
                expect(propertyBlueprint).toBeTruthy();
                expect(propertyBlueprint.valueType).toBe("boolean");
            });
        });
    });

    describe("test bytes converter blueprint", function () {
        it("should exist", function () {
            var blueprintPromise = bytesConverter.blueprint;
            return blueprintPromise.then(function (blueprint) {
                expect(blueprint).toBeTruthy();
            });
        });

        it("should have decimals property blueprint", function () {
            var blueprintPromise = bytesConverter.blueprint;
            return blueprintPromise.then(function (blueprint) {
                var propertyBlueprint = blueprint.propertyBlueprintForName("decimals");
                expect(propertyBlueprint).toBeTruthy();
                expect(propertyBlueprint.valueType).toBe("number");
            });
        });
    });

    describe("test date converter blueprint", function () {
        it("should exist", function () {
            var blueprintPromise = dateConverter.blueprint;
            return blueprintPromise.then(function (blueprint) {
                expect(blueprint).toBeTruthy();
            });
        });

        it("should have validator property blueprint", function () {
            var blueprintPromise = dateConverter.blueprint;
            return blueprintPromise.then(function (blueprint) {
                var propertyBlueprint = blueprint.propertyBlueprintForName("validator");
                expect(propertyBlueprint).toBeTruthy();
                expect(propertyBlueprint.valueType).toBe("object");
            });
        });

        it("should have pattern property blueprint", function () {
            var blueprintPromise = dateConverter.blueprint;
            return blueprintPromise.then(function (blueprint) {
                var propertyBlueprint = blueprint.propertyBlueprintForName("pattern");
                expect(propertyBlueprint).toBeTruthy();
                expect(propertyBlueprint.valueType).toBe("string");
            });
        });
    });

    describe("test currency converter blueprint", function () {
        it("should exist", function () {
            var blueprintPromise = currencyConverter.blueprint;
            return blueprintPromise.then(function (blueprint) {
                expect(blueprint).toBeTruthy();
            });
        });

        it("should have currency property blueprint", function () {
            var blueprintPromise = currencyConverter.blueprint;
            return blueprintPromise.then(function (blueprint) {
                var propertyBlueprint = blueprint.propertyBlueprintForName("currency");
                expect(propertyBlueprint).toBeTruthy();
                expect(propertyBlueprint.valueType).toBe("string");
            });
        });
    });

});
