
var Object = require("collections/shim-object");
var Map = require("collections/map");
var SortedSet = require("collections/sorted-set");
var Operators = require("./operators");
var Scope = require("./scope");

module.exports = compile;
function compile(syntax) {
    return compile.semantics.compile(syntax);
}

var compilers = {

    literal: function (syntax) {
        return function () {
            return syntax.value;
        };
    },

    value: function (syntax) {
        return function (scope) {
            return scope.value;
        };
    },

    parameters: function (syntax) {
        return function (scope) {
            return scope.parameters;
        };
    },

    element: function (syntax) {
        return function (scope) {
            return scope.document.getElementById(syntax.id);
        };
    },

    component: function (syntax) {
        return function (scope) {
            return scope.components.getObjectByLabel(syntax.label);
        };
    },

    tuple: function (syntax) {
        var argEvaluators = syntax.args.map(this.compile, this);
        return function (scope) {
            return argEvaluators.map(function (evaluateArg) {
                return evaluateArg(scope);
            });
        };
    },

    record: function (syntax) {
        var args = syntax.args,
            argEvaluators = {},
            names = Object.keys(args),
            name, i;
        for (i=0;(name=names[i]);i++) {
            argEvaluators[name] = this.compile(args[name]);
        }
        return function (scope) {
            var object = {},
                names = Object.keys(argEvaluators);
                for (i=0;(name=names[i]);i++) {
                object[name] = argEvaluators[name](scope);
            }
            return object;
        };
    }

};

var argCompilers = {

    mapBlock: function (evaluateCollection, evaluateRelation) {
        return function (scope) {
            var  result = evaluateCollection(scope);
            return result
                ?  result.map(function (value) {
                    return evaluateRelation(scope.nest(value));
                })
                : result;
        };
    },

    filterBlock: function (evaluateCollection, evaluatePredicate) {
        return function (scope) {
            var  result = evaluateCollection(scope);

            return result
                ? result.filter(function (value) {
                    return evaluatePredicate(scope.nest(value));
                })
                : result;
        };
    },

    someBlock: function (evaluateCollection, evaluatePredicate) {
        return function (scope) {
            var  result = evaluateCollection(scope);

            return result
                ?  result.some(function (value) {
                    return evaluatePredicate(scope.nest(value));
                })
                : result;
        };
    },

    everyBlock: function (evaluateCollection, evaluatePredicate) {
        return function (scope) {
            var  result = evaluateCollection(scope);

            return result
                ? result.every(function (value) {
                    return evaluatePredicate(scope.nest(value));
                })
                : result;
        };
    },

    sortedBlock: function (evaluateCollection, evaluateRelation) {
        return function (scope) {
            var  result = evaluateCollection(scope);

            return result
                ? result.sorted(Function.by(function (value) {
                    return evaluateRelation(scope.nest(value));
                }))
                : result;
        };
    },

    sortedSetBlock: function (evaluateCollection, evaluateRelation) {
        return function (scope) {
            function map(x) {
                return evaluateRelation(scope.nest(x));
            }
            function contentCompare(x, y) {
                return Object.compare(map(x), map(y));
            }
            function contentEquals(x, y) {
                return Object.equals(map(x), map(y));
            }
            return new SortedSet(
                evaluateCollection(scope),
                contentEquals,
                contentCompare
            );
        };
    },

    groupBlock: function (evaluateCollection, evaluateRelation) {
        return function (scope) {
            var  result = evaluateCollection(scope);

            return result
                ? result.group(function (value) {
                return evaluateRelation(scope.nest(value));
                })
                : result;
        };
    },

    groupMapBlock: function (evaluateCollection, evaluateRelation) {
        return function (scope) {
            return new Map(evaluateCollection(scope)
            .group(function (value) {
                return evaluateRelation(scope.nest(value));
            }));
        };
    },

    minBlock: function (evaluateCollection, evaluateRelation) {
        return function (scope) {
            var  result = evaluateCollection(scope);

            return result
                ? result.min(Function.by(function (value) {
                    return evaluateRelation(scope.nest(value));
                }))
                : result;
        };
    },

    maxBlock: function (evaluateCollection, evaluateRelation) {
        return function (scope) {
            var  result = evaluateCollection(scope);

            return result
                ? result.max(Function.by(function (value) {
                return evaluateRelation(scope.nest(value));
            }))
            : result;

        };
    },

    parent: function (evaluateExpression) {
        return function (scope) {
            return evaluateExpression(scope.parent);
        };
    },

    "with": function (evaluateContext, evaluateExpression) {
        return function (scope) {
            return evaluateExpression(scope.nest(evaluateContext(scope)));
        };
    },

    "if": function (evaluateCondition, evaluateConsequent, evaluateAlternate) {
        return function (scope) {
            var condition = evaluateCondition(scope);
            if (condition == null) return;
            if (condition) {
                return evaluateConsequent(scope);
            } else {
                return evaluateAlternate(scope);
            }
        }
    },

    not: function (evaluateValue) {
        return function (scope) {
            return !evaluateValue(scope);
        };
    },

    and: function (evaluateLeft, evaluateRight) {
        return function (scope) {
            return evaluateLeft(scope) && evaluateRight(scope);
        };
    },

    or: function (evaluateLeft, evaluateRight) {
        return function (scope) {
            return evaluateLeft(scope) || evaluateRight(scope);
        };
    },

    "default": function (evaluateLeft, evaluateRight) {
        return function (scope) {
            var result = evaluateLeft(scope);
            if (result == null) { // implies "iff === null or undefined"
                result = evaluateRight(scope);
            }
            return result;
        }
    },

    defined: function (evaluate) {
        return function (scope) {
            var value = evaluate(scope);
            return value != null; // implies exactly !== null or undefined
        };
    },

    // TODO rename to evaluate
    path: function (evaluateObject, evaluatePath) {
        return function (scope) {
            var value = evaluateObject(scope);
            var path = evaluatePath(scope);
            var parse = require("./parse");
            try {
                var syntax = parse(path);
                var evaluate = compile(syntax);
                return evaluate(scope.nest(value));
            } catch (exception) {
            }
        }
    }

};

var operators = Object.clone(Operators, 1);

Object.addEach(operators, {

    property: function (object, key) {
        return object[key];
    },

    get: function (collection, key) {
        return collection.get(key);
    },

    mapContent: Function.identity,

    rangeContent: Function.identity,

    view: function (collection, start, length) {
        return collection.slice(start, start + length);
    }

});

var semantics = compile.semantics = {

    compilers: compilers,
    argCompilers: argCompilers,
    operators: operators,

    compile: function (syntax) {
        var compilers = this.compilers;
        var argCompilers = this.argCompilers;
        var operators = this.operators;
        if (compilers.hasOwnProperty(syntax.type)) {
            return compilers[syntax.type].call(this, syntax);
        } else if (argCompilers.hasOwnProperty(syntax.type)) {
            var argEvaluators = syntax.args.map(this.compile, this);

            if(argEvaluators.length === 1) {
                return argCompilers[syntax.type].call(null, argEvaluators[0]);
            }
            else if(argEvaluators.length === 2) {
                return argCompilers[syntax.type].call(null, argEvaluators[0], argEvaluators[1]);
            }
            else {
                return argCompilers[syntax.type].apply(null, argEvaluators);
            }

        } else {
            if (!operators.hasOwnProperty(syntax.type)) {
                operators[syntax.type] = function (object) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (!object[syntax.type])
                        throw new TypeError("Can't call " + JSON.stringify(syntax.type) + " of " + object);

                    if(args.length === 1) {
                        return object[syntax.type].call(object, args[0]);
                    }
                    else if(args.length === 2) {
                        return object[syntax.type].call(object, args[0], args[1]);
                    }
                    else {
                        return object[syntax.type].apply(object, args);
                    }

                };
            }
            var operator = operators[syntax.type];
            var argEvaluators = syntax.args.map(this.compile, this);
            return function (scope) {
                var args = argEvaluators.map(function (evaluateArg) {
                    return evaluateArg(scope);
                });
                if (!args.every(Operators.defined))
                    return;

                if(args.length === 1) {
                    return operator.call(null, args[0]);
                }
                else if(args.length === 2) {
                    return operator.call(null, args[0], args[1]);
                }
                else {
                    return operator.apply(null, args);
                }

            };
        }

    }

};
