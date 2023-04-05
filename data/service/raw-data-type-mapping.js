/**
    @module montage/data/service/raw-data-type-mapping
*/


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
            if (value) {
                this.criteria = value instanceof Criteria ? value : new Criteria().initWithExpression(value.expression, value.parameters);
            } else {
                value = deserializer.getProperty("expression");
                this.expression = value;
            }

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
     * Expression to evaluate against the rawData object to determine
     * if it represents an instance of the class defined by the
     * object descriptor assigned to RawDataTypeMapping.type.
     * @type {string}
     */
    expression: {
        get: function () {
            return this.criteria ? this.criteria.expression : null;
        },
        set: function (value) {
            if (!this.criteria) {
                this.criteria = new Criteria().initWithExpression(value);
            } else {
                this.criteria.initWithExpression(value);
            }
        }
    },


    expressionSyntax: {
        get: function() {
            return this.criteria.syntax;
        }
    },

    _rawDataProperty: {
        value: undefined
    },

    /*
        Assuming the raw-data-type-mapping expressions are of the form: "aForeignKeyId.defined()" . We might have to make it mmore general?
    */

    rawDataProperty: {
        get: function() {
            if(this._rawDataProperty === undefined) {
                var expressionSyntax = this.expressionSyntax;

                if(expressionSyntax.type === "defined" && expressionSyntax.args[0].type === "property") {
                    this._rawDataProperty = expressionSyntax.args[0].args[1].value;
                } else {
                    console.error("Couldn't determine rawDataProperty from  RawDataTypeMapping:",this, " expressionSyntax:", this.expressionSyntax);
                    this._rawDataProperty = null;
                }
            }
            return this._rawDataProperty;
        }
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
            mapping.expression = expression;
            return mapping;
        }
    }

});
