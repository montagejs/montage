
var Object = require("collections/shim-object");
var Operators = require("./operators");

module.exports = compile;
function compile(syntax) {
    return compile.semantics.compile(syntax);
}

var compilers = {

    mapBlock: function (evaluateCollection, evaluateRelation) {
        return function (value, parameters) {
            return evaluateCollection(value, parameters)
            .map(function (value) {
                return evaluateRelation(value, parameters);
            });
        };
    },

    filterBlock: function (evaluateCollection, evaluatePredicate) {
        return function (value, parameters) {
            return evaluateCollection(value, parameters)
            .filter(function (value) {
                return evaluatePredicate(value, parameters);
            });
        };
    },

    someBlock: function (evaluateCollection, evaluatePredicate) {
        return function (value, parameters) {
            return evaluateCollection(value, parameters)
            .some(function (value) {
                return evaluatePredicate(value, parameters);
            });
        };
    },

    everyBlock: function (evaluateCollection, evaluatePredicate) {
        return function (value, parameters) {
            return evaluateCollection(value, parameters)
            .every(function (value) {
                return evaluatePredicate(value, parameters);
            });
        };
    },

    sortedBlock: function (evaluateCollection, evaluateRelation) {
        return function (value, parameters) {
            return evaluateCollection(value, parameters)
            .sorted(Function.by(function (value) {
                return evaluateRelation(value, parameters);
            }));
        };
    },

    sorted: function (evaluateCollection, evaluateRelation) {
        return function (value, parameters) {
            return evaluateCollection(value, parameters)
            .sorted(Function.by(evaluateRelation(value, parameters)))
        };
    },

    "with": function (evaluateContext, evaluateExpression) {
        return function (value, parameters) {
            return evaluateExpression(evaluateContext(value, parameters), parameters);
        };
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

[
    "reversed",
    "flatten",
    "sum",
    "average",
    "map",
    "filter"
].forEach(function (name) {
    operators[name] = function (object) {
        var args = Array.prototype.slice.call(arguments, 1);
        return object[name].apply(object, args);
    };
});

var semantics = compile.semantics = {

    compilers: compilers,

    operators: operators,

    compile: function (syntax) {
        var compilers = this.compilers;
        var operators = this.operators;
        if (syntax.type === 'literal') {
            return function () {
                return syntax.value;
            };
        } else if (syntax.type === 'value') {
            return function (value) {
                return value;
            };
        } else if (syntax.type === 'parameters') {
            return function (value, parameters) {
                return parameters;
            };
        } else if (syntax.type === 'element') {
            return function (value, parameters) {
                return parameters.document.getElementById(syntax.id);
            };
        } else if (syntax.type === 'component') {
            return function (value, parameters) {
                return parameters.serialization.getObjectByLabel(syntax.label);
            };
        } else if (syntax.type === 'tuple') {
            var argEvaluators = syntax.args.map(this.compile, this);
            return function (value, parameters) {
                return argEvaluators.map(function (evaluateArg) {
                    return evaluateArg(value, parameters);
                });
            };
        } else if (syntax.type === 'record') {
            var args = syntax.args;
            var argEvaluators = {};
            for (var name in args) {
                argEvaluators[name] = this.compile(args[name]);
            }
            return function (value, parameters) {
                var object = {};
                for (var name in argEvaluators) {
                    object[name] = argEvaluators[name](value, parameters);
                }
                return object;
            };
        } else if (operators.hasOwnProperty(syntax.type)) {
            var operator = operators[syntax.type];
            var argEvaluators = syntax.args.map(this.compile, this);
            return function (value, parameters) {
                var args = argEvaluators.map(function (evaluateArg) {
                    return evaluateArg(value, parameters);
                });
                return operator.apply(null, args);
            };
        } else if (compilers.hasOwnProperty(syntax.type)) {
            var argEvaluators = syntax.args.map(this.compile, this);
            return compilers[syntax.type].apply(null, argEvaluators);
        } else {
            throw new Error("Can't compile evaluator for " + JSON.stringify(syntax));
        }

    }

};

