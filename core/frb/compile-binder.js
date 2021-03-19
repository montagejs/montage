
var compileObserver = require("./compile-observer");
var Observers = require("./observers");
var Binders = require("./binders");
var solve = require("./algebra");

var valueSyntax = {type: "value"};
var trueSyntax = {type: "literal", value: true};

module.exports = compile;
function compile(syntax) {
    return compile.semantics.compile(syntax);
}

compile.semantics = {

    compilers: {
        property: Binders.makePropertyBinder,
        get: Binders.makeGetBinder,
        has: Binders.makeHasBinder,
        only: Binders.makeOnlyBinder,
        one: Binders.makeOneBinder,
        rangeContent: Binders.makeRangeContentBinder,
        mapContent: Binders.makeMapContentBinder,
        reversed: Binders.makeReversedBinder,
        and: Binders.makeAndBinder,
        or: Binders.makeOrBinder
    },

    syntaxTypeCompile: {
        "default": function (syntax) {
            return this.compile(syntax.args[0]);
        },
        "literal": function (syntax) {
            if (syntax.value == null) {
                return Function.noop;
            } else {
                throw new Error("Can't bind to literal: " + syntax.value);
            }
        },
        "equals": function (syntax) {
            return Binders.makeEqualityBinder(/*bindLeft*/ this.compile(syntax.args[0]), /*observeRight*/ compileObserver(syntax.args[1]));
        },
        "if": function (syntax) {
            return Binders.makeConditionalBinder(
                /*observeCondition*/compileObserver(syntax.args[0]),
                /*bindConsequent*/this.compile(syntax.args[1]),
            /*bindAlternate*/this.compile(syntax.args[2]));
        },
        "and_or": function (syntax) {
            var leftArgs = solve(syntax.args[0], valueSyntax);
            var rightArgs = solve(syntax.args[1], valueSyntax);
            var bindLeft = this.compile(leftArgs[0]);
            var bindRight = this.compile(rightArgs[0]);
            var observeLeftBind = compileObserver(leftArgs[1]);
            var observeRightBind = compileObserver(rightArgs[1]);
            var observeLeft = compileObserver(syntax.args[0]);
            var observeRight = compileObserver(syntax.args[1]);
            return this.compilers[syntax.type](
                bindLeft,
                bindRight,
                observeLeft,
                observeRight,
                observeLeftBind,
                observeRightBind
            );
        },
        "everyBlock": function (syntax) {
            var observeCollection = compileObserver(syntax.args[0]);
            var args = solve(syntax.args[1], trueSyntax);
            var bindCondition = this.compile(args[0]);
            var observeValue = compileObserver(args[1]);
            return Binders.makeEveryBlockBinder(observeCollection, bindCondition, observeValue);
        },
        "rangeContent": function (syntax) {
            var observeTarget = compileObserver(syntax.args[0]);
            var bindTarget;
            try {
                bindTarget = this.compile(syntax.args[0]);
            } catch (exception) {
                bindTarget = Function.noop;
            }
            return Binders.makeRangeContentBinder(observeTarget, bindTarget);
        },
        "defined": function (syntax) {
            var bindTarget = this.compile(syntax.args[0]);
            return Binders.makeDefinedBinder(bindTarget);
        },
        "parent": function (syntax) {
            var bindTarget = this.compile(syntax.args[0]);
            return Binders.makeParentBinder(bindTarget);
        },
        "with": function (syntax) {
            var observeTarget = compileObserver(syntax.args[0]);
            var bindTarget = this.compile(syntax.args[1]);
            return Binders.makeWithBinder(observeTarget, bindTarget);
        }
    },

    compile: function compile(syntax) {
        var compilers = this.compilers,
            syntaxTypeCompile;
        if(syntaxTypeCompile = this.syntaxTypeCompile[syntax.type]) {
            return syntaxTypeCompile.call(this,syntax);
        }
        else if (compilers.hasOwnProperty(syntax.type)) {
            var argObservers = [],
                semantics = compileObserver.semantics;
            for(var i=0, countI = syntax.args.length;i<countI;i++) {
                argObservers.push(compileObserver.call(semantics,syntax.args[i]));
            }
            // var argObservers = syntax.args.map(compileObserver, compileObserver.semantics);

            if(argObservers.length === 1) {
                return compilers[syntax.type].call(null, argObservers[0]);
            }
            else if(argObservers.length === 2) {
                return compilers[syntax.type].call(null, argObservers[0], argObservers[1]);
            }
            else {
                return compilers[syntax.type].apply(null, argObservers);
            }
        }
        else {
            throw new Error("Can't compile binder for " + JSON.stringify(syntax.type));
        }
    }

};

compile.semantics.syntaxTypeCompile.and = compile.semantics.syntaxTypeCompile.or = compile.semantics.syntaxTypeCompile.and_or;
