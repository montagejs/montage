
var compileEvaluator = require("./compile-evaluator");
var solve = require("./algebra");
var Scope = require("./scope");
var valueSyntax = {type: "value"};
var trueScope = {type: "literal", value: true};
var falseScope = {type: "literal", value: false};

module.exports = compile;
function compile(syntax) {
    return compile.semantics.compile(syntax);
}

compile.semantics = {

    compile: function (syntax) {
        var compilers = this.compilers;
        if (syntax.type === "equals") {
            var assignLeft = this.compile(syntax.args[0]);
            var evaluateRight = this.compileEvaluator(syntax.args[1]);
            return compilers.equals(assignLeft, evaluateRight);
        } else if (syntax.type === "if") {
            var evaluateCondition = this.compileEvaluator(syntax.args[0]);
            var assignConsequent = this.compile(syntax.args[1]);
            var assignAlternate = this.compile(syntax.args[2]);
            return compilers["if"](evaluateCondition, assignConsequent, assignAlternate);
        } else if (syntax.type === "and" || syntax.type === "or") {
            var leftArgs = solve(syntax.args[0], valueSyntax);
            var rightArgs = solve(syntax.args[1], valueSyntax);
            var evaluateLeft = this.compileEvaluator(syntax.args[0]);
            var evaluateRight = this.compileEvaluator(syntax.args[1]);
            var evaluateLeftAssign = this.compileEvaluator(leftArgs[1]);
            var evaluateRightAssign = this.compileEvaluator(rightArgs[1]);
            var assignLeft = this.compile(leftArgs[0]);
            var assignRight = this.compile(rightArgs[0]);
            return compilers[syntax.type](
                assignLeft,
                assignRight,
                evaluateLeft,
                evaluateRight,
                evaluateLeftAssign,
                evaluateRightAssign
            );
        } else if (syntax.type === "everyBlock") {
            var evaluateCollection = this.compileEvaluator(syntax.args[0]);
            var args = solve(syntax.args[1], {type: "literal", value: true});
            var assignCondition = this.compile(args[0]);
            var evaluateValue = this.compileEvaluator(args[1]);
            return compilers["everyBlock"](evaluateCollection, assignCondition, evaluateValue);
        } else if (syntax.type === "parent") {
            var assignParent = this.compile(syntax.args[0]);
            return function (value, scope) {
                return assignParent(value, scope.parent);
            };
        } else if (compilers.hasOwnProperty(syntax.type)) {
            var argEvaluators = syntax.args.map(this.compileEvaluator, this.compileEvaluator.semantics);
            if(argEvaluators.length === 1) {
                return compilers[syntax.type].call(null, argEvaluators[0]);
            }
            else if(argEvaluators.length === 2) {
                return compilers[syntax.type].call(null, argEvaluators[0], argEvaluators[1]);
            }
            else {
                return compilers[syntax.type].apply(null, argEvaluators);
            }

        } else {
            throw new Error("Can't compile assigner for " + JSON.stringify(syntax.type));
        }
    },

    compileEvaluator: compileEvaluator,

    compilers: {

        property: function (evaluateObject, evaluateKey) {
            return function (value, scope) {
                var object = evaluateObject(scope);
                if (!object) return;
                var key = evaluateKey(scope);
                if (key == null) return;
                if (Array.isArray(object)) {
                    object.set(key, value);
                } else {
                    object[key] = value;
                }
            };
        },

        get: function (evaluateCollection, evaluateKey) {
            return function (value, scope) {
                var collection = evaluateCollection(scope);
                if (!collection) return;
                var key = evaluateKey(scope);
                if (key == null) return;
                collection.set(key, value);
            };
        },

        has: function (evaluateCollection, evaluateValue) {
            return function (has, scope) {
                var collection = evaluateCollection(scope);
                if (!collection) return;
                var value = evaluateValue(scope);
                if (has == null) return;
                if (has) {
                    if (!(collection.has || collection.contains).call(collection, value)) {
                        collection.add(value);
                    }
                } else {
                    if ((collection.has || collection.contains).call(collection, value)) {
                        (collection.remove || collection["delete"]).call(collection, value);
                    }
                }
            };
        },

        equals: function (assignLeft, evaluateRight) {
            return function (value, scope) {
                if (value) {
                    return assignLeft(evaluateRight(scope), scope);
                }
            };
        },

        "if": function (evaluateCondition, assignConsequent, assignAlternate) {
            return function (value, scope) {
                var condition = evaluateCondition(scope);
                if (condition == null) return;
                if (condition) {
                    return assignConsequent(value, scope);
                } else {
                    return assignAlternate(value, scope);
                }
            };
        },

        and: function (assignLeft, assignRight, evaluateLeft, evaluateRight, evaluateLeftAssign, evaluateRightAssign) {
            return function (value, scope) {
                if (value == null) return;
                if (value) {
                    assignLeft(evaluateLeftAssign(trueScope), scope);
                    assignRight(evaluateRightAssign(trueScope), scope);
                } else {
                    assignLeft(evaluateLeft(scope) && !evaluateRight(scope), scope);
                }
            }
        },

        or: function (assignLeft, assignRight, evaluateLeft, evaluateRight, evaluateLeftAssign, evaluateRightAssign) {
            return function (value, scope) {
                if (value == null) return;
                if (!value) {
                    assignLeft(evaluateLeftAssign(falseScope), scope);
                    assignRight(evaluateRightAssign(falseScope), scope);
                } else {
                    assignLeft(evaluateLeft(scope) || !evaluateRight(scope), scope);
                }
            }
        },

        rangeContent: function (evaluateTarget) {
            return function (value, scope) {
                var target = evaluateTarget(scope);
                if (!target) return;
                if (!value) {
                    target.clear();
                } else {
                    target.swap(0, target.length, value);
                }
            };
        },

        mapContent: function (evaluateTarget) {
            return function (value, scope) {
                var target = evaluateTarget(scope);
                if (!target) return;
                target.clear();
                if (scope.value) {
                    target.addEach(value);
                }
            };
        },

        reversed: function (evaluateTarget) {
            return function (value, scope) {
                var target = evaluateTarget(scope);
                if (!target) return;
                target.swap(0, target.length, value.reversed());
            };
        },

        everyBlock: function (evaluateCollection, assignCondition, evaluateEffect) {
            return function (value, scope) {
                if (value) {
                    var collection = evaluateCollection(scope);
                    var effect = evaluateEffect(scope);
                    collection.forEach(function (content) {
                        assignCondition(effect, scope.nest(content));
                    });
                }
            };
        }

    }

}
