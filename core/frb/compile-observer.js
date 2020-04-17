
var Observers = require("./observers"),
    Operators = require("./operators"),
    LITERAL = "literal",
    VALUE = "value",
    PARAMETERS = "parameters",
    ELEMENT = "element",
    COMPONENT = "component",
    RECORD = "record";


module.exports = compile;
function compile(syntax) {
    return semantics.compile(syntax);
}

var semantics = compile.semantics = {

    compilers: {
        property: Observers.makePropertyObserver,
        get: Observers.makeGetObserver,
        path: Observers.makePathObserver,
        "with": Observers.makeWithObserver,
        "if": Observers.makeConditionalObserver,
        parent: Observers.makeParentObserver,
        not: Observers.makeNotObserver,
        and: Observers.makeAndObserver,
        or: Observers.makeOrObserver,
        "default": Observers.makeDefaultObserver,
        defined: Observers.makeDefinedObserver,
        rangeContent: Function.identity,
        mapContent: Function.identity,
        keys: Observers.makeKeysObserver,
        keysArray: Observers.makeKeysObserver,
        values: Observers.makeValuesObserver,
        valuesArray: Observers.makeValuesObserver,
        items: Observers.makeEntriesObserver, // XXX deprecated
        entries: Observers.makeEntriesObserver,
        entriesArray: Observers.makeEntriesObserver,
        toMap: Observers.makeToMapObserver,
        mapBlock: Observers.makeMapBlockObserver,
        filterBlock: Observers.makeFilterBlockObserver,
        everyBlock: Observers.makeEveryBlockObserver,
        someBlock: Observers.makeSomeBlockObserver,
        sortedBlock: Observers.makeSortedBlockObserver,
        sortedSetBlock: Observers.makeSortedSetBlockObserver,
        groupBlock: Observers.makeGroupBlockObserver,
        groupMapBlock: Observers.makeGroupMapBlockObserver,
        minBlock: Observers.makeMinBlockObserver,
        maxBlock: Observers.makeMaxBlockObserver,
        min: Observers.makeMinObserver,
        max: Observers.makeMaxObserver,
        enumerate: Observers.makeEnumerationObserver,
        reversed: Observers.makeReversedObserver,
        flatten: Observers.makeFlattenObserver,
        concat: Observers.makeConcatObserver,
        view: Observers.makeViewObserver,
        sum: Observers.makeSumObserver,
        average: Observers.makeAverageObserver,
        last: Observers.makeLastObserver,
        only: Observers.makeOnlyObserver,
        one: Observers.makeOneObserver,
        has: Observers.makeHasObserver,
        // TODO zip
        tuple: Observers.makeArrayObserver,
        range: Observers.makeRangeObserver,
        startsWith: Observers.makeStartsWithObserver,
        endsWith: Observers.makeEndsWithObserver,
        contains: Observers.makeContainsObserver,
        join: Observers.makeJoinObserver,
        toArray: Observers.makeToArrayObserver,
        asArray: Observers.makeToArrayObserver // XXX deprecated
    },

    compile: function compile(syntax) {
        var compilers = this.compilers,
            syntaxType = syntax.type;
        if (syntax.type === LITERAL) {
            return Observers.makeLiteralObserver(syntax.value);
        } else if (syntaxType === VALUE) {
            return Observers.observeValue;
        } else if (syntaxType === PARAMETERS) {
            return Observers.observeParameters;
        } else if (syntaxType === ELEMENT) {
            return Observers.makeElementObserver(syntax.id);
        } else if (syntaxType === COMPONENT) {
            return Observers.makeComponentObserver(syntax.label, syntax);
        } else if (syntaxType === RECORD) {
            var observers = {},
                args = syntax.args,
                names = Object.keys(args);
            for (var i=0;(name = names[i]);i++) {
                observers[name] = this.compile(args[name]);
            }
            return Observers.makeObjectObserver(observers);
        } else {
            if (!compilers.hasOwnProperty(syntaxType)) {
                compilers[syntaxType] = Observers.makeMethodObserverMaker(syntaxType);
            }

            var argObservers = [];
            for(var i=0, args = syntax.args, countI = args.length;i<countI;i++) {
                argObservers[i] = this.compile(args[i]);
            }

            return (countI === 1)
                ? compilers[syntaxType].call(null, argObservers[0])
                : (countI === 2)
                    ? compilers[syntaxType].call(null, argObservers[0], argObservers[1])
                    : compilers[syntaxType].apply(null, argObservers);
        }
    }

};

var compilers = semantics.compilers;
var operatorsKeys = Object.keys(Operators);

for(var i=0, name;(name = operatorsKeys[i]); i++) {
    if (!compilers[name]) {
        compilers[name] = Observers.makeOperatorObserverMaker(Operators[name]);
    }
}

// a special Hell for non-enumerable inheritance
compilers.toString = Observers.makeOperatorObserverMaker(Operators.toString);
