var Montage = require("core/core").Montage;

/**
 * This object represents the data necessary for a DataService to connect to it's data source,
 * but leaves to RawDataServices the role
 * to specialize it in a way that reflects what they need.
 *
 * @class
 * @extends external:Montage
 */
exports.ConnectionDescriptor = Montage.specialize(/** @lends DataIdentifier.prototype */ {

    /**
     * The name of this descriptor
     *
     * @type {String}
     */
    name: {
        value: undefined
    }

});
