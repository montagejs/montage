var Montage = require("montage").Montage,
    compile = require("frb/compile-evaluator"),
    parse = require("frb/parse"),
    deprecate = require("core/deprecate");


var ONE_WAY_BINDING = "<-";
var TWO_WAY_BINDING = "<->";

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
        get: function () {
            if (!this._expression && this.sourcePathSyntax) {
                this._expression = compile(this.sourcePathSyntax);
            }
            return this._expression;
        }
    },

    /**
     * The name of the property on the destination value that the destination object represents.
     * For example, consider:
     *
     * The MappingRule for Foo.bars will have inversePropertyName = foo.
     *
     * @type {string}
     */
    
    _inversePropertyName: {
        value: undefined
    },

    inversePropertyName: {
        get: deprecate.deprecateMethod(void 0, function () {
            return this._inversePropertyName;
        }, "MappingRule.inversePropertyName", "PropertyDescriptor.inversePropertyName", true),
        set: deprecate.deprecateMethod(void 0, function (value) {
            this._inversePropertyName = value;
        }, "MappingRule.inversePropertyName", "PropertyDescriptor.inversePropertyName", true)
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
        get: function () {
            if (!this._requirements && this.sourcePathSyntax) {
                this._requirements = this._parseRequirementsFromSyntax(this.sourcePathSyntax);
            }
            return this._requirements;
        }
    },

    /**
     * A converter that takes in the the output of #expression and returns the destination value.
     * When a reverter is specified the conversion use the revert method when mapping from
     * right to left.
     * 
     * @type {Converter}
     */
    reverter: {
        value: undefined
    },

    _parseRequirementsFromSyntax: {
        value: function (syntax, requirements) {
            var args = syntax.args,
                type = syntax.type;

            requirements = requirements || [];

            if (type === "property" && args[0].type === "value") {
                requirements.push(args[1].value);
            } else if (type === "property" && args[0].type === "property") {
                var subProperty = [args[1].value];
                this._parseRequirementsFromSyntax(args[0], subProperty);
                requirements.push(subProperty.reverse().join("."));
            } else if (type === "record") {
                this._parseRequirementsFromRecord(syntax, requirements);
            }

            return requirements;
        }
    },

    _parseRequirementsFromRecord: {
        value: function (syntax, requirements) {
            var self = this,
                args = syntax.args,
                keys = Object.keys(args);

            keys.forEach(function (key) {
                self._parseRequirementsFromSyntax(args[key], requirements);
            });
        }
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
     * Path of the property to which the value of the expression should be retrieved
     * @type {string}
     */
    sourcePath: {
        value: undefined
    },

    /**
     * Object created by parsing .sourcePath using frb/grammar.js that will
     * be used to evaluate the data
     * @type {Object}
     * */
    sourcePathSyntax: {
        get: function () {
            if (!this._sourcePathSyntax && this.sourcePath) {
                this._sourcePathSyntax = parse(this.sourcePath);
            }
            return this._sourcePathSyntax;
        }
    },

    /**
     * Path of the property to which the value of the expression should be assigned.
     * @type {string}
     */
    targetPath: {
        value: undefined
    },


    /**
     * Return the value of the property for this rule
     * @type {Scope}
     */
    evaluate: {
        value: function (scope) {
            var value = this.expression(scope);
            return this.converter ? this.converter.convert(value) :
                                    this.reverter ? 
                                    this.reverter.revert(value) :
                                    value;
        }
    },


}, {

    withRawRuleAndPropertyName: {
        value: function (rawRule, propertyName, addOneWayBindings) {
            var rule = new this(),
                sourcePath = addOneWayBindings ? rawRule[ONE_WAY_BINDING] || rawRule[TWO_WAY_BINDING] : propertyName,
                targetPath = addOneWayBindings && propertyName || rawRule[TWO_WAY_BINDING];
                
                rule.inversePropertyName = rawRule.inversePropertyName;
                rule.serviceIdentifier = rawRule.serviceIdentifier;
                rule.sourcePath = sourcePath;
                rule.targetPath = targetPath;
            
                return rule;
        }
    },

    

});
