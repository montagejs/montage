var Montage = require("montage").Montage;

/**
 * Instructions to map raw data to model objects or model objects to model objects
 *
 * @class
 * @extends external:Montage
 */
exports.MappingRule = Montage.specialize(/** @lends MappingRule.prototype */ {


    /**
     * A converter that takes in the the output of #expression and returns the destination value.
     * @type {Converter}
     */
    converter: {
        value: undefined
    },

    /**
     * The expression that defines the input to be passed to .converter. If converter is not provided,
     * the output of the expression is assigned directly to the destination value.
     * @type {string}
     */
    expression: {
        value: undefined
    },

    /**
     * The name of the property on the destination value that the destination object represents.
     * For example, consider:
     *
     * The MappingRule for Foo.bars will have inversePropertyName = foo.
     *
     * @type {string}
     */
    inversePropertyName: {
        value: undefined
    },


    /**
     * Flag defining the direction of the conversion. If true, .expression
     * will be evaluated in reverse (evaluate the expression against the
     * destination & assign it to the source).
     * @type {boolean}
     */
    isReverter: {
        value: undefined
    },


    /**
     * The descriptor for the property that this rule applies to
     * @type {PropertyDescriptor}
     */
    propertyDescriptor: {
        value: undefined
    },

    /**
     * The names of the properties required to evaluate .expression
     *
     * The raw data that .expression is evaluated against may not
     * have all of the properties referenced in .expression before the
     * the MappingRule is used. This array is used at the time of mapping to
     * populate the raw data with any properties that are missing.
     *
     * @type {string[]}
     */
    requirements: {
        value: undefined
    },

    /**
     * Identifier for the child service of ExpressionDataMapping.service
     * that the destination value should be fetched from.
     * @type {string}
     */
    serviceIdentifier: {
        value: undefined
    },

    /**
     * Path of the property to which the value of the expression should be assigned.
     * @type {string}
     */
    targetPath: {
        value: undefined
    }
});
