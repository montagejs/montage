var DataMapping = require("data/service/data-mapping").DataMapping;

/**
 * Maps raw data to data objects of a specific type by using a blueprint.
 **
 * @class
 * @extends external:Montage
 */
exports.BlueprintDataMapping = DataMapping.specialize(/** @lends BlueprintDataMapping.prototype */ {

    _blueprint: {
        value: undefined
    },

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
            var propertyBlueprints = this._blueprint.propertyDescriptors,
                attributes = data.attributes || data,
                // relationships = data.relationships,
                i, length, property, propertyKey, value;



            for (i = 0, length = propertyBlueprints.length; i < length; i++) {
                property = propertyBlueprints[i];
                propertyKey = property.synonym || property.name;
                if (attributes && propertyKey in attributes) {
                    value = attributes[propertyKey];

                    /*
                    var moment = require("moment-timezone");
                    if (typeof moment !== 'undefined') {
                        if (property.valueType === "date") {
                            value = new moment(Number(value));
                        } else if (property.valueType === "duration") {
                            value = moment.duration(Number(value));
                        }
                    }
                    */

                    object[property.name] = value;

                    //console.log(property.name +" found in attributes");
                // }
                // else if(relationships && property.name in relationships) {
                //     //object[property.name] = attributes[property.name];
                //     //console.log(property.name +" found in relationshios");
                // }
                // else {
                //     //console.log(property.name +" NOT found in data");
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
            var propertyBlueprints = this._blueprint.propertyDescriptors,
                attributes = data.attributes,
                // relationships = data.relationships,
                i, length, property, propertyKey;

            //console.log("mapFromRawData",object,data,context);

            for (i = 0, length = propertyBlueprints.length; i < length; i++) {
                property = propertyBlueprints[i];
                propertyKey = property.synonym || property.name;
                if (attributes && property.name in attributes) {
                    attributes[propertyKey] = object[property.name];
                    //console.log(iProperty.name +" found in attributes");
                    // }
                    // else if(relationships && property.name in relationships) {
                    //     //object[iProperty.name] = attributes[iProperty.name];
                    //     //console.log(iProperty.name +" found in relationships");
                    // }
                    // else {
                    //     //console.log(iProperty.name +" NOT found in data");
                }

            }

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

}, {

    withBlueprint: {
        value: function (blueprint) {
            var mapping = new this();
            mapping._blueprint = blueprint;
            return mapping;
        }
    }

});
