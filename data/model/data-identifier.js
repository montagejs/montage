var Montage = require("core/core").Montage;

/**
 * A DataIdentifier represents a universal identifier for an object managed by
 * Montage Data.  It provides the support for uniquing in a DataService.
 * Whether an object exists in one or more local DataServices in an Application
 * or in a remote one, a DataIdentifier encapsulates the information needed to
 * uniquely identify an object, like a primary key in a database.  A DataIdentifier
 * has a URL representation, which is conceptually aligned with the notion of
 * resource. It should have:
 *
 * - a host/source/origin: where the data come from. Automatically generated
 * primary keys exists in only one environment - Dev, test, prod, etc...,
 * (a user's authorization (if any necessary) should be left to be resolved
 * by a client receiving the identifier, only people authenticated and authorized
 * would be able to get it and that happens at DataService level)
 *
 * - a type
 *
 * - a primary key. This could be a combination of property/value, but it needs
 * to be serializable as a valid url
 *
 * Exact details are not exposed and may vary per specific DataService or RawDataService
 *
 * @class
 * @extends external:Montage
 */
exports.DataIdentifier = Montage.specialize(/** @lends DataIdentifier.prototype */ {

    /**
     * The DataService that created this DataIdentifier
     *
     * @type {DataService}
     */
    dataService: {
        value: undefined
    },

    /**
     * The ObjectDescriptor associated with a dataIdentifier if available
     *
     * @type {ObjectDescriptor}
     */
    objectDescriptor: {
        value: undefined
    },

    /**
     * The primaryKey of the object the dataIdentifier represents
     *
     * @type {Object}
     */
    primaryKey: {
        value: undefined
    },

    /**
     * The primaryKey of the object the dataIdentifier represents
     *
     * @type {String}
     */
    _typeName:{
        value: undefined
    },
    typeName: {
        get: function() {
            return this._typeName || (this._typeName = this.objectDescriptor ? this.objectDescriptor.name : "MISSING_TYPE_NAME");
        },
        set: function(value) {
            this._typeName = value;
        }
    },

    /**
     * Whether a DataIdentifier is persistent/final vs temporary when created
     * client side.
     *
     * @type {boolean}
     */
    isPersistent: {
        value: false
    },

    _identifier: {
        value: false
    },

    _url: {
        value: undefined
    },

    /**
     * The url representation of a dataIdentifier
     *
     * @type {string}
     */
    url: {
        get: function () {
            if(!this._url) {
                var _url = "montage-data://";
                _url += this.dataService.identifier;
                _url += "/";
                _url += this.dataService.connectionDescriptor ? this.dataService.connectionDescriptor.name : "default";
                _url += "/";
                _url += this.objectDescriptor.name;
                _url += "/";
                _url += this.primaryKey;
                this._url = _url;
            }
            return this._url;
        },
        set: function (value) {
            return (this._url = value);
        }
    }

});
