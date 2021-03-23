/**
 * @module montage/data/converter/query-to-data-stream-converter
 */

var Converter = require("../../core/converter/converter").Converter,
    DataService = require("../service/data-service").DataService;
/**
 * @class RawForeignValueToObjectConverter
 * @classdesc Converts a property value of raw data to the referenced object.
 * @extends RawValueToObjectConverter
 */
exports.QueryToDataStreamConverter = Converter.specialize( /** @lends QueryToDataStreamConverter# */ {

    /*********************************************************************
     * Public API
     */

    /**
     * Converts a query to the data stream that contains the results of the query.
     * @function
     * @param {DataQuery} query The value to convert.
     * @returns {DataStream} that acts as a promise.
     *
     */

    convert: {
        value: function (query) {
            return DataService.mainService.fetchData(query);
        }
    }

});
