/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;
var Converter= require("montage/core/converter/converter").Converter,
UpperCaseConverter = require("montage/core/converter/upper-case-converter").UpperCaseConverter,
LowerCaseConverter = require("montage/core/converter/lower-case-converter").LowerCaseConverter,
TrimConverter = require("montage/core/converter/trim-converter").TrimConverter,
NumberConverter = require("montage/core/converter/number-converter").NumberConverter,
BytesConverter = require("montage/core/converter/bytes-converter").BytesConverter,
DateConverter = require("montage/core/converter/date-converter").DateConverter,
CurrencyConverter = require("montage/core/converter/currency-converter").CurrencyConverter;

describe("converter-spec", function() {

    var numberConverter, stringConverter, dateConverter, currencyConverter, bytesConverter;
    var dateConverter;
    var date = new Date('25 Aug 2011 12:00:00 PM');

    beforeEach(function() {
        //stringConverter = Montage.create(StringConverter);
        ucaseConverter = Montage.create(UpperCaseConverter);
        lcaseConverter = Montage.create(LowerCaseConverter);
        trimConverter = Montage.create(TrimConverter);

        numberConverter = Montage.create(NumberConverter);
        numberConverter.shorten = true;
        bytesConverter = Montage.create(BytesConverter);
        dateConverter = Montage.create(DateConverter);
        currencyConverter = Montage.create(CurrencyConverter);

        dateConverter = Montage.create(DateConverter);
        //dateConverter.pattern = 'YYYY-MM-DD';
    });

    describe("test string formatters", function() {
        it("should format a string to uppercase", function() {
            var value = "hello world";
            //stringConverter.fn = "uppercase";
            var result = ucaseConverter.convert(value);
            expect(result).toBe('HELLO WORLD');
        });

        it("should format a string to lowercase", function() {
            var value = "HELLO World";
            //stringConverter.fn = "lowercase";
            var result = lcaseConverter.convert(value);
            expect(result).toBe('hello world');
        });

        it("should format a string by trimming it", function() {
            var value = "   hello world    ";
            //stringConverter.fn = "trim";
            var result = trimConverter.convert(value);
            expect(result).toBe('hello world');
        });

        /*
        it("should format a string by converting newline characters to <BR>", function() {
            var value = "   hello \r\n world    ";
            stringConverter.fn = "trim";
            var result = stringConverter.convert(value);
            expect(result).toBe('hello <br /> world');
        });
        */

    });

    describe("Test Number to String formatters", function() {
        it("should format a number to human readable format 100s", function() {
            var value = 100.0102;
            var result = numberConverter.convert(value);
            expect(result).toBe('100.01');
        });

        it("should format a number to human readable format 1K", function() {
            var value = 1001.920304;
            numberConverter.decimals = 3;
            var result = numberConverter.convert(value);
            expect(result).toBe('1.002K');
        });

        it("should format a number to human readable format 1M", function() {
            var value = 1509000.920304;
            numberConverter.decimals = 2;
            var result = numberConverter.convert(value);
            expect(result).toBe('1.51M');
        });

        it("should format a number to 3 decimal places", function() {
            var value = 1509000.929304;
            numberConverter.decimals = 3;
            numberConverter.shorten = false;
            var result = numberConverter.convert(value);
            expect(result).toBe('1,509,000.929');
        });

    });

    describe("Test formatting of file sizes and numbers representing bytes", function() {
        it("should format a number to friendly byte size", function() {
            var value = 100200300;
            var result = bytesConverter.convert(value);
            expect(result).toBe('95.56MB');
        });
        it("should format a number to friendly byte size", function() {
            var value = 1024;
            var result = bytesConverter.convert(value);
            expect(result).toBe('1KB');
        });
        it("should format a number to friendly byte size", function() {
            var value = 2048000000;
            bytesConverter.decimals = 4;
            var result = bytesConverter.convert(value);
            expect(result).toBe('1.9073GB');
        });
    });


    describe("Test Date/time formatters", function() {
        it("should format a date to the default mm/dd/yyyy format", function() {
            var value = date;
            // use default pattern which is mm/dd/yy or use the %D pattern
            var result = dateConverter.convert(value);
            expect(result).toBe('08/25/2011');
        });
        it("should format a date to mm/dd/yyyy format", function() {
            var value = date;
            dateConverter.pattern = 'MM/dd/yyyy';
            var result = dateConverter.convert(value);
            expect(result).toBe('08/25/2011');
        });
        it("should format a date to dd-mm-yyyy format", function() {
            var value = date;
            dateConverter.pattern = 'dd-MM-yyyy';
            var result = dateConverter.convert(value);
            expect(result).toBe('25-08-2011');
        });
        it("should format a date to dd MM yyyy format", function() {
            var value = date;
            dateConverter.pattern = 'dd-MM-yyyy';
            var result = dateConverter.convert(value);
            expect(result).toBe('25-08-2011');
        });

        it("should format a date to dd MM YYYY format", function() {
            var value = date;
            dateConverter.pattern = 'dd MMM yyyy';
            var result = dateConverter.convert(value);
            expect(result).toBe('25 Aug 2011');
        });


        it("should format a date to Date:dd Month:MM Year:YYYY format", function() {
            var value = date;
            dateConverter.pattern = 'dd of MMMM yyyy'; //'%d %b %Y %k:%M %p';
            var result = dateConverter.convert(value);
            expect(result).toBe('25 of August 2011');
        });

        it("should format a date to ISO 8601 format", function() {
            var value = date;
            dateConverter.pattern = 'c';
            var result = dateConverter.convert(value);
            expect(result.indexOf('2011-08-25T')).toBe(0);
        });

    });


    describe("Test formatting numbers to Currency", function() {
        it("should format a String representing a number to $ {value}", function() {
            var value = "100000";
            var result = currencyConverter.convert(value);
            expect(result).toBe('100K $');
        });
        it("should format a number to a USD value", function() {
            var value = 100.01002;
            currencyConverter.currency = 'USD';
            var result = currencyConverter.convert(value);
            expect(result).toBe('100.01 USD');
        });
        it("should format a negative number to a US $ value", function() {
            var value = -1000000;
            currencyConverter.currency = 'HK$';
            var result = currencyConverter.convert(value);
            expect(result).toBe('-1M HK$');
        });
        it("should format a negative number to currency with parens", function() {
            var value = -10010.8009;
            currencyConverter.currency = 'USD';
            currencyConverter.useParensForNegative = true;
            currencyConverter.decimals = 3;

            var result = currencyConverter.convert(value);
            expect(result).toBe('(10.011K) USD');
        });
        it("should format a negative number to a US $ value using parens", function() {
            var value = -1000000;
            currencyConverter.useParensForNegative = true;
            currencyConverter.decimals = 3;
            var result = currencyConverter.convert(value);
            expect(result).toBe('(1M) $');
        });
        it("should format a negative number to a US $ value using parens", function() {
            var value = -1000000;
            currencyConverter.useParensForNegative = false;
            currencyConverter.decimals = 3;
            var result = currencyConverter.convert(value);
            expect(result).toBe('-1M $');
        });

        it("should format a negative number to a US $ value using parens", function() {
            var value = -12500.199;;
            currencyConverter.useParensForNegative = false;
            currencyConverter.decimals = 4;
            var result = currencyConverter.convert(value);
            expect(result).toBe('-12.5002K $');
        });
        it("should format a negative number to a US $ value using parens", function() {
            var value = -12500.199;;
            currencyConverter.useParensForNegative = false;
            currencyConverter.decimals = 5;
            var result = currencyConverter.convert(value);
            expect(result).toBe('-12.5002K $');
        });
    });


    describe("test date converter", function() {
        it("should create a date from a formatted string", function() {
            var value = "08/30/2011";
            var result = dateConverter.revert(value);
            expect(date.getFullYear()).toBe(2011);
        });
    });

    /*


    // string formatters
    describe("Test String formatters", function() {

        it("should format a string as uppercase", function() {
            var value = 'Motorola';
            var result = formatter.upperCase(value);
            expect(result).toBe('MOTOROLA');
        });

        it("should format a string as lowercase", function() {
            var value = 'Hello World!';
            var result = formatter.lowerCase(value);
            expect(result).toBe('hello world!');
        });

        it("should format by trimming the string", function() {
            var value = ' Hello World! ';
            var result = formatter.trim(value);
            expect(result).toBe('Hello World!');
        });

    });

    */


});

