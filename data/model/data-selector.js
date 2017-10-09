
var DataQuery = require("data/model/data-query").DataQuery;

/**
 * Backward compatibility support for data/model/data-selector after that
 * class has been renamed to data/model/data-query.
 *
 * @class
 * @extends external:Montage
 * @todo Deprecate.
 */

exports.DataSelector = DataQuery;
