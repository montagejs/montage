
var Montage = require("./core").Montage;

var parse = require("frb/parse"),
    stringify = require("frb/stringify"),
    evaluate = require("frb/evaluate"),
    precedence = require("frb/language").precedence,
    Scope = require("frb/scope"),
    compile = require("frb/compile-evaluator");

var Criteria = exports.Criteria = Montage.specialize({
    _expression: {
        value: null
    },

    /**
     * returns Criteria's expression, which is not expected to change after being
     * initialized
     *
     * @type {string}
     */

    expression: {
        get: function() {
            return this._expression
        }
    },
    parameters: {
        value: null
    },
    /**
     * @private
     * @type {object}
     */
    _syntax: {
        value: null
    },
    /**
     * The parsed expression, a syntactic tree.
     *
     * @type {object}
     */
   syntax: {
        get: function() {
            return this._syntax || (this._syntax = parse(this._expression));
        }
    },
    _compiledSyntax: {
        value: null
    },
    /**
     * The compiled expression, a function, that is used directly for evaluation.
     *
     * @type {function}
     */
   compiledSyntax: {
        get: function() {
            return this._compiledSyntax || (this._compiledSyntax = compile(this.syntax));
        }
    },

    /**
     * Initialize a Criteria with a compiled syntax.
     *
     * @method
     * @returns {Criteria} - The Criteria initialized.
     */
    initWithSyntax: {
        value: function (syntax, parameters) {
            this._syntax = syntax;
            this.parameters = parameters;
            return this;
        }
    },

    /**
     * Initialize a Criteria with an expression as string representation
     *
     * for example expression: "(firstName= $firstName) && (lastName = $lastName)"
     *             parameters: {
     *                  "firstName": "Han",
     *                  "lastName": "Solo"
     *             }
     *
     * @method
     * @argument {string} expression - A string representaton of the criteria
     *                                  expected to be a valid Montage expression.
     * @argument {object} parameters - Optional object containing value for an expressions' prameters
     *
     * @returns {Criteria} - The Criteria initialized.
     */
    initWithExpression: {
        value: function (expression,parameters) {
            this._expression = expression;
            this.parameters = parameters;
            return this;
        }
    },

    /**
     * Backward compatibility with selector.js
     *
     * @type {function}
     */
   initWithPath: {
        value: function (path) {
            return this.initWithExpression(path);
        }
    },


    criteriaWithParameters: {
        value: function (parameters) {
            var clone = (new this.constructor).initWithExpression(this.expression);
            clone.parameters = parameters;
            return clone;
        }
    },

    serializeSelf: {
        value: function (serializer) {
            serializer.setProperty("expression", this._expression || (this._expression = stringify(this.syntax)));
            serializer.setProperty("parameters", this.parameters);
        }
    },

    deserializeSelf: {
        value: function (deserializer) {
            this._expression = deserializer.getProperty("expression") || deserializer.getProperty("path");
            this.parameters = deserializer.getProperty("parameters");
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
    evaluate: {
        value: function (value, parameters) {
            this._scope.parameters = parameters || this.parameters;
            this._scope.value = value;
            return this.compiledSyntax(this._scope);
        }
    }

},{
    forObjectsLike: {
        value: function(object) {
            var properties = Object.keys(object),
                expression = "",
                i, iKey, iValue,
                j, jValue, jExpression, jKey;

            for(i=0;(iKey = properties[i]);i++) {
                iValue = object[iKey];
                if(Array.isArray(iValue)) {
                    jExpression = "";

                    for(j=0;(jValue = iValue[j]);j++) {
                        jKey = iKey;
                        jKey += j;

                        if(jExpression.length > 0) {
                            jExpression += " && ";
                        }
                        jExpression += iKey;
                        jExpression += ".has($";
                        jExpression += jKey;
                        jExpression += ")";

                        //Now alias the value on object;
                        object[jKey] = jValue;
                    }

                    if(expression.length > 0) {
                        expression += " && ";
                    }
                    expression += jExpression;
                }
                else {
                    if(expression.length > 0) {
                        expression += " && ";
                    }

                    expression += iKey;
                    expression += "== $";
                    expression += iKey;
                }
            }

            return (new this).initWithExpression(expression,object);
        }
    },

    withExpression: {
        value: function(expression,parameters) {
            return (new this).initWithExpression(expression,parameters);
        }
    },
    withSyntax: {
        value: function(syntax,parameters) {
            return (new this).initWithSyntax(syntax,parameters);
        }
    }

});

// generate methods on Criteria for each of the tokens of the language.
// support invocation both as class and instance methods like
// Selector.and("a", "b") and aSelector.and("b")
precedence.forEach(function (value,type, precedence) {
    Montage.defineProperty(Criteria.prototype, type, {
        value: function () {
            var args = Array.prototype.map.call(arguments, function (argument) {
                if (typeof argument === "string") {
                    return parse(argument);
                } else if (argument.syntax) {
                    return argument.syntax;
                } else if (typeof argument === "object") {
                    return argument;
                }
            });
            // invoked as instance method
            return new (this.constructor)().initWithSyntax({
                type: type,
                args: [this.syntax].concat(args)
            });
        }
    });
    Montage.defineProperty(Criteria, type, {
        value: function () {
            var args = Array.prototype.map.call(arguments, function (argument) {
                if (typeof argument === "string") {
                    return parse(argument);
                } else if (argument.syntax) {
                    return argument.syntax;
                } else if (typeof argument === "object") {
                    return argument;
                }
            });
            // invoked as class method
            return new this().initWithSyntax({
                type: type,
                args: args
            });
        }
    });
});
