var Identity = require("./identity").Identity,
    DataQuery = require("./data-query").DataQuery;

/**
 * A DataIdentity represents an object that is the entry point to an application,
 * typically passed as an argument in the URL, useful for anonymous use-cases,
 * like coordinating coming into store where capacity is limited, without forcing users
 * to provide their identity.
 *
 * Once authenticating a user with a data object related entry point, the application can then
 * restrict access to the sub-graph from that object and nothing else, allowing to lock-down
 * access to data without knowing who the use is.
 *
 * It is possible that one application could have a data entry point like this, but also ask
 * proper user identity.

 * @class
 * @extends external:Montage
 */
exports.DataIdentity = Identity.specialize(/** @lends DataIdentity.prototype */ {
    identifier: {
        value: "DataIdentity"
    },
    /**
     * The DataService that created this DataIdenty
     *
     * @type {DataService}
     */
    query: {
        value: undefined
    }

});
