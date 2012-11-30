
var compileObserver = require("./compile-observer");
var Observers = require("./observers");
var Binders = require("./binders");

module.exports = compile;
function compile(syntax) {
    return compile.semantics.compile(syntax);
}

compile.semantics = {

    compilers: {
        property: Binders.makePropertyBinder,
        get: Binders.makeGetBinder,
        has: Binders.makeHasBinder,
        rangeContent: Binders.makeRangeContentBinder,
        mapContent: Binders.makeMapContentBinder,
        reversed: Binders.makeReversedBinder
    },

    compile: function (syntax) {
        var compilers = this.compilers;
        if (syntax.type === "equals") {
            var bindLeft = this.compile(syntax.args[0]);
            var observeRight = compileObserver(syntax.args[1]);
            return Binders.makeEqualityBinder(bindLeft, observeRight);
        } else if (compilers.hasOwnProperty(syntax.type)) {
            var argObservers = syntax.args.map(compileObserver, compileObserver.semantics);
            return compilers[syntax.type].apply(null, argObservers);
        } else {
            throw new Error("Can't compile binder for " + JSON.stringify(syntax.type));
        }
    }

};

