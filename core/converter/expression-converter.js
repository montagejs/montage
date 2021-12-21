/**
 * @module montage/core/converter/trim-converter
 * @requires montage/core/converter/converter
 */
var Converter = require("./converter").Converter,
    parse = require("../../core/frb/parse"),
    Scope = require("../../core/frb/scope"),
    compile = require("../../core/frb/compile-evaluator")
    deprecate = require("../deprecate");

/**
 * @class ExpressionConverter
 * @classdesc Uses an expressions to convert and another to revert.
 * @example
 * <caption>Returns the value of specific property of an object.</caption>
 * var ExpressionConverter = require("./expression-converter").ExpressionConverter,
 *     expressionConverter = new ExpressionConverter(),
 *     convertedValue;
 * expressionConverter.convertExpression = "foo";
 * convertedValue = expressionConverter.convert({foo:"A"})
 * console.log("After expressionConversion: " + convertedValue);
 * //convertedValue: "A"
 */
exports.ExpressionConverter = Converter.specialize( /** @lends TrimConverter# */ {

    /*********************************************************************
     * Initialization
     */

    /**
     * @param {string} convertExpression the expression to be used for building a criteria to obtain the object corresponding to the value to convert.
     * @return itself
     */
    initWithConvertExpression: {
        value: function (convertExpression) {
            this.convertExpression = convertExpression;
            return this;
        }
    },

    /*********************************************************************
     * Serialization
     */

    serializeSelf: {
        value: function (serializer) {

            serializer.setProperty("convertExpression", this.convertExpression);

            serializer.setProperty("revertExpression", this.revertExpression);

        }
    },
    deserializeSelf: {
        value: function (deserializer) {
            var value = deserializer.getProperty("convertExpression");
            if (value) {
                this.convertExpression = value;
            }

            value = deserializer.getProperty("revertExpression");
            if (value) {
                this.revertExpression = value;
            }
        }
    },

    _convertExpression: {
        value: null
    },
    /**
     * The expression used to convert a value.
     * @type {string}
     */
    convertExpression: {
        get: function() {
            return this._convertExpression;
        },
        set: function(value) {
            if(value !== this._convertExpression) {
                this._convertExpression = value;
                //Reset parsed & compiled version:
                this._convertSyntax = undefined;
                this._compiledConvertSyntax = undefined;
            }
        }
    },

    _convertSyntax: {
        value: undefined
    },

    /**
     * Object created by parsing .convertExpression using frb/grammar.js that will
     * be used to initialize the convert query criteria
     * @type {Object}
     * */

    convertSyntax: {
        get: function() {
            return (this._convertSyntax ||
                ((this._convertSyntax === undefined)    ? (this._convertSyntax = (this.convertExpression ? parse(this.convertExpression) : null))
                                                        : null));
        }
    },

    _compiledConvertSyntax: {
        value: undefined
    },
    compiledConvertSyntax: {
        get: function() {
            return this._compiledConvertSyntax ||
                    (this._compiledConvertSyntax === undefined   ? this._compiledConvertSyntax = this.convertSyntax    ? compile(this.convertSyntax)
                                                                                                                    : null
                                                                : null);
        }
    },
    _compiledConvertExpression: {

        get: deprecate.deprecateMethod(void 0, function () {
            return this.compiledConvertSyntax;
        }, "_compiledConvertExpression", "compiledConvertSyntax", true)
    },

    _revertExpression: {
        value: null
    },
    /**
     * The expression used to revert a value.
     * @type {string}
     */
    revertExpression: {
        get: function() {
            return this._revertExpression;
        },
        set: function(value) {
            if(value !== this._revertExpression) {
                this._revertExpression = value;
                //Reset parswd & compiled version:
                this._revertSyntax = undefined;
                this._compiledRevertSyntax = undefined;
            }
        }
    },

    _revertSyntax: {
        value: undefined
    },

    /**
     * Object created by parsing .revertExpression using frb/grammar.js that will
     * be used to revert the modeled value into a raw one
     * @type {Object}
     * */
    revertSyntax: {
        get: function() {
            return this._revertSyntax ||
                (this._revertSyntax === undefined  ? this._revertSyntax = this.revertExpression ? parse(this.revertExpression)
                                                                                                                        : null
                                                    : null);
        }
    },

    _compiledRevertSyntax: {
        value: undefined
    },

    compiledRevertSyntax: {
        get: function() {
            return this._compiledRevertSyntax ||
                    (this._compiledRevertSyntax === undefined   ? this._compiledRevertSyntax = this.revertSyntax    ? compile(this.revertSyntax)
                                                                                                                    : null
                                                                : null);
        }
    },

    _compiledRevertExpression: {

        get: deprecate.deprecateMethod(void 0, function () {
            return this.compiledRevertSyntax;
        }, "_compiledRevertExpression", "compiledRevertSyntax", true)
    },

    __scope: {
        value: null
    },

    /**
     * Scope with which convert and revert expressions are evaluated.
     * @type {?Scope}
     **/
    scope: {
        get: function() {
            return this.__scope || (this.__scope = new Scope());
        },
        set: function(value) {
            this.__scope = value;
        }
    },
    _scope: {
        get: deprecate.deprecateMethod(void 0, function () {
            return this.scope;
        }, "_scope", "scope", true)
    },

    convert: {
        value: function (v) {
            this.scope.value = v;
            return this.compiledConvertSyntax(this.scope);
        }
    },
    revert: {
        value: function (v) {
            this.scope.value = v;
            return this.compiledRevertSyntax(this.scope);
        }
    }

});

