/**
 * @module montage/data/service/expression-data-access-policy-rule
 */

var DataAccessPolicyRule = require("./data-access-policy-rule").DataAccessPolicyRule,
    Promise = require("../../core/promise").Promise,
    parse = require("../../core/frb/parse"),
    compileEvaluator = require("../../core/frb/compile-evaluator"),
    compileAssigner = require("../../core/frb/compile-assigner"),
    Scope = require("../../core/frb/scope");

/**
 * Sets an expression (left) on a data operation to the value resulting from the evaluation of a right expression,
 * to contribute to the decision of wether a data operation can be performed as is or as modified.
 * For examples, rules can be used to set values to properties or modify property content,
 * like filtering an operation read expressions before it gets executed by the relevant RawDataService.
 *
 *
 * @class
 * @extends external:DataAccessPolicyRule
 */


exports.ExpressionDataAccessPolicyRule = DataAccessPolicyRule.specialize(/** @lends ExpressionDataAccessPolicyRule.prototype */ {

    _scope: {
        value: undefined
    },

    scope: {
        get: function() {
            return this._scope || (this._scope = new Scope(null));
        }
    },

    /**
     * The descriptor, like one used in binding that contains source (right)
     * and target (left) expressions
     *
     * @property {Object}
     */
    descriptor: {
        set: function(value) {
            var targetExpression = Object.keys(value)[0],
                sourceDescriptor = value[targetExpression],
                sourceExpression = sourceDescriptor["="],
                sourceConverter = sourceDescriptor.converter,
                sourceReverter = sourceDescriptor.reverter,
                sourceParameters = sourceDescriptor.sourceParameters;

            //TODEBUG:
            this.sourceExpression = sourceExpression;
            this.targetExpression = targetExpression;

            this.sourceSyntax = parse(sourceExpression);
            this.compiledSourceEvaluator = compileEvaluator(this.sourceSyntax);
            this.targetSyntax = parse(targetExpression);
            this.compiledTargetAssigner = compileAssigner(this.targetSyntax);
            if(sourceConverter) {
                this.sourceConverter = sourceConverter;
            } else if(sourceReverter) {
                this.sourceReverter = sourceReverter;
            }
            if(sourceParameters) {
                this.sourceParameters = sourceParameters;
            }

            var scope = this.scope;
            scope.parameters = sourceDescriptor.sourceParameters;
            //scope.document = document;
            /*
                components - misnamed as named in the context of UI reels, are other objects in the serialization by label name.
            */
            // scope.components = components;


        }
    },

    /**
     * The sourceExpression, got from the descriptor
     *
     * @property {Object}
     */
    sourceExpression: {
        value: undefined
    },

    /**
     * The sourceExpression, got from the descriptor
     *
     * @property {Object}
     */
    sourceSyntax: {
        value: undefined
    },

    /**
     * The compiledSourceEvaluator, compiled from sourceExpression
     *
     * @property {Object}
     */
    compiledSourceEvaluator: {
        value: undefined
    },

    /**
     * The compiledSourceSyntaxEvaluator, compiled from sourceExpression
     *
     * @property {Object}
     */
    compiledTargetAssigner: {
        value: undefined
    },

    /**
     * A converter to transform source expression
     *
     * @property {Object}
     */
     sourceConverter: {
        value: undefined
    },

    /**
     * A converter to revert taregt to source expression
     *
     * @property {Object}
     */
     sourceReverter: {
        value: undefined
    },

    /**
     * Parameters for the source expression
     *
     * @property {Object}
     */
    sourceParameters: {
        value: undefined
    },

    _deserializer: {
        value: undefined
    },


    deserializeSelf: {
        value: function (deserializer) {
            var result, value;

            this._deserializer = deserializer;
            this.scope.components = deserializer;

            value = deserializer.getProperty("descriptor");
            if (value !== void 0) {
                this.descriptor = value;
            }
        }
    },

    evaluate: {
        value: function(dataOperation) {

            /*
                path -> sourcePath, value -> object in scope, components -> deserializer
                function evaluate(path, value, parameters, document, components) {
                    var syntax;
                    if (typeof path === "string") {
                        syntax = parse(path);
                    } else {
                        syntax = path;
                    }
                    var evaluate = compileEvaluator(syntax);
                    var scope = new Scope(value);
                    scope.parameters = parameters;
                    scope.document = document;
                    scope.components = components;
                    return evaluate(scope);
                }

                assign(
                    object,
                    targetPath,
                    typeof value === 'string' ? evaluate(value, object, null, null, deserializer) : value,
                    null,
                    null,
                    deserializer
                );


                function assign(target, path, value, parameters, document, components) {
                    var syntax;
                    if (typeof path === "string") {
                        syntax = parse(path);
                    } else {
                        syntax = path;
                    }
                    var assign = compileAssigner(syntax);
                    var scope = new Scope(target);
                    scope.parameters = parameters;
                    scope.document = document;
                    scope.components = components;
                    return assign(value, scope);
                }

            */

            var scope = this.scope,
                self = this;

            scope.value = dataOperation;

            var value = this.compiledSourceEvaluator(scope);

            if(this.sourceConverter) {
                value = this.sourceConverter.convert(value);
            } else if(this.sourceReverter) {
                value = this.sourceReverter.revert(value);
            }

            if(Promise.is(value)) {
                return value.then(function(value) {
                    return self.compiledTargetAssigner(value,scope);
                })
            } else {
                return this.compiledTargetAssigner(value,scope);
            }


        }
    }

        /*
            assign(
                object,
                targetPath,
                typeof value === 'string' ? evaluate(value, object, null, null, deserializer) : value,
                null,
                null,
                deserializer
            );

        */

});

