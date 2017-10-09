var DataSelector = require("data/model/data-selector").DataSelector;

/**
 * Backward compatibility support for data/service/data-selector after that
 * class has been moved to data/model/data-selector.
 *
 * @class
 * @extends external:Montage
 * @todo Deprecate.
 */
exports.DataSelector = DataSelector;
