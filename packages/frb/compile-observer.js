
var Observers = require("./observers");
var Operators = require("./operators");

module.exports = compile;
function compile(syntax) {
    return semantics.compile(syntax);
}

var semantics = compile.semantics = {

    compilers: {
        property: Observers.makePropertyObserver,
        get: Observers.makeGetObserver,
        rangeContent: identity,
        mapContent: identity,
        map: Observers.makeMapFunctionObserver,
        mapBlock: Observers.makeMapBlockObserver,
        // TODO filter: Observers.makeFilterFunctionObserver,
        filterBlock: Observers.makeFilterBlockObserver,
        sortedBlock: Observers.makeSortedBlockObserver,
        // TODO sorted: Observers.makeSortedFunctionObserver,
        // TODO sortedSetBlock: Observers.makeSortedSetBlockObserver,
        // TODO sortedSet: Observers.makeSortedSetFunctionObserver,
        enumerate: Observers.makeEnumerationObserver,
        reversed: Observers.makeReversedObserver,
        flatten: Observers.makeFlattenObserver,
        view: Observers.makeViewObserver,
        sum: Observers.makeSumObserver,
        has: Observers.makeHasObserver,
        average: Observers.makeAverageObserver,
        tuple: Observers.makeTupleObserver
    },

    compile: function (syntax) {
        var compilers = this.compilers;
        if (syntax.type === 'literal') {
            return Observers.makeLiteralObserver(syntax.value);
        } else if (syntax.type === 'value') {
            return Observers.observeValue;
        } else if (syntax.type === 'parameters') {
            return Observers.observeParameters;
        } else if (syntax.type === 'element') {
            return Observers.makeElementObserver(syntax.id);
        } else if (syntax.type === 'component') {
            return Observers.makeComponentObserver(syntax.label);
        } else if (syntax.type === 'record') {
            var observers = {};
            var args = syntax.args;
            for (var name in args) {
                observers[name] = this.compile(args[name]);
            }
            return Observers.makeRecordObserver(observers);
        } else if (compilers.hasOwnProperty(syntax.type)) {
            var argObservers = syntax.args.map(this.compile, this);
            return compilers[syntax.type].apply(null, argObservers);
        } else {
            throw new Error("Can't compile observer for " + JSON.stringify(syntax));
        }
    }

};

var compilers = semantics.compilers;
Object.keys(Operators).forEach(function (name) {
    compilers[name] = Observers.makeOperatorObserverMaker(Operators[name]);
});

function identity(x) { return x; }

