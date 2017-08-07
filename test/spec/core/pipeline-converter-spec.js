var PipelineConverter = require("montage/core/converter/pipeline-converter").PipelineConverter,
    DateConverter = require("montage/core/converter/date-converter").DateConverter,
    LowerCaseConverter = require("montage/core/converter/lower-case-converter").LowerCaseConverter,
    UpperCaseConverter = require("montage/core/converter/upper-case-converter").UpperCaseConverter,
    Converter = require("montage/core/converter/converter").Converter,
    Promise = require("montage/core/promise").Promise;

var AsynchronousConverter = Converter.specialize({

    convert: {
        value: function (v) {
            return new Promise(function (resolve, reject) {
                setTimeout(function () {
                    resolve(v);
                }, 1000);
            });
        }
    },

    revert: {
        value: function (v) {
            return new Promise(function (resolve, reject) {
                setTimeout(function () {
                    resolve(v);
                }, 1000);
            });
        }
    }

});


describe("core/pipeline-converter-spec", function () {
    var asyncConverter,
        lcaseConverter,
        pipelineConverter,
        ucaseConverter;

    beforeEach(function () {
        asyncConverter = new AsynchronousConverter();
        dateConverter = new DateConverter();
        lcaseConverter = new LowerCaseConverter();
        pipelineConverter = new PipelineConverter();
        ucaseConverter = new UpperCaseConverter();

    });

    describe("synchronous", function () {
        var input;
        beforeEach(function () {
            input = "A lonG And WinDINg ROAd";
        });
        it("should convert to lowercase", function (done) {
            pipelineConverter.converters = [
                lcaseConverter,
                ucaseConverter
            ];

            pipelineConverter.convert(input).then(function (result) {
                expect(result).toBe("A LONG AND WINDING ROAD");
                done();
            });

        });

        it("should convert to uppercase", function (done) {
            pipelineConverter.converters = [
                ucaseConverter,
                lcaseConverter
            ];

            pipelineConverter.convert(input).then(function (result) {
                expect(result).toBe("a long and winding road");
                done();
            });

        });
    });

    describe("asynchronous", function () {
        var input;
        beforeEach(function () {
            input = "A lonG And WinDINg ROAd";
        });
        it("should convert to lowercase", function (done) {
            pipelineConverter.converters = [
                asyncConverter,
                ucaseConverter
            ];

            pipelineConverter.convert(input).then(function (result) {
                expect(result).toBe("A LONG AND WINDING ROAD");
                done();
            });

        });

        it("should convert to uppercase", function (done) {
            pipelineConverter.converters = [
                asyncConverter,
                lcaseConverter
            ];

            pipelineConverter.convert(input).then(function (result) {
                expect(result).toBe("a long and winding road");
                done();
            });

        });
    });

});

