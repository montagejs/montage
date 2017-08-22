var Montage = require("core/core").Montage;

/**
 * Describes a property of objects of a certain type.
 * @deprecated
 * @class
 * @extends external:Montage
 */
exports.PropertyDescriptor = Montage.specialize(/** @lends PropertyDescriptor.prototype */ {

    /**
     * @type {boolean}
     */
    isRelationship: {
        value: false
    },

    /**
     * @type {boolean}
     */
    isOptional: {
        value: false
    }

});
