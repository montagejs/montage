/**
 * @module montage/core/converter/trim-converter
 * @requires montage/core/converter/converter
 */
var Converter = require("./converter").Converter,
    parse = require("frb/parse"),
    Scope = require("frb/scope"),
    compile = require("frb/compile-evaluator");

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
                this.__compiledConvertExpression = undefined;
            }
        }
    },
    __compiledConvertExpression: {
        value: undefined
    },
    _compiledConvertExpression: {
        get: function() {
            return this.__compiledConvertExpression || (this.__compiledConvertExpression = compile(parse(this.convertExpression)));
        }
    },


    _revertExpression: {
        value: "service.dataIdentifierForObject($).primaryKey"
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
                this.__compiledRevertExpression = undefined;
            }
        }
    },

    __compiledRevertExpression: {
        value: undefined
    },
    _compiledRevertExpression: {
        get: function() {
            return this.__compiledRevertExpression || (this.__compiledRevertExpression = compile(parse(this.revertExpression)));
        }
    },
    __scope: {
        value: null
    },
    _scope: {
        get: function() {
            return this.__scope || (this.__scope = new Scope());
        }
    },

    convert: {
        value: function (v) {
            this._scope.value = v;
            return this._compiledConvertExpression(this._scope);
        }
    },
    revert: {
        value: function (v) {
            this._scope.value = v;
            return this._compiledRevertExpression(this._scope);
        }
    }

});

