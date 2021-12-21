
var Montage = require("./core").Montage;

var parse = require("./frb/parse"),
    stringify = require("./frb/stringify"),
    evaluate = require("./frb/evaluate"),
    operatorTypes = require("./frb/language").operatorTypes,
    Scope = require("./frb/scope"),
    syntaxProperties = require("./frb/syntax-properties"),
    compile = require("./frb/compile-evaluator"),
    SyntaxInOrderIterator = require("./frb/syntax-iterator").SyntaxInOrderIterator;

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
            return this._expression || (
                this._syntax
                    ? (this._expression = stringify(this._syntax))
                    : this._expression
                );
        },
        set: function(value) {
            if(value !== this._expression) {
                this._reset();
                this._expression = value;
            }
        }
    },
    /**
     * @type {object}
     */
    _parameters: {
        value: null
    },
    parameters: {
        get: function() {
            return this._parameters;
        },
        set: function(value) {
            if(value !== this._parameters) {
                this._parameters = value;
            }
        }
    },

    _reset: {
        value: function() {
            this._expression = null;
            this._compiledSyntax = null;

            //Reset qualifiedProperties cache
            this._qualifiedProperties = null;

            this._syntax = null;
        }
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
     * Now mutable to avoid creating new objects when appropriate
     *
     * @type {object}
     */
   syntax: {
        get: function() {
            return this._syntax || (this._syntax = parse(this._expression));
        },
        set: function(value) {
            if(value !== this._syntax) {
                //We need to reset:
                this._reset();
                this._syntax = value;
            }

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
     * Initialize a Criteria with a syntax, the expression parsed.
     *
     * @method
     * @returns {Criteria} - The Criteria initialized.
     */
    initWithSyntax: {
        value: function (syntax, parameters, scopeComponents) {
            this._syntax = syntax;
            this.parameters = parameters;

            if(scopeComponents) {
                this._setScopeComponents(scopeComponents);
            }
            return this;
        }
    },

    /**
     * Initialize a Criteria with a syntax, the expression parsed.
     *
     * @method
     * @returns {Criteria} - The Criteria initialized.
     */
    initWithCompiledSyntax: {
        value: function (compiledSyntax, parameters, scopeComponents) {
            this._compiledSyntax = compiledSyntax;
            this.parameters = parameters;

            if(scopeComponents) {
                this._setScopeComponents(scopeComponents);
            }
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

    clone: {
        value: function () {
            var clone = (new this.constructor);

            if(this._expression) {
                clone._expression = this._expression;
            }
            if(this._syntax) {
                clone._syntax = Object.clone(this._syntax);
            }
            if(this._compiledSyntax) {
                clone._compiledSyntax = this._compiledSyntax;
            }
            if(this._parameters) {
                clone._parameters = Object.clone(this._parameters,1);
            }
            if(this.__scope) {
                clone.__scope = Object.clone(this.__scope);
            }

            if(this._predicateFunction) {
                clone._predicateFunction = this._predicateFunction;
            }

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
            var value;
            value = deserializer.getProperty("expression") || deserializer.getProperty("path");
            if (value !== void 0) {
                this._expression = value;

                /*
                    If our expression has references to other objects in the serialization, we need to build them into our scope so we can evaluate
                */
                if(value.indexOf("@") !== -1) {
                    var componentIterator = new SyntaxInOrderIterator(this.syntax, "component"),
                        iLabel, iValue,
                        scopeComponents = new Map(),
                        currentSyntax;

                    /*
                        It's called components because that was the initial reason this was created, serialization was first used in .reels, for component templates.
                    */
                    this._setScopeComponents(scopeComponents);
                    //Alias get to the method name that frb complile-evaluator expects:
                    scopeComponents.getObjectByLabel = scopeComponents.get;

                    while ((currentSyntax = componentIterator.next("component").value)) {
                        iLabel = currentSyntax.label;
                        iValue = deserializer.getObjectByLabel(iLabel);

                        scopeComponents.set(iLabel,iValue);
                    }

                }
            }
            value = deserializer.getProperty("parameters");
            if (value !== void 0) {
                this.parameters = value;
            }
        }
    },

    equals: {
        value: function (otherCriteria) {
            if(this._expression && otherCriteria._expression) {
                if(
                    (this._expression === otherCriteria._expression) &&
                    Object.equals(this.parameters, otherCriteria.parameters)
                ) {
                    return true;
                } else {
                    return false;
                }
            } else if(this._syntax && otherCriteria._syntax) {
                if(
                    Object.equals(this._syntax, otherCriteria._syntax) &&
                    Object.equals(this.parameters, otherCriteria.parameters)
                ) {
                    return true;
                } else {
                    return false;
                }
            } else if(
                    //This will force an eventual stringification of a syntax
                    (this.expression === otherCriteria.expression) &&
                    Object.equals(this.parameters, otherCriteria.parameters)
                ) {
                return true;
            } else {
                return false;
            }
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

    /**
     * WONKY: scope's components are a map to object's by labels created in a serialization
     * where a criteria was created or setup. We don't have an easy way to add the getObjectByLabel
     * aliased method to get on the map as it's not typically exposed.
     * Scope object from frb doesn't have a setter for components and since it's never been a need so far
     * in bindings, which is performance sensitive, we're solving it here for now.
     *
     * @private
     * @type {function}
     */

    _setScopeComponents: {
        value: function(components /* Map */) {
            /*
                It's called components because that was the initial reason this was created, serialization was first used in .reels, for component templates.
            */
            this._scope.components = components;
            //Alias get to the method name that frb complile-evaluator expects:
            components.getObjectByLabel = components.get;
        }
    },
    evaluate: {
        value: function (value, parameters) {
            this._scope.parameters = parameters || this.parameters;
            this._scope.value = value;
            return this.compiledSyntax(this._scope);
        }
    },


    /**
     * Returns a function that performs evaluate on the criteria, allowing it to be used in array.filter for example.
     *
     * @method
     *
     * @returns {function} - boolean wether the criteri qualifies a value on propertyName.
     */

    _predicateFunction: {
        value: undefined
    },

    predicateFunction: {
        get: function () {
            var self = this;
            return this._predicateFunction || (
                this._predicateFunction = function(value) {
                    return self.evaluate(value);
                }
            );
        }
    },

    _qualifiedProperties: {
        value: undefined
    },
    /**
     * returns all properties used in criteria's expression/syntax
     *
     * @property {string}
     */
    qualifiedProperties: {
        get: function() {
            return this._qualifiedProperties || (this._qualifiedProperties = syntaxProperties(this.syntax));
        }
    },

    /**
     * Walks a criteria's syntactic tree to assess if one of more an expression
     * involving propertyName.
     *
     * @method
     * @argument {string} propertyName - a propertyName.
     *
     * @returns {boolean} - boolean wether the criteri qualifies a value on propertyName.
     */

    syntaxesQualifyingPropertyName: {
        value: function(propertyName) {
            console.warn("syntaxesQualifyingPropertyName() implementation missing");
        }
    },

    /**
     * Walks a criteria's syntax to assess if one of it contains an expression
     * involving propertyName.
     *
     * @method
     * @argument {string} propertyName - a propertyName.
     *
     * @returns {boolean} - boolean wether the criteri qualifies a value on propertyName.
     */

    qualifiesPropertyName: {
        value: function(propertyName) {
            console.warn("qualifiesPropertyName() implementation missing");
        }
    },



    /**
     * Walks a criteria's syntax:
     *  - replace $ parameter by {key:value}
     *  - alias own's parameter keys if conclicting with
     *
     * for example expression: "(firstName= $firstName) && (lastName = $lastName)"
     *             parameters: {
     *                  "firstName": "Han",
     *                  "lastName": "Solo"
     *             }
     *
     * @method
     * @argument {object} aliasedParameters - an object containg parameters that the receiver needs to become compatible with.
     * @argument {object} parameterCounters - an object containing a paramater root name and an incremented integer
     *                                      used to build a unique key as close to author's intent
     *
     * @returns {Criteria} - The Criteria initialized.
     */

    __syntaxByAliasingSyntaxWithParameters: {
        value: function (aliasedSyntax, parameterArg, parameterArgIndex, otherArg, otherArgIndex, aliasedParameters, parameterCounter, _thisParameters) {
            var aliasedParameter;

            if (otherArg.type !== "literal") {

                //We replace $ syntax by the $key/$.key syntax:
                aliasedSyntaxparameterArg = {};
                aliasedSyntaxparameterArg.type = "property";
                aliasedParameter = "parameter"+(++parameterCounter);
                aliasedSyntaxparameterArg.args = [
                    {
                        "type":"parameters"
                    },
                    {
                        "type":"literal",
                        "value": aliasedParameter
                    }
                ];
                aliasedSyntax.args[parameterArgIndex] = aliasedSyntaxparameterArg;
                aliasedSyntax.args[otherArgIndex] = this._syntaxByAliasingSyntaxWithParameters(otherArg, aliasedParameters, parameterCounter, _thisParameters);

                //and we register the criteria's parameter _thisParameters under the new key;
                aliasedParameters[aliasedParameter] = _thisParameters;
            } else {
                //We need to make sure there's no conflict with aliasedParameters
                parameter = otherArg.value;
                parameterValue = _thisParameters[parameter];
                if(aliasedParameters.hasOwnProperty(parameter) && aliasedParameters[parameter] !== parameterValue) {
                    aliasedParameter = parameter+(++parameterCounter);
                    aliasedParameters[aliasedParameter] = parameterValue;
                } else {
                    aliasedParameter = parameter;
                }
                aliasedSyntax.args[parameterArgIndex] = {
                        "type":"parameters"
                };

                aliasedSyntax.args[otherArgIndex] = {
                        "type":"literal",
                        "value":aliasedParameter
                };
                aliasedParameters[aliasedParameter] = parameterValue;
            }

        }
    },

    __syntaxByAliasingSyntaxWithScopeComponents: {
        value: function (aliasedSyntax, parameterArg, parameterArgIndex, otherArg, otherArgIndex, aliasedParameters, parameterCounter, _thisParameters) {
            var aliasedParameter;

            if (otherArg.type !== "literal") {

                //We replace $ syntax by the $key/$.key syntax:
                aliasedSyntaxparameterArg = {};
                aliasedSyntaxparameterArg.type = "property";
                aliasedParameter = "parameter"+(++parameterCounter);
                aliasedSyntaxparameterArg.args = [
                    {
                        "type":"parameters"
                    },
                    {
                        "type":"literal",
                        "value": aliasedParameter
                    }
                ];
                aliasedSyntax.args[parameterArgIndex] = aliasedSyntaxparameterArg;
                aliasedSyntax.args[otherArgIndex] = this._syntaxByAliasingSyntaxWithParameters(otherArg, aliasedParameters, parameterCounter, _thisParameters);

                //and we register the criteria's parameter _thisParameters under the new key;
                aliasedParameters[aliasedParameter] = _thisParameters;
            } else {
                //We need to make sure there's no conflict with aliasedParameters
                parameter = otherArg.value;
                parameterValue = _thisParameters[parameter];
                if(aliasedParameters.hasOwnProperty(parameter) && aliasedParameters[parameter] !== parameterValue) {
                    aliasedParameter = parameter+(++parameterCounter);
                    aliasedParameters[aliasedParameter] = parameterValue;
                } else {
                    aliasedParameter = parameter;
                }
                aliasedSyntax.args[parameterArgIndex] = {
                        "type":"parameters"
                };

                aliasedSyntax.args[otherArgIndex] = {
                        "type":"literal",
                        "value":aliasedParameter
                };
                aliasedParameters[aliasedParameter] = parameterValue;
            }

        }
    },


    _syntaxByAliasingSyntaxWithParameters: {
        value: function (syntax, aliasedParameters, parameterCounter, _thisParameters, aliasedScopeComponents, _thisScopeComponents, scopeComponentTranslation) {
            var aliasedSyntax = {},
                syntaxKeys = Object.keys(syntax),
                i, iKey,
                syntaxArg0 = syntax.args && syntax.args[0],
                aliasedSyntaxArg0,
                syntaxArg1 = syntax.args && syntax.args[1],
                aliasedSyntaxArg1,
                parameter,
                parameterValue,
                aliasedParameter;

            for(i=0;(iKey = syntaxKeys[i]);i++) {


                if(iKey === "args") {
                    aliasedSyntax.args = [];

                    if(syntaxArg0.type === "parameters") {
                        this.__syntaxByAliasingSyntaxWithParameters(aliasedSyntax, syntaxArg0, 0, syntaxArg1, 1, aliasedParameters, parameterCounter, _thisParameters, aliasedScopeComponents, _thisScopeComponents, scopeComponentTranslation);

                        // if (syntaxArg1.type !== "literal") {

                        //     //We replace $ syntax by the $key/$.key syntax:
                        //     aliasedSyntaxArg0 = {};
                        //     aliasedSyntaxArg0.type = "property";
                        //     aliasedParameter = "parameter"+(++parameterCounter);
                        //     aliasedSyntaxArg0.args = [
                        //         {
                        //             "type":"parameters"
                        //         },
                        //         {
                        //             "type":"literal",
                        //             "value": aliasedParameter
                        //         }
                        //     ];
                        //     aliasedSyntax.args[0] = aliasedSyntaxArg0;
                        //     aliasedSyntax.args[1] = this._syntaxByAliasingSyntaxWithParameters(syntaxArg1, aliasedParameters, parameterCounter, _thisParameters);

                        //     //and we register the criteria's parameter _thisParameters under the new key;
                        //     aliasedParameters[aliasedParameter] = _thisParameters;
                        // } else {
                        //     //We need to make sure there's no conflict with aliasedParameters
                        //     parameter = syntaxArg1.value;
                        //     parameterValue = _thisParameters[parameter];
                        //     if(aliasedParameters.hasOwnProperty(parameter) && aliasedParameters[parameter] !== parameterValue) {
                        //         aliasedParameter = parameter+(++parameterCounter);
                        //         aliasedParameters[aliasedParameter] = parameterValue;
                        //     } else {
                        //         aliasedParameter = parameter;
                        //     }
                        //     aliasedSyntax.args[0] = {
                        //             "type":"parameters"
                        //     };

                        //     aliasedSyntax.args[1] = {
                        //             "type":"literal",
                        //             "value":aliasedParameter
                        //     };
                        //     aliasedParameters[aliasedParameter] = parameterValue;
                        // }

                    }
                    else if(syntaxArg1 && syntaxArg1.type === "parameters") {
                        this.__syntaxByAliasingSyntaxWithParameters(aliasedSyntax, syntaxArg1, 1, syntaxArg0, 0, aliasedParameters, parameterCounter, _thisParameters, aliasedScopeComponents, _thisScopeComponents, scopeComponentTranslation);

                    } else {
                        if(syntaxArg0) {
                            aliasedSyntax.args[0] = this._syntaxByAliasingSyntaxWithParameters(syntaxArg0, aliasedParameters, parameterCounter, _thisParameters, aliasedScopeComponents, _thisScopeComponents, scopeComponentTranslation);
                        }

                        if(syntaxArg1) {
                            aliasedSyntax.args[1] = this._syntaxByAliasingSyntaxWithParameters(syntaxArg1, aliasedParameters, parameterCounter, _thisParameters, aliasedScopeComponents, _thisScopeComponents, scopeComponentTranslation);
                        }
                    }
                } else {

                    if(iKey === "type" && syntax.type === "component") {
                        var label = syntax.label,
                            newLabel = label,
                            _thisScopeComponentsLabelValue,
                            aliasedScopeComponentsLabelValue;

                        if(!(aliasedScopeComponentsLabelValue = aliasedScopeComponents.get(label))) {

                            aliasedScopeComponents.set(label, (_thisScopeComponentsLabelValue = _thisScopeComponents.get(label)));
                            scopeComponentTranslation.set(_thisScopeComponentsLabelValue,label);

                        } else if((_thisScopeComponentsLabelValue = _thisScopeComponents.get(label)) !== aliasedScopeComponentsLabelValue) {
                            /*
                                There's already a value for label in aliasedScopeComponents, but it's not the same as the one in _thisScopeComponents.

                                So we need to alias it.
                            */

                            /* Do we have a new label for that value? */
                            newLabel = scopeComponentTranslation.get(_thisScopeComponentsLabelValue);

                            var newLabelAliasedScopeComponentsValue;
                            if(!newLabel) {
                                newLabel = (label+(scopeComponentTranslation.size+1));
                                scopeComponentTranslation.set(_thisScopeComponentsLabelValue,newLabel);
                            }

                            newLabelAliasedScopeComponentsValue = aliasedScopeComponents.get(newLabel);
                            if(!newLabelAliasedScopeComponentsValue) {
                                aliasedScopeComponents.set(newLabel,_thisScopeComponentsLabelValue);
                            }
                            //debug, but that shouldn't happen:
                            else if(newLabelAliasedScopeComponentsValue !== _thisScopeComponentsLabelValue) {
                                throw "aliasedScopeComponents already has a different value for new label '"+newLabel+"`";
                            }
                        }

                        aliasedSyntax["type"] = syntax.type;
                        aliasedSyntax["label"] = newLabel;

                        //We've processed the whole syntax, no need to iterate further on it.
                        break;

                    } else {
                        aliasedSyntax[iKey] = syntax[iKey];
                    }
                }
            }

            /*
                                    JSON.stringify(d.syntax)
                                    //$key.has(id)", {"key":"123"}
                                    {
                                        "type":"has",
                                        "args":[
                                            {
                                                "type":"property",
                                                "args":[
                                                    {
                                                        "type":"parameters"
                                                    },
                                                    {
                                                        "type":"literal","
                                                        value":"key"
                                                    }
                                                ]
                                            },
                                            {
                                                "type":"property",
                                                "args":[
                                                    {
                                                        "type":"value"
                                                    },{
                                                        "type":"literal"
                                                        ,"value":"id"
                                                    }
                                                ]
                                            }
                                        ]
                                    }

                                    JSON.stringify(f.syntax)
                                    "$.has(id)", "123"
                                    {
                                        "type":"has",
                                        "args":[
                                            {
                                                "type":"parameters"
                                            },
                                            {
                                                "type":"property",
                                                "args":[
                                                    {
                                                        "type":"value"
                                                    },
                                                    {
                                                        "type":"literal",
                                                        "value":"id"
                                                    }
                                                ]
                                            }
                                        ]
                                    }

            */
            return aliasedSyntax;
        }
    },

    syntaxByAliasingSyntaxWithParameters: {
        value: function (aliasedParameters, aliasedScopeComponents, scopeComponentTranslation, parameterCounters) {
            return this._syntaxByAliasingSyntaxWithParameters(this.syntax, aliasedParameters, parameterCounters||0, this.parameters, aliasedScopeComponents, this._scope.components, scopeComponentTranslation);
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

function _combinedCriteriaFromArguments(type, receiver, _arguments) {
    // var args = Array.prototype.map.call(_arguments, function (argument) {
    //     if (typeof argument === "string") {
    //         return parse(argument);
    //     } else if (argument.syntax) {
    //         return argument.syntax;
    //     } else if (typeof argument === "object") {
    //         return argument;
    //     }
    // });
    var args = [],
        isInstanceReceiver = (typeof receiver === "object"),
        // parameters = isInstanceReceiver ? receiver.parameters : null,
        i = 0, argument, countI,
        j, countJ, argumentParameters, argumentParametersKeys, argumentParameter,
        aliasedParameters = {},
        aliasedScopeComponents = new Map,
        scopeComponentTranslation = new Map;

    for(countI = _arguments.length; (i<countI) ; i++ ) {
        argument = _arguments[i];
        if (typeof argument === "string") {
            //If it's a string, there can't really be a parameter argument with it's likely safe to just parse it
            args.push(parse(argument));
        } else if (argument.syntax) {
            //We alias anyway, as there could be an need in subsequent arguments.
            //if that's too expensive we can do a quick first pass to avoid creating new syntaxes.
            //at the same time, it might be safer that the new combined criteria has it's own independent syntactic tree.
            args.push(argument.syntaxByAliasingSyntaxWithParameters(aliasedParameters, aliasedScopeComponents, scopeComponentTranslation));

            // if(argumentParameters = argument.parameters) {
            //     if(parameters) {


                    /*
                        Both sides have parameters. We need to merge them, but we could have on either the case where one parameter is like
                        {
                            paramKey1: paramValue1,
                            paramKey2: paramValue2
                        }
                        referred in expression form as $paramKey1 or $.paramKey1
                        and syntax should looks like: ,"args":[{"type":"parameters"},{"type":"literal","value":"paramKey1"}]

                        and the other parameter could be uses a itself and be anything, like an array.
                        referred in expression form as $ = [1]
                         and syntax should looks like: "{"type":"has","args":[{"type":"parameters"},{"type":"property","args":[{"type":"value"},{"type":"literal","value":"id"}]}]}"

                         Example of a syntactic tree using the whole parameter object:
                         "$.has(id)"
                         JSON.stringify(argument._syntax)
                            "{"type":"has","args":[{"type":"parameters"},{"type":"property","args":[{"type":"value"},{"type":"literal","value":"id"}]}]}"

                        Example of a syntactic tree using a parameter object's entries:
                        "locale == $locale"
                        JSON.stringify(receiver.syntax)
                            "{"type":"equals","args":[{"type":"property","args":[{"type":"value"},{"type":"literal","value":"locale"}]},{"type":"property","args":[{"type":"parameters"},{"type":"literal","value":"locale"}]}]}"

                        In which case, the single parameter construct needs to be replaced by a key/value syntax
                        and put on the shared parameters.

                        or parameters could conflicts, with the same parameters key pointing to different values, in which case one should change.

                    */


                //     argumentParametersKeys = Object.keys(argumentParameters);
                //     for(j=0, countJ = argumentParametersKeys.length;(argumentParameter = argumentParametersKeys[j]); j++) {
                //         if(argumentParameter in parameters) {
                //             if(argumentParameters[argumentParameter] !== parameters[argumentParameter]) {
                //                 /*
                //                     TODO: In this situation, argument.parameters and argument.syntax needs to be walked to replace the confliciting symbols by a different unique one. In the mean time, flag it until we need to address that.
                //                 */
                //                 throw "!!! Criteria combined with "+type+" both have a parameter named the same but with different values but there is no aliasing implemented to guard against this so they don't conflic";
                //             }
                //             //Otherwise, nothing to do, same parameter with same value on both sides
                //         } else {
                //             //Move argumentParameter to parameters:
                //             parameters[argumentParameter] = argumentParameters[argumentParameter];
                //         }
                //     }
                // } else {
                //     //this didn't have a parameter, so we use the first one as the combined one.
                //     parameters = argumentParameters;
                // }
            //}

        } else if (typeof argument === "object") {
            args.push(argument);
        }
    }

    //When called from aCriteria.and("b") pattern
    if(isInstanceReceiver) {
        return new (receiver.constructor)().initWithSyntax({
            type: type,

            //args: [receiver.syntax].concat(args)
            args: [receiver.syntaxByAliasingSyntaxWithParameters(aliasedParameters, aliasedScopeComponents, scopeComponentTranslation)].concat(args)
        }, aliasedParameters, aliasedScopeComponents);
    }
    //When called from the Criteria.and("a", "b") pattern
    else {
        // invoked as class method
        return new receiver().initWithSyntax({
            type: type,
            args: args
        }, aliasedParameters, aliasedScopeComponents);
    }
}

// generate methods on Criteria for each of the tokens of the language.
// support invocation both as class and instance methods like
// Criteria.and("a", "b") and aCriteria.and("b")
var CriteriaPrototype = Criteria.prototype;
operatorTypes.forEach(function (value,operator, operatorTypes) {
    Montage.defineProperty(CriteriaPrototype, operator, {
        value: function () {
            return _combinedCriteriaFromArguments(operator, this, arguments);
        }
    });
    Montage.defineProperty(Criteria, operator, {
        value: function () {
            return _combinedCriteriaFromArguments(operator, this, arguments);
        }
    });
});

// Object.defineProperties(Criteria.prototype,{

// _then: {
//     value: undefined
// },
// then: {
//     get: function(value) {
//         return this._then;
//     },
//     set: function(value) {
//         this._then = value;
//     }
// }
// });
