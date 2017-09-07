/* <copyright>
 </copyright> */
/**
 @module montage/data/object-desciptor-spec.js
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

describe("meta/converter-object-desciptor-spec", function () {
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

    describe("test converter object descriptor", function () {
        it("should exist", function (done) {
            var objectDescriptorPromise = converter.objectDescriptor;
            objectDescriptorPromise.then(function (objectDescriptor) {
                expect(objectDescriptor).toBeTruthy();
            }).finally(function () {
                done();
            });
        });

        it("should have allowPartialConversion property object descriptor", function (done) {
            var objectDescriptorPromise = converter.objectDescriptor;
            objectDescriptorPromise.then(function (objectDescriptor) {
                var propertyDescriptor = objectDescriptor.propertyDescriptorForName("allowPartialConversion");
                expect(propertyDescriptor).toBeTruthy();
                expect(propertyDescriptor.valueType).toBe("boolean");
                expect(propertyDescriptor.readOnly).toBe(true);
            }).finally(function () {
                done();
            });
        });
    });

    describe("test upper case converter object descriptor", function () {
        it("should exist", function (done) {
            var objectDescriptorPromise = ucaseConverter.objectDescriptor;
            objectDescriptorPromise.then(function (objectDescriptor) {
                expect(objectDescriptor).toBeTruthy();
            }).finally(function () {
                done();
            });
        });
    });

    describe("test lower case converter object descriptor", function () {
        it("should exist", function (done) {
            var objectDescriptorPromise = lcaseConverter.objectDescriptor;
            objectDescriptorPromise.then(function (objectDescriptor) {
                expect(objectDescriptor).toBeTruthy();
            }).finally(function () {
                done();
            });
        });
    });

    describe("test invert converter object descriptor", function () {
        it("should exist", function (done) {
            var objectDescriptorPromise = invertConverter.objectDescriptor;
            objectDescriptorPromise.then(function (objectDescriptor) {
                expect(objectDescriptor).toBeTruthy();
            }).finally(function () {
                done();
            });
        });
    });

    describe("test trim converter object descriptor", function () {
        it("should exist", function (done) {
            var objectDescriptorPromise = trimConverter.objectDescriptor;
            objectDescriptorPromise.then(function (objectDescriptor) {
                expect(objectDescriptor).toBeTruthy();
            }).finally(function () {
                done();
            });
        });
    });

    describe("test number converter object descriptor", function () {
        it("should exist", function (done) {
            var objectDescriptorPromise = converter.objectDescriptor;
            objectDescriptorPromise.then(function (objectDescriptor) {
                expect(objectDescriptor).toBeTruthy();
            }).finally(function () {
                done();
            });
        });

        it("should have shorten property object descriptor", function (done) {
            var objectDescriptorPromise = numberConverter.objectDescriptor;
            objectDescriptorPromise.then(function (objectDescriptor) {
                var propertyDescriptor = objectDescriptor.propertyDescriptorForName("shorten");
                expect(propertyDescriptor).toBeTruthy();
                expect(propertyDescriptor.valueType).toBe("boolean");
            }).finally(function () {
                done();
            });
        });

        it("should have decimals property object descriptor", function (done) {
            var objectDescriptorPromise = numberConverter.objectDescriptor;
            objectDescriptorPromise.then(function (objectDescriptor) {
                var propertyDescriptor = objectDescriptor.propertyDescriptorForName("decimals");
                expect(propertyDescriptor).toBeTruthy();
                expect(propertyDescriptor.valueType).toBe("number");
            }).finally(function () {
                done();
            });
        });

        it("should have round property object descriptor", function (done) {
            var objectDescriptorPromise = numberConverter.objectDescriptor;
            objectDescriptorPromise.then(function (objectDescriptor) {
                var propertyDescriptor = objectDescriptor.propertyDescriptorForName("round");
                expect(propertyDescriptor).toBeTruthy();
                expect(propertyDescriptor.valueType).toBe("boolean");
            }).finally(function () {
                done();
            });
        });

        it("should have allowFloat property object descriptor", function (done) {
            var objectDescriptorPromise = numberConverter.objectDescriptor;
            objectDescriptorPromise.then(function (objectDescriptor) {
                var propertyDescriptor = objectDescriptor.propertyDescriptorForName("allowFloat");
                expect(propertyDescriptor).toBeTruthy();
                expect(propertyDescriptor.valueType).toBe("boolean");
            }).finally(function () {
                done();
            });
        });

        it("should have allowNegative promerty object descriptor", function (done) {
            var objectDescriptorPromise = numberConverter.objectDescriptor;
            objectDescriptorPromise.then(function (objectDescriptor) {
                var propertyDescriptor = objectDescriptor.propertyDescriptorForName("allowNegative");
                expect(propertyDescriptor).toBeTruthy();
                expect(propertyDescriptor.valueType).toBe("boolean");
            }).finally(function () {
                done();
            });
        });
    });

    describe("test bytes converter object descriptor", function () {
        it("should exist", function (done) {
            var objectDescriptorPromise = bytesConverter.objectDescriptor;
            objectDescriptorPromise.then(function (objectDescriptor) {
                expect(objectDescriptor).toBeTruthy();
            }).finally(function () {
                done();
            });
        });

        it("should have decimals property object descriptor", function (done) {
            var objectDescriptorPromise = bytesConverter.objectDescriptor;
            objectDescriptorPromise.then(function (objectDescriptor) {
                var propertyDescriptor = objectDescriptor.propertyDescriptorForName("decimals");
                expect(propertyDescriptor).toBeTruthy();
                expect(propertyDescriptor.valueType).toBe("number");
            }).finally(function () {
                done();
            });
        });
    });

    describe("test date converter object descriptor", function () {
        it("should exist", function (done) {
            var objectDescriptorPromise = dateConverter.objectDescriptor;
            objectDescriptorPromise.then(function (objectDescriptor) {
                expect(objectDescriptor).toBeTruthy();
            }).finally(function () {
                done();
            });
        });

        it("should have validator property object descriptor", function (done) {
            var objectDescriptorPromise = dateConverter.objectDescriptor;
            objectDescriptorPromise.then(function (objectDescriptor) {
                var propertyDescriptor = objectDescriptor.propertyDescriptorForName("validator");
                expect(propertyDescriptor).toBeTruthy();
                expect(propertyDescriptor.valueType).toBe("object");
            }).finally(function () {
                done();
            });
        });

        it("should have pattern property object descriptor", function (done) {
            var objectDescriptorPromise = dateConverter.objectDescriptor;
            objectDescriptorPromise.then(function (objectDescriptor) {
                var propertyDescriptor = objectDescriptor.propertyDescriptorForName("pattern");
                expect(propertyDescriptor).toBeTruthy();
                expect(propertyDescriptor.valueType).toBe("string");
            }).finally(function () {
                done();
            });
        });
    });

    describe("test currency converter object descriptor", function () {
        it("should exist", function (done) {
            var objectDescriptorPromise = currencyConverter.objectDescriptor;
            objectDescriptorPromise.then(function (objectDescriptor) {
                expect(objectDescriptor).toBeTruthy();
            }).finally(function () {
                done();
            });
        });

        it("should have currency property object descriptor", function (done) {
            var objectDescriptorPromise = currencyConverter.objectDescriptor;
            objectDescriptorPromise.then(function (objectDescriptor) {
                var propertyDescriptor = objectDescriptor.propertyDescriptorForName("currency");
                expect(propertyDescriptor).toBeTruthy();
                expect(propertyDescriptor.valueType).toBe("string");
            }).finally(function () {
                done();
            });
        });
    });

});
