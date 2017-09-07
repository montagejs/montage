/* <copyright>
Copyright (c) 2012, Motorola Mobility LLC.
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of Motorola Mobility LLC nor the names of its
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */
var Montage = require("montage").Montage;
var Converter= require("montage/core/converter/converter").Converter,
UpperCaseConverter = require("montage/core/converter/upper-case-converter").singleton,
LowerCaseConverter = require("montage/core/converter/lower-case-converter").singleton,
TrimConverter = require("montage/core/converter/trim-converter").singleton,
NumberConverter = require("montage/core/converter/number-converter").NumberConverter,
BytesConverter = require("montage/core/converter/bytes-converter").BytesConverter,
InvertConverterModule = require("montage/core/converter/invert-converter"),
InvertConverter = InvertConverterModule.InvertConverter,
InvertConverterSingleton = InvertConverterModule.singleton,
DateConverter = require("montage/core/converter/date-converter").DateConverter,
ExpressionConverter = require("montage/core/converter/expression-converter").ExpressionConverter,
CamelCaseConverter = require("montage/core/converter/camel-case-converter").singleton,
SnakeCaseConverter = require("montage/core/converter/snake-case-converter").singleton,
KebabCaseConverter = require("montage/core/converter/kebab-case-converter").singleton,
CurrencyConverter = require("montage/core/converter/currency-converter").CurrencyConverter;

describe("converter-spec", function () {

    var numberConverter, stringConverter, dateConverter, currencyConverter, bytesConverter, dateConverter,
        expressionConverter,
        date = new Date('25 Aug 2011 12:00:00 PM');

    beforeEach(function () {
        ucaseConverter = UpperCaseConverter;
        lcaseConverter = LowerCaseConverter;
        trimConverter = TrimConverter;
        invertConverter = InvertConverterSingleton;
        numberConverter = new NumberConverter();
        numberConverter.shorten = true;
        bytesConverter = new BytesConverter();
        dateConverter = new DateConverter();
        currencyConverter = new CurrencyConverter();
        currencyConverter.shorten = true;

        dateConverter = new DateConverter();
        expressionConverter = new ExpressionConverter();
        expressionConverter.convertExpression = "map{foo}";
        expressionConverter.revertExpression = "map{{foo:this}}";

        camelCaseConverter = CamelCaseConverter;
        snakeCaseConverter = SnakeCaseConverter;
        kebabCaseConverter = KebabCaseConverter;
    });

    describe("test string formatters", function () {
        it("should format a string to uppercase", function () {
            var value = "hello world";
            var result = ucaseConverter.convert(value);
            expect(result).toBe('HELLO WORLD');
        });

        it("should format a string to lowercase", function () {
            var value = "HELLO World";
            var result = lcaseConverter.convert(value);
            expect(result).toBe('hello world');
        });

        it("should format a string by trimming it", function () {
            var value = "   hello world    ";
            var result = trimConverter.convert(value);
            expect(result).toBe('hello world');
        });

        it("should inverts value", function () {
            expect(invertConverter.convert(true)).toBe(false);
            expect(invertConverter.convert(0)).toBe(true);
        });

        it("should converts string to camel case", function () {
            expect(camelCaseConverter.convert('hello world')).toBe('helloWorld');
            expect(camelCaseConverter.convert('HELLO WORLD')).toBe('helloWorld');
            expect(camelCaseConverter.convert('hello-world')).toBe('helloWorld');
        });

        it("should converts string to snake case", function () {
            expect(snakeCaseConverter.convert('hello world')).toBe('hello_world');
            expect(snakeCaseConverter.convert('HELLO WORLD')).toBe('hello_world');
            expect(snakeCaseConverter.convert('hello-world')).toBe('hello_world');
        });

        it("should converts string to kebab case", function () {
            expect(kebabCaseConverter.convert('hello world')).toBe('hello-world');
            expect(kebabCaseConverter.convert('HELLO WORLD')).toBe('hello-world');
            expect(kebabCaseConverter.convert('hello_world')).toBe('hello-world');
        });

        it("should be a singleton", function () {
            expect(invertConverter === new InvertConverter()).toBe(true);
        });

    });

    describe("Test Number to String formatters", function () {
        it("should format a number to human readable format 100s", function () {
            var value = 100.0102;
            var result = numberConverter.convert(value);
            expect(result).toBe('100.01');
        });

        it("should format a number to human readable format 1K", function () {
            var value = 1001.920304;
            numberConverter.decimals = 3;
            var result = numberConverter.convert(value);
            expect(result).toBe('1.002K');
        });

        it("should format a number to human readable format 1M", function () {
            var value = 1509000.920304;
            numberConverter.decimals = 2;
            var result = numberConverter.convert(value);
            expect(result).toBe('1.51M');
        });

        it("should format a number to 3 decimal places", function () {
            var value = 1509000.929304;
            numberConverter.decimals = 3;
            numberConverter.shorten = false;
            var result = numberConverter.convert(value);
            expect(result).toBe('1,509,000.929');
        });

        it("should, by default, not include trailing 0s after the decimal", function () {
            var value = 12.2
            numberConverter.decimals = 2;
            numberConverter.shorten = false;
            var result = numberConverter.convert(value);
            expect(result).toBe('12.2');
        });

        it("should add trailing 0s in decimal places when forceDecimals is on", function () {
            var value = 12.2
            numberConverter.decimals = 2;
            numberConverter.shorten = false;
            numberConverter.forceDecimals = true;
            var result = numberConverter.convert(value);
            expect(result).toBe('12.20');
        });

    });

    describe("Test formatting of file sizes and numbers representing bytes", function () {
        it("should format a number to friendly byte size", function () {
            var value = 100200300;
            var result = bytesConverter.convert(value);
            expect(result).toBe('95.56MB');
        });
        it("should format a number to friendly byte size", function () {
            var value = 1024;
            var result = bytesConverter.convert(value);
            expect(result).toBe('1KB');
        });
        it("should format a number to friendly byte size", function () {
            var value = 2048000000;
            bytesConverter.decimals = 4;
            var result = bytesConverter.convert(value);
            expect(result).toBe('1.9073GB');
        });
    });

    describe('Test parsing of formatted size string to bytes', function() {
        it('should return the value corresponding to the string', function() {
            var string = '1.2GB';
            var result = bytesConverter.revert(string);
            expect(result).toBe(1288490188.8);
        });
    });


    describe("Test Date/time formatters", function () {
        it("should format a date to the default mm/dd/yyyy format", function () {
            var value = date;
            // use default pattern which is mm/dd/yy or use the %D pattern
            var result = dateConverter.convert(value);
            expect(result).toBe('08/25/2011');
        });
        it("should format a date to mm/dd/yyyy format", function () {
            var value = date;
            dateConverter.pattern = 'MM/dd/yyyy';
            var result = dateConverter.convert(value);
            expect(result).toBe('08/25/2011');
        });
        it("should format a date to dd-mm-yyyy format", function () {
            var value = date;
            dateConverter.pattern = 'dd-MM-yyyy';
            var result = dateConverter.convert(value);
            expect(result).toBe('25-08-2011');
        });
        it("should format a date to dd MM yyyy format", function () {
            var value = date;
            dateConverter.pattern = 'dd-MM-yyyy';
            var result = dateConverter.convert(value);
            expect(result).toBe('25-08-2011');
        });

        it("should format a date to dd MM YYYY format", function () {
            var value = date;
            dateConverter.pattern = 'dd MMM yyyy';
            var result = dateConverter.convert(value);
            expect(result).toBe('25 Aug 2011');
        });


        it("should format a date to Date:dd Month:MM Year:YYYY format", function () {
            var value = date;
            dateConverter.pattern = 'dd of MMMM yyyy'; //'%d %b %Y %k:%M %p';
            var result = dateConverter.convert(value);
            expect(result).toBe('25 of August 2011');
        });

        it("should format a date to ISO 8601 format", function () {
            var value = date;
            dateConverter.pattern = 'c';
            var result = dateConverter.convert(value);
            expect(result.indexOf('2011-08-25T')).toBe(0);
        });

    });


    describe("Test formatting numbers to Currency", function () {
        it("should format a String representing a number to $ {value}", function () {
            var value = "100000";
            var result = currencyConverter.convert(value);
            expect(result).toBe('100K $');
        });
        it("should format a number to a USD value", function () {
            var value = 100.01002;
            currencyConverter.currency = 'USD';
            var result = currencyConverter.convert(value);
            expect(result).toBe('100.01 USD');
        });
        it("should format a negative number to a US $ value", function () {
            var value = -1000000;
            currencyConverter.currency = 'HK$';
            var result = currencyConverter.convert(value);
            expect(result).toBe('-1M HK$');
        });
        it("should format a negative number to currency with parens", function () {
            var value = -10010.8009;
            currencyConverter.currency = 'USD';
            currencyConverter.useParensForNegative = true;
            currencyConverter.decimals = 3;

            var result = currencyConverter.convert(value);
            expect(result).toBe('(10.011K) USD');
        });
        it("should format a negative number to a US $ value using parens", function () {
            var value = -1000000;
            currencyConverter.useParensForNegative = true;
            currencyConverter.decimals = 3;
            var result = currencyConverter.convert(value);
            expect(result).toBe('(1M) $');
        });
        it("should format a negative number to a US $ value using parens", function () {
            var value = -1000000;
            currencyConverter.useParensForNegative = false;
            currencyConverter.decimals = 3;
            var result = currencyConverter.convert(value);
            expect(result).toBe('-1M $');
        });

        it("should format a negative number to a US $ value using parens", function () {
            var value = -12500.199;;
            currencyConverter.useParensForNegative = false;
            currencyConverter.decimals = 4;
            var result = currencyConverter.convert(value);
            expect(result).toBe('-12.5002K $');
        });
        it("should format a negative number to a US $ value using parens", function () {
            var value = -12500.199;;
            currencyConverter.useParensForNegative = false;
            currencyConverter.decimals = 5;
            var result = currencyConverter.convert(value);
            expect(result).toBe('-12.5002K $');
        });
        it("should not shorten when asked not to", function () {
            var value = -12400;
            currencyConverter.useParensForNegative = false;
            currencyConverter.decimals = 0
            currencyConverter.shorten = false;
            var result = currencyConverter.convert(value);
            expect(result).toBe("-12,400 $");
        });
        it("should allow putting currency before the number", function () {
            var value = -12400;
            currencyConverter.useParensForNegative = false;
            currencyConverter.decimals = 0
            currencyConverter.shorten = false;
            currencyConverter.showCurrencyBeforeNumber = true;
            var result = currencyConverter.convert(value);
            expect(result).toBe("$ -12,400");
        });
        it("should allow putting currency before the number", function () {
            var value = -12400;
            currencyConverter.useParensForNegative = false;
            currencyConverter.decimals = 0
            currencyConverter.shorten = false;
            currencyConverter.showCurrencyBeforeNumber = false;
            var result = currencyConverter.convert(value);
            expect(result).toBe("-12,400 $");
        });
        it("should include all requested decimal places", function () {
            var value = 12.2;
            currencyConverter.decimals = 2;
            currencyConverter.showCurrencyBeforeNumber = true;
            currencyConverter.shorten = false;
            var result = currencyConverter.convert(value);
            expect(result).toBe("$ 12.20")
        });
    });


    describe("test date converter", function () {
        it("should create a date from a formatted string", function () {
            var value = "08/30/2011";
            var result = dateConverter.revert(value);
            expect(date.getFullYear()).toBe(2011);
        });
    });


    describe("test expression converter", function () {
        it("should create an array of numbers from an array of objects", function () {
            var value = [{foo:1},{foo:2},{foo:3},{foo:4}];
            var result = expressionConverter.convert(value);
            expect(result).toEqual([1,2,3,4]);
            result = expressionConverter.revert(result);
            expect(result).toEqual([{foo:1},{foo:2},{foo:3},{foo:4}]);

        });
    });

    /*


    // string formatters
    describe("Test String formatters", function () {

        it("should format a string as uppercase", function () {
            var value = 'Motorola';
            var result = formatter.upperCase(value);
            expect(result).toBe('MOTOROLA');
        });

        it("should format a string as lowercase", function () {
            var value = 'Hello World!';
            var result = formatter.lowerCase(value);
            expect(result).toBe('hello world!');
        });

        it("should format by trimming the string", function () {
            var value = ' Hello World! ';
            var result = formatter.trim(value);
            expect(result).toBe('Hello World!');
        });

    });

    */


});

