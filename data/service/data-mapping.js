var Montage = require("core/core").Montage;

/**
 * Maps raw data to data objects of a specific type.
 *
 * Currently services define their mapping by overriding their
 * [mapRawDataToObject()]{@link DataService#mapRawDataToObject} and
 * [mapObjectToRawData()]{@link DataService#mapObjectToRawData} methods or by
 * using a {@link DataMapping} subclass that overrides its
 * [mapRawDataToObject()]{@link DataMapping#mapRawDataToObject} and
 * [mapRawDataToObject()]{@link DataMapping#mapRawDataToObject} methods. In the
 * future it will be possible to define mappings declaratively through mapping
 * descriptors read from blueprint files.
 *
 * @class
 * @extends external:Montage
 */
exports.DataMapping = Montage.specialize(/** @lends DataMapping.prototype */ {

    /***************************************************************************
     * Mapping
     */

    /**
     * Convert raw data to data objects of an appropriate type.
     *
     * Subclasses should override this method to map properties of the raw data
     * to data objects, as in the following:
     *
     *     mapRawDataToObject: {
     *         value: function (object, data) {
     *             object.firstName = data.GIVEN_NAME;
     *             object.lastName = data.FAMILY_NAME;
     *         }
     *     }
     *
     * The default implementation of this method copies the properties defined
     * by the raw data object to the data object.
     *
     * @method
     * @argument {Object} object - An object whose properties must be set or
     *                             modified to represent the raw data.
     * @argument {Object} data   - An object whose properties' values hold
     *                             the raw data.
     * @argument {?} context     - A value that was passed in to the
     *                             [addRawData()]{@link DataService#addRawData}
     *                             call that invoked this method.
     */
    mapRawDataToObject: {
        value: function (data, object, context) {
            var i, key,
                keys = Object.keys(data);
            if (data) {
                for (i = 0; (key = keys[i]); ++i) {
                    object[key] = data[key];
                }
            }
        }
    },

    /**
     * @todo Document.
     */
    mapObjectToRawData: {
        value: function (object, data) {
            // TO DO: Provide a default mapping based on object.TYPE.
            // For now, subclasses must override this.
        }
    },

    nullPromise: {
        get: function () {
            if (!this._nullPromise) {
                this._nullPromise = Promise.resolve(null);
            }
            return this._nullPromise;
        }
    },

    /***************************************************************************
     * Deprecated
     */

    /**
     * @todo Document deprecation in favor of
     * [mapRawDataToObject()]{@link DataMapping#mapRawDataToObject}
     */
    mapFromRawData: {
        value: function (object, record, context) {
            this.mapRawDataToObject(record, object, context);
        }
    },

    /**
     * @todo Document deprecation in favor of
     * [mapObjectToRawData()]{@link DataMapping#mapObjectToRawData}
     */
    mapToRawData: {
        value: function (object, record) {
            this.mapObjectToRawData(object, record);
        }
    }

},{

    withObjectDescriptor: {
        value: function (objectDescriptor) {
            var mapping = new this();
            mapping._descriptor = objectDescriptor;
            return mapping;
        }
    }
});
