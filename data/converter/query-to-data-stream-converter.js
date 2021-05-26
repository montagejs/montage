/**
 * @module montage/data/converter/query-to-data-stream-converter
 */

var Converter = require("../../core/converter/converter").Converter,
    DataQuery = require("../model/data-query").DataQuery,
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

            if(!query instanceof DataQuery) {
                throw "QueryToDataStreamConverter -convert() called with argument that is not a query:"+ query ? JSON.stringify(query) : query;
            }
            return DataService.mainService.fetchData(query);
        }
    }

});
