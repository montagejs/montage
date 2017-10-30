var Montage = require("montage").Montage,
    Criteria = require("core/criteria").Criteria,
    ObjectDescriptor = require("core/meta/object-descriptor").ObjectDescriptor;


/**
 * Instructions for a [RawDataService]{@link RawDataService} to use
 * to determine if a rawData object corresponds to a particular class.
 * 
 * @class RawDataTypeMapping
 * @extends Montage
 */
exports.RawDataTypeMapping = Montage.specialize({

    deserializeSelf: {
        value: function (deserializer) {
            this.super(deserializer);
            var value;
            this.type = deserializer.getProperty("type");
            value = deserializer.getProperty("criteria");
            if (!value) {
                value = deserializer.getProperty("expression");
                if (value) {
                    value = new Criteria().initWithExpression(value);
                }
            } else if (!(value instanceof Criteria)) {
                value = new Criteria().initWithExpression(value.expression, value.parameters);
            } 
            
            this.criteria = value;
        }
    },
    

    serializeSelf: {
        value: function (serializer) {
            //TODO
        }
    },

    /**
     * Criteria to evaluate against the rawData object to determine 
     * if it represents an instance of the class defined by the 
     * object descriptor assigned to RawDataTypeMapping.type.
     * @type {Criteria}
     */
    criteria: {
        value: undefined
    },


    /**
     * Class to create an instance of when RawDataTypeMapping.criteria.evaluate
     * evaluates a rawData object to true
     * @type {ObjectDescriptor}
     */
    type: {
        value: undefined
    },


    /**
     * Return whether a rawDataObject matches this.criteria
     * @method
     * @param {Object} rawData 
     */
    match: {
        value: function (rawData) {
            return !!this.criteria.evaluate(rawData);
        }  
    },

}, {

    withTypeAndCriteria: {
        value: function (type, criteria) {
            var mapping = new this();
            mapping.type = type;
            mapping.criteria = criteria;
            return mapping;
        }
    },

    withTypeAndExpression: {
        value: function (type, expression) {
            var mapping = new this();
            mapping.type = type;
            mapping.criteria = new Criteria().initWithExpression(expression);
            return mapping;
        }
    }

}); 