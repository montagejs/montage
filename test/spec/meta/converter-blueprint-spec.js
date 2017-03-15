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
        it("should exist", function (done) {
            var blueprintPromise = converter.blueprint;
            blueprintPromise.then(function (blueprint) {
                expect(blueprint).toBeTruthy();
            }).finally(function () {
                done();
            });
        });

        it("should have allowPartialConversion property blueprint", function (done) {
            var blueprintPromise = converter.blueprint;
            blueprintPromise.then(function (blueprint) {
                var propertyBlueprint = blueprint.propertyDescriptorForName("allowPartialConversion");
                expect(propertyBlueprint).toBeTruthy();
                expect(propertyBlueprint.valueType).toBe("boolean");
                expect(propertyBlueprint.readOnly).toBe(true);
            }).finally(function () {
                done();
            });
        });
    });

    describe("test upper case converter blueprint", function () {
        it("should exist", function (done) {
            var blueprintPromise = ucaseConverter.blueprint;
            blueprintPromise.then(function (blueprint) {
                expect(blueprint).toBeTruthy();
            }).finally(function () {
                done();
            });
        });
    });

    describe("test lower case converter blueprint", function () {
        it("should exist", function (done) {
            var blueprintPromise = lcaseConverter.blueprint;
            blueprintPromise.then(function (blueprint) {
                expect(blueprint).toBeTruthy();
            }).finally(function () {
                done();
            });
        });
    });

    describe("test invert converter blueprint", function () {
        it("should exist", function (done) {
            var blueprintPromise = invertConverter.blueprint;
            blueprintPromise.then(function (blueprint) {
                expect(blueprint).toBeTruthy();
            }).finally(function () {
                done();
            });
        });
    });

    describe("test trim converter blueprint", function () {
        it("should exist", function (done) {
            var blueprintPromise = trimConverter.blueprint;
            blueprintPromise.then(function (blueprint) {
                expect(blueprint).toBeTruthy();
            }).finally(function () {
                done();
            });
        });
    });

    describe("test number converter blueprint", function () {
        it("should exist", function (done) {
            var blueprintPromise = converter.blueprint;
            blueprintPromise.then(function (blueprint) {
                expect(blueprint).toBeTruthy();
            }).finally(function () {
                done();
            });
        });

        it("should have shorten property blueprint", function (done) {
            var blueprintPromise = numberConverter.blueprint;
            blueprintPromise.then(function (blueprint) {
                var propertyBlueprint = blueprint.propertyDescriptorForName("shorten");
                expect(propertyBlueprint).toBeTruthy();
                expect(propertyBlueprint.valueType).toBe("boolean");
            }).finally(function () {
                done();
            });
        });

        it("should have decimals property blueprint", function (done) {
            var blueprintPromise = numberConverter.blueprint;
            blueprintPromise.then(function (blueprint) {
                var propertyBlueprint = blueprint.propertyDescriptorForName("decimals");
                expect(propertyBlueprint).toBeTruthy();
                expect(propertyBlueprint.valueType).toBe("number");
            }).finally(function () {
                done();
            });
        });

        it("should have round property blueprint", function (done) {
            var blueprintPromise = numberConverter.blueprint;
            blueprintPromise.then(function (blueprint) {
                var propertyBlueprint = blueprint.propertyDescriptorForName("round");
                expect(propertyBlueprint).toBeTruthy();
                expect(propertyBlueprint.valueType).toBe("boolean");
            }).finally(function () {
                done();
            });
        });

        it("should have allowFloat property blueprint", function (done) {
            var blueprintPromise = numberConverter.blueprint;
            blueprintPromise.then(function (blueprint) {
                var propertyBlueprint = blueprint.propertyDescriptorForName("allowFloat");
                expect(propertyBlueprint).toBeTruthy();
                expect(propertyBlueprint.valueType).toBe("boolean");
            }).finally(function () {
                done();
            });
        });

        it("should have allowNegative promerty blueprint", function (done) {
            var blueprintPromise = numberConverter.blueprint;
            blueprintPromise.then(function (blueprint) {
                var propertyBlueprint = blueprint.propertyDescriptorForName("allowNegative");
                expect(propertyBlueprint).toBeTruthy();
                expect(propertyBlueprint.valueType).toBe("boolean");
            }).finally(function () {
                done();
            });
        });
    });

    describe("test bytes converter blueprint", function () {
        it("should exist", function (done) {
            var blueprintPromise = bytesConverter.blueprint;
            blueprintPromise.then(function (blueprint) {
                expect(blueprint).toBeTruthy();
            }).finally(function () {
                done();
            });
        });

        it("should have decimals property blueprint", function (done) {
            var blueprintPromise = bytesConverter.blueprint;
            blueprintPromise.then(function (blueprint) {
                var propertyBlueprint = blueprint.propertyDescriptorForName("decimals");
                expect(propertyBlueprint).toBeTruthy();
                expect(propertyBlueprint.valueType).toBe("number");
            }).finally(function () {
                done();
            });
        });
    });

    describe("test date converter blueprint", function () {
        it("should exist", function (done) {
            var blueprintPromise = dateConverter.blueprint;
            blueprintPromise.then(function (blueprint) {
                expect(blueprint).toBeTruthy();
            }).finally(function () {
                done();
            });
        });

        it("should have validator property blueprint", function (done) {
            var blueprintPromise = dateConverter.blueprint;
            blueprintPromise.then(function (blueprint) {
                var propertyBlueprint = blueprint.propertyDescriptorForName("validator");
                expect(propertyBlueprint).toBeTruthy();
                expect(propertyBlueprint.valueType).toBe("object");
            }).finally(function () {
                done();
            });
        });

        it("should have pattern property blueprint", function (done) {
            var blueprintPromise = dateConverter.blueprint;
            blueprintPromise.then(function (blueprint) {
                var propertyBlueprint = blueprint.propertyDescriptorForName("pattern");
                expect(propertyBlueprint).toBeTruthy();
                expect(propertyBlueprint.valueType).toBe("string");
            }).finally(function () {
                done();
            });
        });
    });

    describe("test currency converter blueprint", function () {
        it("should exist", function (done) {
            var blueprintPromise = currencyConverter.blueprint;
            blueprintPromise.then(function (blueprint) {
                expect(blueprint).toBeTruthy();
            }).finally(function () {
                done();
            });
        });

        it("should have currency property blueprint", function (done) {
            var blueprintPromise = currencyConverter.blueprint;
            blueprintPromise.then(function (blueprint) {
                var propertyBlueprint = blueprint.propertyDescriptorForName("currency");
                expect(propertyBlueprint).toBeTruthy();
                expect(propertyBlueprint.valueType).toBe("string");
            }).finally(function () {
                done();
            });
        });
    });

});
