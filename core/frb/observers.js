
require("collections/shim"); // Function.noop
var PropertyChanges = require("collections/listen/property-changes");
require("collections/listen/array-changes");
var SortedArray = require("collections/sorted-array");
var SortedSet = require("collections/sorted-set");
var Map = require("collections/map");
var Set = require("collections/set");
var Heap = require("collections/heap");
var Scope = require("./scope");
var Operators = require("./operators");

// Simple stuff..."degenerate" even

exports.makeLiteralObserver = makeLiteralObserver;
function makeLiteralObserver(literal) {
    return function observeLiteral(emit) {
        return emit(literal);
    };
}

exports.observeValue = observeValue;
function observeValue(emit, scope) {
    return emit(scope.value);
}

exports.observeParameters = observeParameters;
function observeParameters(emit, scope) {
    return emit(scope.parameters);
}

// This is a concession that in practice FRB may be used in conjunction with a
// browser DOM.
exports.makeElementObserver = makeElementObserver;
function makeElementObserver(id) {
    return function observeElement(emit, scope) {
        return emit(scope.document.getElementById(id));
    };
}

// This is a concession that in practice FRB will probably be used mostly in
// conjunction with MontageJS for its component model.
exports.makeComponentObserver = makeComponentObserver;
function makeComponentObserver(label, syntax) {
    return function observeComponent(emit, scope) {
        // TODO error if scope.components does not exist or components for
        // label does not exist
        var components = scope.components;
        var method = components.getObjectByLabel || components.getComponentByLabel;
        var component = method.call(components, label);
        return emit(component);
    };
}

exports.observeProperty = observeProperty;
var _observeProperty = observeProperty; // to bypass scope shadowing problems below
function observeProperty(object, key, emit, scope) {
    if (object == null) return emit();
    var cancel;
    function propertyChange(value, key, object) {
        if (cancel) cancel();
        cancel = emit(value, key, object);
    }
    PropertyChanges.addOwnPropertyChangeListener(
        object,
        key,
        propertyChange,
        scope.beforeChange
    );
    propertyChange(object[key], key, object);
    return function cancelPropertyObserver() {
        if (cancel) cancel();
        PropertyChanges.removeOwnPropertyChangeListener(
            object,
            key,
            propertyChange,
            scope.beforeChange
        );
    };
}

exports.makePropertyObserver = makePropertyObserver;
function makePropertyObserver(observeObject, observeKey) {
    return function observeProperty(emit, scope) {
        return observeKey(function replaceKey(key) {
            if (typeof key !== "string" && typeof key !== "number") return emit();

            function replaceObject(object) {
                return (object == null)
                    ? replaceObject.emit()
                    : object.observeProperty
                        ? object.observeProperty(key, replaceObject.emit, replaceObject.scope)
                        : replaceObject.observeProperty(object, key, replaceObject.emit, replaceObject.scope);
            };
            replaceObject.observeProperty = _observeProperty;
            replaceObject.emit = emit;
            replaceObject.scope = scope;

            return observeObject(replaceObject, scope);
        }, scope);
    };
}

exports.observeKey = observeGet; // deprecated
exports.observeGet = observeGet;
var _observeGet = observeGet; // to bypass scope shadowing below
function observeGet(collection, key, emit, scope) {
    var cancel;
    var equals = collection.contentEquals || Object.equals;
    function mapChange(value, mapKey, collection) {
        if (equals(key, mapKey)) {
            if (cancel) cancel();
            cancel = emit(value, key, collection);
        }
    }
    mapChange(collection.get(key), key, collection);
    collection.addMapChangeListener(mapChange, scope.beforeChange);
    return function cancelMapObserver() {
        if (cancel) cancel();
        collection.removeMapChangeListener(mapChange);
    };
}

exports.makeGetObserver = makeGetObserver;
function makeGetObserver(observeCollection, observeKey) {
    return function observeGet(emit, scope) {
        return observeCollection(function replaceCollection(collection) {
            if (!collection) return emit();

            function replaceKey(key) {
                if (key == null) return emit();
                if (collection.observeGet) {
                    // polymorphic override
                    return collection.observeGet(key, emit, scope);
                } else {
                    // common case
                    return replaceKey.observeGet(collection, key, emit, scope);
                }
            };
            replaceKey.observeGet = _observeGet;

            return observeKey(replaceKey, scope);
        }, scope);
    };
}

exports.makeHasObserver = makeHasObserver;
function makeHasObserver(observeSet, observeValue) {
    return function observeHas(emit, scope) {
        emit = makeUniq(emit);
        return observeValue(function replaceValue(sought) {
            return observeSet(function replaceSet(collection) {
                if (!collection) {
                    return emit();
                } else if (collection.addRangeChangeListener) {
                    return observeRangeChange(collection, function rangeChange() {
                        // This could be done incrementally if there were
                        // guarantees of uniqueness, but if there are
                        // guarantees of uniqueness, the data structure can
                        // probably efficiently check
                        return emit((collection.has || collection.contains)
                            .call(collection, sought));
                    }, scope);
                } else if (collection.addMapChangeListener) {
                    return observeMapChange(collection, function mapChange() {
                        return emit(collection.has(sought));
                    }, scope);
                } else {
                    return emit();
                }
            }, scope);
        }, scope);
    };
}

// Compound Observers

// accepts an array of observers and emits an array of the corresponding
// values, incrementally updated
exports.makeObserversObserver = makeObserversObserver;
function makeObserversObserver(observers) {
    return function observeObservers(emit, scope) {
        var output = [],
            cancelers = [];
        for (var index = 0, indexCount = observers.length; index < indexCount; index++) {
            output[index] = void 0;
            cancelers[index] = (function captureIndex(observe, index) {
                return observe(function replaceValueAtIndex(value) {
                    output.set(index, value);
                }, scope);
            })(observers[index], index);
        }
        var cancel = emit(output);
        return function cancelObserversObserver() {
            if (cancel) cancel();
            for (var index = 0, indexCount = cancelers.length; index < indexCount; index++) {
                cancel = cancelers[index];
                if (cancel) cancel();
            }
        };
    };
}

// {type: "record", args: {key: observe}}
// {a: 10, b: c + d}
// {type: "record", args: {a: {type: "literal", value: 10 ...
exports.makeRecordObserver = makeObjectObserver; // deprecated
exports.makeObjectObserver = makeObjectObserver;
function makeObjectObserver(observers) {
    return function observeObject(emit, scope) {
        var cancelers = {},
            output = {},
            names = Object.keys(observers),
            i;

        for (i=0;(name=names[i]);i++) {
            (function (name, observe) {
                // To ensure that the property exists, even if the observer
                // fails to emit:
                output[name] = void 0;
                cancelers[name] = observe(function (value) {
                    output[name] = value;
                }, scope);
            })(name, observers[name]);
        }
        var cancel = emit(output);
        return function cancelRecordObserver() {
            if (cancel) cancel();
            var names = Object.keys(cancelers),i;

            for (i=0;(name=names[i]);i++) {
                cancel = cancelers[name];
                if (cancel) cancel();
            }
        };
    };
}

exports.makeTupleObserver = makeArrayObserver; // deprecated
exports.makeArrayObserver = makeArrayObserver;
function makeArrayObserver() {
    // Unroll Array.prototype.slice.call(arguments) to prevent deopt
    var observers = [];
    var index = arguments.length;
    while (index--) {
        observers[index] = arguments[index];
    }
    return makeObserversObserver(observers);
}

// Operators

exports.makeOperatorObserverMaker = makeOperatorObserverMaker;
function makeOperatorObserverMaker(operator) {
    return function makeOperatorObserver(/*...observers*/) {
        // Unroll Array.prototype.slice.call(arguments);
        var observers = [];
        var index = arguments.length;
        while (index--) {
            observers[index] = arguments[index];
        }
        var observeOperands = makeObserversObserver(observers);
        var observeOperandChanges = makeRangeContentObserver(observeOperands);
        return function observeOperator(emit, scope) {
            return observeOperandChanges(function (operands) {
                if (!operands.every(Operators.defined)) return emit();
                if(operands.length === 1) {
                    return emit(operator.call(void 0, operands[0]));
                }
                else if(operands.length === 2) {
                    return emit(operator.call(void 0, operands[0], operands[1]));
                }
                else {
                    return emit(operator.apply(void 0, operands));
                }
            }, scope);
        };
    };
}

exports.makeMethodObserverMaker = makeMethodObserverMaker;
function makeMethodObserverMaker(name) {
    var capitalName = name.slice(0, 1).toUpperCase();
        capitalName += name.slice(1);
    var makeObserverName = 'make';
        makeObserverName += capitalName;
        makeObserverName += 'Observer';
    var observeName = 'observe';
        observeName += capitalName;
    return function makeMethodObserver(/*...observers*/) {
        var observeObject = arguments[0];
        var operandObservers = Array.prototype.slice.call(arguments, 1);
        var observeOperands = makeObserversObserver(operandObservers);
        var observeOperandChanges = makeRangeContentObserver(observeOperands);
        return function observeMethod(emit, scope) {
            return observeObject(function (object) {
                if (!object) return emit();
                if (object[makeObserverName]) {
                    if(operandObservers.length === 1) {
                        return object[makeObserverName].call(object, operandObservers[0])(emit, scope);
                    }
                    else if(operandObservers.length === 2) {
                        return object[makeObserverName].call(object, operandObservers[0], operandObservers[1])(emit, scope);
                    }
                    else {
                        return object[makeObserverName].apply(object, operandObservers)(emit, scope);
                    }
                }
                if (object[observeName])
                    return object[observeName](emit, scope);
                return observeOperandChanges(function (operands) {
                    if (!operands.every(Operators.defined)) return emit();
                    if (typeof object[name] === "function") {
                        if(operands.length === 1) {
                            return emit(object[name].call(object, operands[0]));
                        }
                        else if(operands.length === 2) {
                            return emit(object[name].call(object, operands[0], operands[1]));
                        }
                        else {
                            return emit(object[name].apply(object, operands));
                        }
                    } else {
                        return emit();
                    }
                }, scope);
            }, scope);
        };
    };
}

// The "not" operator coerces null and undefined, so it is not adequate to
// implement it with makeOperatorObserverMaker.

exports.makeNotObserver = makeNotObserver;
function makeNotObserver(observeValue) {
    return function observeNot(emit, scope) {
        return observeValue(function replaceValue(value) {
            return emit(!value);
        }, scope);
    };
}

// The "and" and "or" operators short-circuit, so it is not adequate to
// implement them with makeOperatorObserverMaker.

exports.makeAndObserver = makeAndObserver;
function makeAndObserver(observeLeft, observeRight) {
    return function observeAnd(emit, scope) {
        return observeLeft(function replaceLeft(left) {
            return (!left)
                    ? emit(left)
                    : observeRight(emit, scope);
        }, scope);
    };
}

exports.makeOrObserver = makeOrObserver;
function makeOrObserver(observeLeft, observeRight) {
    return function observeOr(emit, scope) {
        return observeLeft(function replaceLeft(left) {
            return left
                    ? emit(left)
                    : observeRight(emit, scope);
        }, scope);
    };
}

// expression: condition ? consequent : alternate
// syntax: {type: "if", args: [condition, consequent, alternate]}
exports.makeConditionalObserver = makeConditionalObserver;
function makeConditionalObserver(observeCondition, observeConsequent, observeAlternate) {
    return function observeConditional(emit, scope) {
        return observeCondition(function replaceCondition(condition) {
            if (condition == null) {
                return emit();
            } else if (condition) {
                return observeConsequent(emit, scope);
            } else {
                return observeAlternate(emit, scope);
            }
        }, scope);
    };
}

// This cannot be written in terms of the defined operator because the input
// may be null or undefined and still emit a value.
exports.makeDefinedObserver = makeDefinedObserver;
function makeDefinedObserver(observeValue) {
    return function observeDefault(emit, scope) {
        return observeValue(function replaceValue(value) {
            return emit(value != null);
        }, scope);
    };
}

exports.makeDefaultObserver = makeDefaultObserver;
function makeDefaultObserver(observeValue, observeAlternate) {
    return function observeDefault(emit, scope) {
        return observeValue(function replaceValue(value) {
            if (value == null) {
                return observeAlternate(emit, scope);
            } else {
                return emit(value);
            }
        }, scope);
    };
}

// Comprehension Observers

// The map comprehension
// object.array.map{+1}
// Handles both range content changes and full replacement of the input
// object.array.splice(0, 1, 2);
// object.array = [1, 2, 3]
var makeMapBlockObserver = exports.makeMapBlockObserver = makeNonReplacing(makeReplacingMapBlockObserver);
function makeReplacingMapBlockObserver(observeCollection, observeRelation) {
    return function observeMap(emit, scope) {
        return observeCollection(function replaceMapInput(input) {
            if (!input) return emit();

            var output = [];
            var indexRefs = [];
            var cancelers = [];

            function update(index) {
                for (var i=0, countI = input.length; i < countI; i++) {
                    indexRefs[i].index = i;
                }
            }

            function rangeChange(plus, minus, index) {
                var i,
                    countI,
                    // plusMapped = plus.map(function (value, offset) {
                    //     return {index: index + offset};
                    // })),
                    plusMapped = [];

                for(i=0, countI = plus.length;i<countI;i++) {
                    plusMapped[i] = {index: index + i}
                }

                swap(indexRefs, index, minus.length, plusMapped);
                update(index + plus.length);
                var initialized;
                var initial = [];
                // Unroll cancelEach(cancelers.slice(index, index + minus.length))
                var at = index;
                var end = index + minus.length;
                var cancel;
                for (at = index, end = index + minus.length; at < end; at++) {
                    cancel = cancelers[at];
                    if (cancel) cancel();
                }


                function cancelerMapper(value, offset, index, indexRefs, output, initial, observeRelation, scope) {
                    var indexRef = indexRefs[index + offset];

                    function replaceRelationOutput(value) {
                        if (initialized) {
                            output.set(indexRef.index, value);
                        } else {
                            // It is unnecessary to use .set() because initial
                            // does not dispatch changes.
                            initial[offset] = value;
                        }
                    };

                    return observeRelation(replaceRelationOutput, scope.nest(value));
                };

                for(i=0, countI = plus.length;i<countI;i++) {
                    plusMapped[i] = cancelerMapper(plus[i],i,index,indexRefs, output, initial, observeRelation, scope);
                }

                swap(cancelers, index, minus.length, /*plus.map(cancelerMapper)*/plusMapped);
                initialized = true;
                output.swap(index, minus.length, initial);
            }

            var cancelRangeChange = observeRangeChange(input, rangeChange, scope);
            // passing the input as a second argument is a special feature of a
            // mapping observer, utilized by filter observers
            var cancel = emit(output, input);

            return function cancelMapObserver() {
                if (cancel) cancel();
                for (var index = 0, length = cancelers.length; index < length; index++) {
                    cancel = cancelers[index];
                    if (cancel) cancel();
                }
                cancelRangeChange();
            };
        }, scope);
    };
}

var makeFilterBlockObserver = exports.makeFilterBlockObserver = makeNonReplacing(makeReplacingFilterBlockObserver);
function makeReplacingFilterBlockObserver(observeCollection, observePredicate) {
    var observePredicates = makeReplacingMapBlockObserver(observeCollection, observePredicate);
    return function observeFilter(emit, scope) {
        return observePredicates(function (predicates, input) {
            if (!input) return emit();

            var output = [];
            var cancelers = [];
            var cumulativeLengths = [0];

            function update(index) {
                for (; index < predicates.length; index++) {
                    cumulativeLengths[index + 1] = cumulativeLengths[index] + !!predicates[index];
                }
            }

            function rangeChange(plusPredicates, minusPredicates, index) {
                var plusValues = input.slice(index, index + plusPredicates.length);
                var minusLength = minusPredicates.map(Boolean).sum();
                var plusOutput = plusValues.filter(function (value, offset) {
                    return plusPredicates[offset];
                });
                var start = cumulativeLengths[index];
                var minusOutput = output.slice(start, start + minusLength);
                // avoid propagating a range change if the output would not be
                // changed
                if (
                    minusOutput.length !== plusOutput.length ||
                    minusOutput.some(function (value, offset) {
                        return value !== plusOutput[offset];
                    })
                ) {
                    output.swap(start, minusLength, plusOutput);
                }
                update(start);
            }

            var cancelRangeChange = observeRangeChange(predicates, rangeChange, scope);
            var cancel = emit(output);
            return function cancelFilterObserver() {
                if (cancel) cancel();
                for (var index = 0, length = cancelers.length; index < length; index++) {
                    cancel = cancelers[index];
                    if (cancel) cancel();
                }
                cancelRangeChange();
            };

        }, scope);
    };
}

// Schwartzian transform / decorate undecorate pattern
// entries.sorted{key}
exports.makeSortedBlockObserver = makeSortedBlockObserver;
function makeSortedBlockObserver(observeCollection, observeRelation) {
    // produces: [this, key]
    var observeRelationEntry = makeRelationEntryObserver(observeRelation);
    // produces: map{[this, key])
    var observeRelationEntries = makeReplacingMapBlockObserver(observeCollection, observeRelationEntry);
    var observeSort = function (emit, scope) {
        return observeRelationEntries(function (input) {
            // [[value, relatedValue], ...]
            if (!input) return emit();
            var output = [];
            var sorted = SortedArray(output, entryValueEquals, entryValueCompare);
            function rangeChange(plus, minus) {
                sorted.deleteEach(minus);
                sorted.addEach(plus);
            }
            var cancelRangeChange = observeRangeChange(input, rangeChange, scope);
            var cancel = emit(output);
            return function cancelSortedObserver() {
                if (cancel) cancel();
                cancelRangeChange();
            };
        }, scope);
    };
    return makeMapBlockObserver(observeSort, observeEntryKey);
}

function entryValueEquals(x, y) {
    return Object.equals(x[1], y[1]);
}

function entryValueCompare(x, y) {
    return Object.compare(x[1], y[1]);
}

// Transforms a value into a [value, relation(value)] tuple
function makeRelationEntryObserver(observeRelation) {
    return function observeRelationEntry(emit, scope) {
        return observeRelation(function replaceRelation(value) {
            return emit([scope.value, value]);
        }, scope);
    };
}

exports.makeSortedSetBlockObserver = makeSortedSetBlockObserver;
function makeSortedSetBlockObserver(observeCollection, observeRelation) {
    var observeRelationEntry = makeRelationEntryObserver(observeRelation);
    var observeRelationEntries = makeReplacingMapBlockObserver(observeCollection, observeRelationEntry);
    var observeRelationEntryGroups = makeGroupBlockObserver(observeRelationEntries, observeEntryValue);
    var observeUniqueRelationEntries = makeReplacingMapBlockObserver(observeRelationEntryGroups, makeLastObserver(observeEntryValue));
    return function observeSortedSetBlock(emit, scope) {
        var order = new Map();
        function compare(x, y) {
            x = order.get(x);
            y = order.get(y);
            return Object.compare(x, y);
        }
        function equals(x, y) {
            x = order.get(x);
            y = order.get(y);
            return Object.equals(x, y);
        }
        var sortedSet = new SortedSet(null, equals, compare);
        var cancel = emit(sortedSet);
        function rangeChange(plus, minus) {
            var i, countI, entry;
            for(i=0, countI = minus.length; i<countI; i++) {
                entry = minus[i];
                sortedSet["delete"](entry[0]);
                order["delete"](entry[0]);
            }
            for(i=0, countI = plus.length; i<countI; i++) {
                entry = plus[i];
                order.set(entry[0], entry[1]);
                sortedSet.add(entry[0]);
            }
        }
        function entriesChange(entries) {
            sortedSet.clear();
            return observeRangeChange(entries, rangeChange, scope);
        }
        var cancelUniqueValuesObserver = observeUniqueRelationEntries(entriesChange, scope);
        return function cancelSortedSetObserver() {
            if (cancel) cancel();
            cancelUniqueValuesObserver();
        };
    };
}

// calculating the reflected index for an incremental change:
// [0, 1, 2, 3]  length 4
//     -------  -4 (1+3)
// --------    0-  (outer.length - index - inner.length)
exports.makeReversedObserver = makeNonReplacing(makeReplacingReversedObserver);
function makeReplacingReversedObserver(observeArray) {
    return function observeReversed(emit, scope) {
        return observeArray(function (input) {
            if (!input) return emit();
            var output = [];
            function rangeChange(plus, minus, index) {
                var reflected = output.length - index - minus.length;
                output.swap(reflected, minus.length, plus.reversed());
            }
            var cancelRangeChange = observeRangeChange(input, rangeChange, scope);
            var cancel = emit(output);
            return function cancelReversedObserver() {
                if (cancel) cancel();
                cancelRangeChange();
            };
        }, scope);
    };
}

var makeFlattenObserver =
exports.makeFlattenObserver = makeNonReplacing(makeReplacingFlattenObserver);
function makeReplacingFlattenObserver(observeArray) {
    return function (emit, scope) {
        return observeArray(function (input) {
            if (!input) return emit();

            var output = [];
            var cancelers = [];
            var cumulativeLengths = [0];
            var indexRefs = [];

            function update(i) {
                for (var j = i; j < input.length; j++) {
                    indexRefs[j].index = j;
                    if (input[j]) {
                        cumulativeLengths[j + 1] = cumulativeLengths[j] + input[j].length;
                    } else {
                        cumulativeLengths[j + 1] = cumulativeLengths[j];
                    }
                }
            }

            function rangeChange(plus, minus, i) {

                // minus
                var start = cumulativeLengths[i];
                var end = cumulativeLengths[i + minus.length];
                var length = end - start;
                output.swap(start, length, []);

                swap(indexRefs, i, minus.length, plus.map(function () {
                    return {index: null};
                }));
                update(i);

                // unroll cancelEach(cancelers.slice(i, minus.length))
                var cancel;
                for (var at = i, end = i + minus.length; at < end; at++) {
                    cancel = cancelers[at];
                    if (cancel) cancel();
                }
                // plus
                swap(
                    cancelers,
                    i,
                    minus.length,
                    plus.map(function (inner, j) {
                        var index = indexRefs[i + j];
                        function innerRangeChange(plus, minus, k) {
                            update(index.index);
                            var start = cumulativeLengths[index.index] + k;
                            var end = cumulativeLengths[index.index] + k + minus.length;
                            var length = end - start;
                            output.swap(start, length, plus);
                        }
                        return observeRangeChange(inner, innerRangeChange, scope);
                    })
                );

            }

            var cancelRangeChange = observeRangeChange(input, rangeChange, scope);
            var cancel = emit(output);

            return function cancelFlattenObserver() {
                if (cancel) cancel();
                for (var index = 0, length = cancelers.length; index < length; index++) {
                    cancel = cancelers[index];
                    if (cancel) cancel();
                }
                cancelRangeChange();
            };
        }, scope);
    };
}

exports.makeConcatObserver = makeConcatObserver;
function makeConcatObserver() {
    // Unroll Array.prototype.slice.call(arguments)
    var observers = [];
    var index = arguments.length;
    while (index--) {
        observers[index] = arguments[index];
    }
    return makeFlattenObserver(makeObserversObserver(observers));
}

exports.makeSomeBlockObserver = makeSomeBlockObserver;
function makeSomeBlockObserver(observeCollection, observePredicate) {
    // collection.some{predicate} is equivalent to
    // collection.filter{predicate}.length !== 0
    var observeFilter = makeFilterBlockObserver(observeCollection, observePredicate);
    var observeLength = makePropertyObserver(observeFilter, observeLengthLiteral);
    return makeConverterObserver(observeLength, Boolean);
}

exports.makeEveryBlockObserver = makeEveryBlockObserver;
function makeEveryBlockObserver(observeCollection, observePredicate) {
    // collection.every{predicate} is equivalent to
    // collection.filter{!predicate}.length === 0
    var observeNotPredicate = makeConverterObserver(observePredicate, Operators.not);
    var observeFilter = makeFilterBlockObserver(observeCollection, observeNotPredicate);
    var observeLength = makePropertyObserver(observeFilter, observeLengthLiteral);
    return makeConverterObserver(observeLength, Operators.not);
}

// JavaScript (with shims from Collections): names.group(function (x) {return x[0]}) ->
// names.group{.0} -> [[klass, [...values]], [...], [...]]
// names.groupMap{.0}.entries()
exports.makeGroupBlockObserver = makeGroupBlockObserver;
function makeGroupBlockObserver(observeCollection, observeRelation) {
    var observeGroup = makeGroupMapBlockObserver(observeCollection, observeRelation);
    return makeEntriesObserver(observeGroup);
}

exports.makeGroupMapBlockObserver = makeGroupMapBlockObserver;
function makeGroupMapBlockObserver(observeCollection, observeRelation) {
    var observeRelationEntry = makeRelationEntryObserver(observeRelation);
    var observeRelationEntries = makeReplacingMapBlockObserver(observeCollection, observeRelationEntry);
    return function observeGroup(emit, scope) {
        return observeRelationEntries(function (input, original) {
            if (!input) return emit();

            var groups = new Map();

            function rangeChange(plus, minus, index) {
                var i, countI, item, group, create;
                for(i=0, countI = minus.length; i<countI; i++) {
                    item = minus[i];
                    group = groups.get(item[1]);
                    if (group.length === 1) {
                        groups["delete"](item[1]);
                    } else {
                        group["delete"](item[0]);
                    }
                }
                for(i=0, countI = plus.length; i<countI; i++) {
                    item = plus[i];
                    create = !groups.has(item[1]);
                    if (create) {
                        // constructClone ensures that the equivalence classes
                        // are the same type as the input.  It is shimmed on
                        // Array by Collections, and supported by all others.
                        group = original.constructClone();
                    } else {
                        group = groups.get(item[1]);
                    }
                    group.add(item[0]);
                    if (create) {
                        groups.set(item[1], group);
                    }
                }
            }

            var cancelRangeChange = observeRangeChange(input, rangeChange, scope);
            var cancel = emit(groups);
            return function cancelGroupObserver() {
                cancelRangeChange();
                if (cancel) cancel();
            };
        }, scope);
    };
}

function makeHeapBlockObserver(observeCollection, observeRelation, order) {
    var observeRelationEntry = makeRelationEntryObserver(observeRelation);
    var observeRelationEntries = makeReplacingMapBlockObserver(observeCollection, observeRelationEntry);

    function entryValueOrderCompare(a, b) {
        return Object.compare(a[1], b[1]) * order;
    }

    return function observeHeapBlock(emit, scope) {

        return observeRelationEntries(function (input) {
            if (!input) return emit();

            var heap = new Heap(null, entryValueEquals, entryValueOrderCompare);

            function rangeChange(plus, minus) {
                heap.addEach(plus);
                heap.deleteEach(minus);
            }

            function heapChange(item, key) {
                if (key === 0) {
                    if (!item) {
                        return emit();
                    } else {
                        return emit(item[0]);
                    }
                }
            }

            var cancelRangeChange = observeRangeChange(input, rangeChange, scope);
            var cancelHeapChange = observeMapChange(heap, heapChange, scope);

            return function cancelHeapObserver() {
                cancelRangeChange();
                cancelHeapChange();
            };
        }, scope);
    };
}

exports.makeMaxBlockObserver = makeMaxBlockObserver;
function makeMaxBlockObserver(observeCollection, observeRelation) {
    return makeHeapBlockObserver(observeCollection, observeRelation, 1);
}

// values.min{x}
exports.makeMinBlockObserver = makeMinBlockObserver;
function makeMinBlockObserver(observeCollection, observeRelation) {
    return makeHeapBlockObserver(observeCollection, observeRelation, -1);
}

exports.makeMaxObserver = makeMaxObserver;
function makeMaxObserver(observeCollection) {
    return makeHeapBlockObserver(observeCollection, observeValue, 1);
}

exports.makeMinObserver = makeMinObserver;
function makeMinObserver(observeCollection) {
    return makeHeapBlockObserver(observeCollection, observeValue, -1);
}

// used by both some and every blocks
var observeLengthLiteral = makeLiteralObserver("length");

// A utility for generating sum and average observers since they both need to
// capture some internal state on intiailization, and update that state on
// range changes.
function makeCollectionObserverMaker(setup) {
    return function (observeCollection) {
        return function (emit, scope) {
            emit = makeUniq(emit);
            return observeCollection(function (collection) {
                if (!collection) return emit();
                var rangeChange = setup(collection, emit);
                return observeRangeChange(collection, function (plus, minus, index) {
                    return emit(rangeChange(plus, minus, index));
                }, scope);
            }, scope);
        };
    };
}

exports.makeSumObserver = makeCollectionObserverMaker(function setup() {
    var sum = 0;
    return function rangeChange(plus, minus, index) {
        plus = plus.filter(isNumber);
        minus = minus.filter(isNumber);
        sum += plus.sum() - minus.sum();
        return sum;
    };
});

exports.makeAverageObserver = makeCollectionObserverMaker(function setup() {
    var sum = 0;
    var count = 0;
    return function rangeChange(plus, minus, index) {
        plus = plus.filter(isNumber);
        minus = minus.filter(isNumber);
        sum += plus.sum() - minus.sum();
        count += plus.length - minus.length;
        return sum / count;
    };
});

function isNumber(value) {
    return typeof value === "number" && !isNaN(value);
}

// contacts.view{start, length}
exports.makeViewObserver = makeNonReplacing(makeReplacingViewObserver);
function makeReplacingViewObserver(observeInput, observeStart, observeLength) {
    if (!observeLength) {
        observeLength = observeStart;
        observeStart = observeZero;
    }
    return function observeView(emit, scope) {
        return observeInput(function (input) {
            if (!input) return emit();

            var output = [];
            var length;
            var start;
            var boundedLength;
            var boundedStart;
            var active = false;

            var cancelRangeChangeObserver = observeRangeChange(input, rangeChange, scope);

            var cancelLengthObserver = observeLength(function replaceLength(newLength) {
                newLength = +newLength;
                if (isNaN(newLength)) {
                    newLength = undefined;
                }
                var becomesActive = typeof newLength === "number" && typeof start === "number";
                var newBoundedLength = Math.max(0, newLength);
                if (typeof boundedStart === "number") {
                    newBoundedLength = Math.min(newBoundedLength, input.length - boundedStart);
                }
                if (active !== becomesActive) {
                    if (becomesActive) {
                        output.swap(0, 0, input.slice(boundedStart, boundedStart + newBoundedLength));
                    } else {
                        output.clear();
                    }
                    active = becomesActive;
                } else if (active && boundedLength !== newBoundedLength) {
                    if (newBoundedLength < boundedLength) { // shrink
                        // A B C D E F
                        output.splice(newLength, boundedLength - newBoundedLength);
                        // A B C D
                    } else { // grow
                        // A B C D
                        output.swap(boundedLength, 0, input.slice(boundedStart + boundedLength, boundedStart + newBoundedLength));
                        // A B C D E F
                    }
                } // otherwise, was inactive, remains inactive
                length = newLength;
                boundedLength = newBoundedLength;
            }, scope);

            var cancelStartObserver = observeStart(function replaceStart(newStart) {
                newStart = +newStart;
                if (isNaN(newStart)) {
                    newStart = undefined;
                }
                var becomesActive = typeof length === "number" && typeof newStart === "number";
                var newBoundedStart = Math.max(0, newStart);
                if (typeof length === "number") {
                    newBoundedStart = Math.min(newBoundedStart, input.length);
                }
                var newBoundedLength = Math.max(0, length);
                if (typeof newBoundedStart === "number") {
                    newBoundedLength = Math.min(newBoundedLength, input.length - newBoundedStart);
                }
                if (active !== becomesActive) {
                    if (becomesActive) {
                        output.swap(0, output.length, input.slice(newBoundedStart, newBoundedStart + newBoundedLength));
                    } else {
                        output.clear();
                    }
                    active = becomesActive;
                } else if (active && boundedStart !== newBoundedStart) {
                    var diff = Math.abs(newBoundedStart - boundedStart);
                    if (diff < boundedLength && newBoundedStart < boundedStart) { // rolling backward
                        // old:     C D E F
                        output.swap(0, 0, input.slice(newBoundedStart, boundedStart));
                        // mid: A B C D E F
                        output.splice(newBoundedLength, output.length - newBoundedLength);
                        // new: A B C D
                    } else if (diff < boundedLength && newBoundedStart > boundedStart) { // rolling forward
                        // old: A B C D
                        output.swap(output.length, 0, input.slice(boundedStart + boundedLength, newBoundedStart + newBoundedLength));
                        // mid: A B C D E F
                        output.splice(0, output.length - newBoundedLength);
                        // new:     C D E F
                    } else {
                        // a new window that does not overlap the previous
                        output.swap(0, output.length, input.slice(newBoundedStart, newBoundedStart + newBoundedLength));
                    }
                } // otherwise, was inactive, remains inactive
                start = newStart;
                boundedStart = newBoundedStart;
                boundedLength = newBoundedLength;
            }, scope);

            function rangeChange(plus, minus, index) {
                if (!active) {
                    return;
                }
                var diff = plus.length - minus.length;
                if (index <= start) { // before window
                    if (diff > 0) { // grow by diff on leading side, rolling forward
                        // 0 1 2 3 4 5
                        //   ----- (start 1, length 3)
                        // A C D E F
                        // A>B<C D E F (["B"], [], 1)
                        // old: C D E
                        output.swap(0, 0, input.slice(start, start + diff));
                        // mid: B C D E
                        output.splice(length, output.length - length);
                        // new: B C D
                    } else { // shrink by -diff on leading side, rolling backward
                        // 0 1 2 3 4 5
                        //   ----- (start 1, length 3)
                        // A B C D E F
                        // A-C D E F ([], ["B"], 1)
                        // old: B C D
                        output.splice(0, -diff);
                        // mid: C D
                        output.swap(output.length, 0, input.slice(start + output.length, start + length));
                        // new: C D E
                    }
                } else if (index < start + length) { // within the window
                    output.swap(index - start, minus.length, plus);
                    if (diff > 0) {
                        // truncate
                        output.splice(length, output.length - length);
                    } else {
                        // regrow
                        output.swap(output.length, 0, input.slice(start + output.length, start + length));
                    }
                } // after the window
            }

            var cancel = emit(output);

            return function cancelViewChangeObserver() {
                if (cancel) cancel();
                cancelLengthObserver();
                cancelStartObserver();
                cancelRangeChangeObserver();
            };
        }, scope);
    };
}

var observeZero = makeLiteralObserver(0);

exports.makeEnumerateObserver = makeNonReplacing(makeReplacingEnumerateObserver);
exports.makeEnumerationObserver = exports.makeEnumerateObserver; // deprecated
function makeReplacingEnumerateObserver(observeArray) {
    return function (emit, scope) {
        return observeArray(function replaceArray(input) {
            if (!input) return emit();

            var output = [];
            function update(index) {
                for (; index < output.length; index++) {
                    output[index].set(0, index);
                }
            }
            function rangeChange(plus, minus, index) {
                output.swap(index, minus.length, plus.map(function (value, offset) {
                    return [index + offset, value];
                }));
                update(index + plus.length);
            }
            var cancelRangeChange = observeRangeChange(input, rangeChange, scope);
            var cancel = emit(output);
            return function cancelEnumerateObserver() {
                if (cancel) cancel();
                cancelRangeChange();
            };
        }, scope);
    };
}

// length.range() -> [0, 1, 2, ...length]
exports.makeRangeObserver = makeRangeObserver;
function makeRangeObserver(observeLength) {
    return function observeRange(emit, scope) {
        var output = [];
        var cancel = emit(output);
        var cancelLengthObserver = observeLength(function (length) {
            length = length >>> 0;
            if (length == null) {
                output.clear();
            } else if (length > output.length) {
                // pre-fab the extension so the we only have to propagate one
                // range change to the output.
                var extension = [];
                for (var i = output.length; i < length; i++) {
                    extension.push(i);
                }
                output.swap(output.length, 0, extension);
            } else if (length < output.length) {
                output.splice(length, output.length);
            }
        }, scope);
        return function cancelObserveRange() {
            if (cancel) cancel();
            if (cancelLengthObserver) cancelLengthObserver();
        };
    };
}


// String Observers

exports.makeStartsWithObserver = makeStartsWithObserver;
function makeStartsWithObserver(observeHaystack, observeNeedle) {
    return function observeStartsWith(emit, scope) {
        return observeNeedle(function (needle) {
            if (typeof needle !== "string")
                return emit();
            var expression = new RegExp("^" + RegExp.escape(needle));
            return observeHaystack(function (haystack) {
                if (typeof haystack !== "string")
                    return emit();
                return emit(expression.test(haystack));
            }, scope);
        }, scope);
    };
}

exports.makeEndsWithObserver = makeEndsWithObserver;
function makeEndsWithObserver(observeHaystack, observeNeedle) {
    return function observeEndsWith(emit, scope) {
        return observeNeedle(function (needle) {
            if (typeof needle !== "string")
                return emit();
            var expression = new RegExp(RegExp.escape(needle) + "$");
            return observeHaystack(function (haystack) {
                if (typeof haystack !== "string")
                    return emit();
                return emit(expression.test(haystack));
            }, scope);
        }, scope);
    };
}

exports.makeContainsObserver = makeContainsObserver;
function makeContainsObserver(observeHaystack, observeNeedle) {
    return function observeContains(emit, scope) {
        return observeNeedle(function (needle) {
            if (typeof needle !== "string")
                return emit();
            var expression = new RegExp(RegExp.escape(needle));
            return observeHaystack(function (haystack) {
                if (typeof haystack !== "string")
                    return emit();
                return emit(expression.test(haystack));
            }, scope);
        }, scope);
    };
}

exports.makeJoinObserver = makeJoinObserver;
function makeJoinObserver(observeArray, observeDelimiter) {
    observeDelimiter = observeDelimiter || observeNullString;
    return function observeJoin(emit, scope) {
        return observeArray(function changeJoinArray(array) {
            if (!array) return emit();
            return observeDelimiter(function changeJoinDelimiter(delimiter) {
                if (typeof delimiter !== "string") return emit();
                var cancel;
                function rangeChange() {
                    if (cancel) cancel();
                    cancel = emit(array.join(delimiter));
                }
                var cancelRangeChange = observeRangeChange(array, rangeChange, scope);
                return function cancelJoinObserver() {
                    cancelRangeChange();
                    if (cancel) cancel();
                };
            }, scope);
        }, scope);
    };
}

var observeNullString = makeLiteralObserver("");

// Collection Observers

exports.observeRangeChange = observeRangeChange;
function observeRangeChange(collection, emit, scope) {
    if ((!collection) || (!collection.toArray) || (!collection.addRangeChangeListener)) {
        return Function.noop;
    }

    var cancel, cancelRangeChange;

    function rangeChange(plus, minus, index) {
        if (cancel) cancel();
        cancel = emit(plus, minus, index);
    }
    rangeChange(Array.isArray(collection) ? collection : collection.toArray(), Array.empty, 0);

    cancelRangeChange = collection.addRangeChangeListener(
        rangeChange,
        null,
        scope.beforeChange
    );
    return function cancelRangeObserver() {
        if (cancel) cancel();
        cancelRangeChange();
    };
}

// array[array.length - 1]
// array.last()
exports.makeLastObserver = makeLastObserver;
function makeLastObserver(observeCollection) {
    return function observeLast(emit, scope) {
        return observeCollection(function (collection) {
            return _observeLast(collection, emit, scope);
        }, scope);
    };
}

// []
// [1, 2, 3], [], 0 -> [1, 2, 3] grow from start
// [4], [], 3 -> [1, 2, 3, 4] grow
// [], [4], 3 -> [1, 2, 3]
exports.observeLast = observeLast;
var _observeLast = observeLast;
function observeLast(collection, emit, scope) {
    var lastIndex = -1;
    var cancel;
    var prev = null;
    function rangeChange(plus, minus, index) {
        lastIndex += plus.length - minus.length;
        // short circuit if the change does not have the reach to change the
        // last value
        if (
            index + minus.length < lastIndex &&
            index + plus.length < lastIndex
        ) {
            return;
        }
        var next = lastIndex < 0 ? null : collection.get(lastIndex);
        if (cancel) cancel();
        cancel = emit(next);
        prev = next;
    }
    var cancelRangeChange = observeRangeChange(collection, rangeChange, scope);
    return function cancelLastObserver() {
        if (cancel) cancel();
        if (cancelRangeChange) cancelRangeChange();
    };
}

exports.makeOnlyObserver = makeOnlyObserver;
function makeOnlyObserver(observeCollection) {
    return function (emit, scope) {
        return observeCollection(makeUniq(function replaceCollectionForOnly(collection) {
            return observeOnly(collection, emit, scope);
        }), scope);
    };
}

// selectedValues <-> selection.map{value}
// selectedValue <-> selectedValues.only()
exports.observeOnly = observeOnly;
function observeOnly(collection, emit, scope) {
    var length = 0;
    function rangeChange(plus, minus, index) {
        length += plus.length - minus.length;
        if (length !== 1) return emit();
        return emit(collection.only());
    }
    return observeRangeChange(collection, rangeChange, scope);
}

exports.makeOneObserver = makeOneObserver;
function makeOneObserver(observeCollection) {
    return function (emit, scope) {
        return observeCollection(makeUniq(function replaceCollectionForOne(collection) {
            return observeOne(collection, emit, scope);
        }), scope);
    };
}

exports.observeOne = observeOne;
function observeOne(collection, emit, scope) {
    var length = 0;
    function rangeChange(plus, minus, index) {
        length += plus.length - minus.length;
        if (length === 0) return emit();
        return emit(collection.one());
    }
    return observeRangeChange(collection, rangeChange, scope);
}

// this.values = [];
// this.values.addRangeChangeListener(this, "values") // dispatches handleValuesRangeChange
// this.defineBinding("values.rangeContent()", {"<-": "otherValues"});
exports.makeRangeContentObserver = makeRangeContentObserver;
function makeRangeContentObserver(observeCollection) {
    return function observeContent(emit, scope) {
        //Add scope variable closer
        //emit and scope are always together? worth inlining them?
        return observeCollection(function (collection) {
            if (!collection || !collection.addRangeChangeListener) {
                return emit(collection);
            } else {
                return observeRangeChange(collection, function rangeChange() {
                    return emit(collection);
                }, scope);
            }
        }, scope);
    };
}

exports.makeMapContentObserver = makeMapContentObserver;
function makeMapContentObserver(observeCollection) {
    return function observeContent(emit, scope) {
        return observeCollection(function (collection) {
            if (!collection || !collection.addMapChangeListener) {
                return emit(collection);
            } else {
                return observeMapChange(collection, function rangeChange() {
                    return emit(collection);
                }, scope);
            }
        }, scope);
    };
}

exports.observeMapChange = observeMapChange;
function observeMapChange(collection, emit, scope) {
    if (!collection.addMapChangeListener)
        return;
    var cancelers = new Map();
    function mapChange(value, key, collection) {
        var cancel = cancelers.get(key);
        cancelers["delete"](key);
        if (cancel) cancel();
        cancel = emit(value, key, collection);
        if (value === undefined) {
            if (cancel) cancel();
        } else {
            cancelers.set(key, cancel);
        }
    }
    collection.forEach(mapChange);
    var cancelMapChange = collection.addMapChangeListener(mapChange, scope.beforeChange);
    return function cancelMapObserver() {
        // No point in unrolling this. The underlying data structure is a Map,
        // not an array.
        cancelers.forEach(function (cancel) {
            if (cancel) cancel();
        });
        cancelMapChange();
    };
}

var makeEntriesObserver = exports.makeEntriesObserver = makeNonReplacing(makeReplacingEntriesObserver);
function makeReplacingEntriesObserver(observeCollection) {
    return function _observeEntries(emit, scope) {
        return observeCollection(function (collection) {
            if (!collection) return emit();
            return observeEntries(collection, emit, scope);
        }, scope);
    };
}

exports.observeEntries = observeEntries;
function observeEntries(collection, emit, scope) {
    var items = [];
    var keyToEntry = new Map();
    var cancel = emit(items);
    // TODO observe addition and deletion with separate observers
    function mapChange(value, key, collection) {
        var item, index;
        if (!keyToEntry.has(key)) { // add
            item = [key, value];
            keyToEntry.set(key, item);
            items.push(item);
        } else if (value == null) { // delete
            item = keyToEntry.get(key);
            keyToEntry["delete"](key);
            index = items.indexOf(item);
            items.splice(index, 1);
        } else { // update
            item = keyToEntry.get(key);
            item.set(1, value);
        }
    }
    var cancelMapChange = observeMapChange(collection, mapChange, scope);
    return function cancelObserveEntries() {
        if (cancel) cancel();
        if (cancelMapChange) cancelMapChange();
    };
}

exports.makeKeysObserver = makeKeysObserver;
function makeKeysObserver(observeCollection) {
    var observeEntries = makeEntriesObserver(observeCollection);
    return makeMapBlockObserver(observeEntries, observeEntryKey);
}

exports.observeEntryKey = observeEntryKey;
function observeEntryKey(emit, scope) {
    if (!scope.value) return emit();
    return emit(scope.value[0]);
}

exports.makeValuesObserver = makeValuesObserver;
function makeValuesObserver(observeCollection) {
    var observeEntries = makeEntriesObserver(observeCollection);
    return makeMapBlockObserver(observeEntries, observeEntryValue);
}

exports.observeEntryValue = observeEntryValue;
function observeEntryValue(emit, scope) {
    if (!scope.value) return emit();
    return emit(scope.value[1]);
}

exports.makeToMapObserver = makeToMapObserver;
function makeToMapObserver(observeObject) {
    return function observeToMap(emit, scope) {
        var map = new Map();
        var cancel = emit(map);

        var cancelObjectObserver = observeObject(function replaceObject(object) {
            map.clear();
            if (!object || typeof object !== "object") return;

            // Must come first because Arrays also implement map changes, but
            // Maps do not implement range changes.
            if (object.addRangeChangeListener) { // array/collection of items
                return observeUniqueEntries(function (entries) {
                    function rangeChange(plus, minus) {

                        var i, countI;
                        for(i=0, countI = minus.length; i<countI; i++) {
                            map["delete"](minus[i][0]);
                        }

                        for(i=0, countI = plus.length; i<countI; i++) {
                            map.set(plus[i][0], plus[i][1]);
                        }
                    }
                    return observeRangeChange(entries, rangeChange, scope);
                }, scope.nest(object));
            } else if (object.addMapChangeListener) { // map reflection
                return observeMapChange(object, function mapChange(value, key) {
                    if (value === undefined) {
                        map["delete"](key);
                    } else {
                        map.set(key, value);
                    }
                }, scope);
            } else { // object literal
                var cancelers = [];
                var index = 0;
                for (var key in object) {
                    cancelers[index++] = _observeProperty(object, key, function (value) {
                        if (value === undefined) {
                            map["delete"](key);
                        } else {
                            map.set(key, value);
                        }
                    }, scope);
                }
                return function cancelPropertyObservers() {
                    for (var index = 0, length = cancelers.length; index < length; index++) {
                        cancelers[index]();
                    }
                };
            }
        }, scope) || Function.noop;

        return function cancelObjectToMapObserver() {
            if (cancel) cancel();
            cancelObjectObserver();
        };
    };
}

// A utility for makeToMapObserver
// object.group{.0}.map{.1.last()}
var observeUniqueEntries = makeMapBlockObserver(
    makeGroupBlockObserver(
        observeValue,
        observeEntryKey
    ),
    makeLastObserver(observeEntryValue)
);


// Combinatoric Observers

exports.makeParentObserver = makeParentObserver;
function makeParentObserver(observeExpression) {
    return function observeParentScope(emit, scope) {
        if (!scope.parent) {
            return emit();
        } else {
            return observeExpression(emit, scope.parent);
        }
    };
}

exports.makeConverterObserver = makeConverterObserver;
function makeConverterObserver(observeValue, convert, thisp) {
    return function observeConversion(emit, scope) {
        emit = makeUniq(emit);
        return observeValue(function replaceValue(value) {
            return emit(convert.call(thisp, value));
        }, scope);
    };
}

exports.makeComputerObserver = makeComputerObserver;
function makeComputerObserver(observeArgs, compute, thisp) {
    return function (emit, scope) {
        emit = makeUniq(emit);
        return observeArgs(function replaceArgs(args) {
            if (!args || !args.every(Operators.defined)) return;
            if(args.length === 1) {
                return emit(compute.call(thisp, args[0]));
            }
            else if(args.length === 2) {
                return emit(compute.call(thisp, args[0], args[1]));
            }
            else {
                return emit(compute.apply(thisp, args));
            }

        }, scope);
    };
}

exports.makePathObserver = makeExpressionObserver; // deprecated
exports.makeExpressionObserver = makeExpressionObserver;
function makeExpressionObserver(observeInput, observeExpression) {
    var parse = require("./parse");
    var compileObserver = require("./compile-observer");
    return function expressionObserver(emit, scope) {
        emit = makeUniq(emit);
        return observeExpression(function replaceExpression(expression) {
            if (expression == null) return emit();
            var syntax, observeOutput;
            try {
                syntax = parse(expression);
                observeOutput = compileObserver(syntax);
            } catch (exception) {
                return emit();
            }
            return observeInput(function replaceInput(input) {
                return observeOutput(emit, scope.nest(input));
            }, scope);
        }, scope);
    };
}

// Suppose you have input: {object: {a: 10, b: 20}}
// This FRB expression: object.(a + b)
// Uses this combinator:
exports.makeWithObserver = makeWithObserver;
function makeWithObserver(observeInput, observeExpression) {
    return function observeWith(emit, scope) {
        return observeInput(function replaceInput(input) {
            if (input == null) return emit();
            return observeExpression(function replaceValue(value) {
                if (value == null) return emit();
                return emit(value);
            }, scope.nest(input));
        }, scope);
    };
}

exports.makeToArrayObserver = makeNonReplacing(Function.identity);
exports.makeAsArrayObserver = exports.makeToArrayObserver; // XXX deprecated

// Utility Methods
// ---------------

var merge = require("./merge").merge;

// A utility for generating map and filter observers because they both replace
// the output array whenever the input array is replaced.  instead, this
// wrapper receives the replacement array and mirrors it on an output array
// that only gets emitted once.
function makeNonReplacing(wrapped) { // alt makeNonReplacingObserverMaker
    return function makeNonReplacingObserver() {
        var observe;
        if(arguments.length === 1) {
            observe = wrapped.call(this, arguments[0]);
        }
        else if(arguments.length === 2) {
            observe = wrapped.call(this, arguments[0], arguments[1]);
        }
        else {
            observe = wrapped.apply(this, arguments);
        }

        return function observeArrayWithoutReplacing(emit, scope) {
            var output = [];
            var cancelObserver = observe(function (input) {
                function rangeChange(plus, minus, index) {
                    output.swap(index, minus.length, plus);
                }
                if (!input || !input.addRangeChangeListener) {
                    output.clear();
                } else {
                    // equivalent to: output.swap(0, output.length, input);
                    merge(output, input);
                    // TODO fix problem that this would get called twice on replacement
                    input.addRangeChangeListener(rangeChange, null, scope.beforeChange);
                    return function cancelRangeChange() {
                        input.removeRangeChangeListener(rangeChange, null, scope.beforeChange);
                    };
                }
            }, scope);
            var cancel = emit(output);
            return function cancelNonReplacingObserver() {
                if (cancelObserver) cancelObserver();
                if (cancel) cancel();
            };
        };
    };
}

// wraps an emitter such that repeated values are ignored
exports.makeUniq = makeUniq;
function makeUniq(emit) {
    var previous;
    return function uniqEmit(next) {
        if (next !== previous) {
            var result;
            if(arguments.length === 1) {
                result = emit.call(this, arguments[0]);
            }
            else if(arguments.length === 2) {
                result = emit.apply(this, arguments[0], arguments[1]);
            }
            else {
                result = emit.apply(this, arguments);
            }

            previous = next;
            return result;
        }
    };
}

exports.cancelEach = cancelEach;
function cancelEach(cancelers) {
    cancelers.forEach(function (cancel) {
        if (cancel) {
            cancel();
        }
    });
}

// This emit function decorator originally ensured that the previous canceller
// returned by emit would be called before dispatching emit again. This was
// superfluous and its removal did not incur any noticable memory leakage or
// correctness issues. In fact, the behavior of equality binders mysteriously
// improved.
// XXX deprecated Retained because this function is used in Montage.
exports.autoCancelPrevious = autoCancelPrevious;
function autoCancelPrevious(emit) {
    var cancelPrevious;
    return function replaceObserver() {
        if (cancelPrevious) cancelPrevious();
        if(arguments.length === 1) {
            cancelPrevious = emit.call(void 0,arguments[0]);
        }
        else if(arguments.length === 2) {
            cancelPrevious = emit.call(void 0,arguments[0],arguments[1]);
        }
        else if(arguments.length === 3) {
            cancelPrevious = emit.call(void 0,arguments[0],arguments[1],arguments[2]);
        }
        else {
            var args = new Array(arguments.length);
            for (var i = 0, l = arguments.length; i < l; i++) {
                args[i] = arguments[i];
            }
            cancelPrevious = emit.apply(void 0, args);
        }
        return function cancelObserver() {
            if (cancelPrevious) cancelPrevious();
            cancelPrevious = void 0;
        };
    };
}

// Backported from collections@v2.
// The version in collections v1 produces an often superfluous return array.
// does not dispatch changes
function swap(array, start, minusLength, plus) {
    // Unrolled implementation into JavaScript for a couple reasons.
    // Calling splice can cause large stack sizes for large swaps. Also,
    // splice cannot handle array holes.

    if (start < 0) {
        start = array.length + start;
    } else if (start > array.length) {
        array.length = start;
    }

    if (start + minusLength > array.length) {
        // Truncate minus length if it extends beyond the length
        minusLength = array.length - start;
    } else if (minusLength < 0) {
        // It is the JavaScript way.
        minusLength = 0;
    }

    var diff = plus.length - minusLength;
    var oldLength = array.length;
    var newLength = array.length + diff;

    if (diff > 0) {
        // Head Tail Plus Minus
        // H H H H M M T T T T
        // H H H H P P P P T T T T
        //         ^ start
        //         ^-^ minus.length
        //           ^ --> diff
        //         ^-----^ plus.length
        //             ^------^ tail before
        //                 ^------^ tail after
        //                   ^ start iteration
        //                       ^ start iteration offset
        //             ^ end iteration
        //                 ^ end iteration offset
        //             ^ start + minus.length
        //                     ^ length
        //                   ^ length - 1
        for (var index = oldLength - 1; index >= start + minusLength; index--) {
            var offset = index + diff;
            if (index in array) {
                array[offset] = array[index];
            } else {
                // Oddly, PhantomJS complains about deleting array
                // properties, unless you assign undefined first.
                array[offset] = void 0;
                delete array[offset];
            }
        }
    }
    for (var index = 0; index < plus.length; index++) {
        if (index in plus) {
            array[start + index] = plus[index];
        } else {
            array[start + index] = void 0;
            delete array[start + index];
        }
    }
    if (diff < 0) {
        // Head Tail Plus Minus
        // H H H H M M M M T T T T
        // H H H H P P T T T T
        //         ^ start
        //         ^-----^ length
        //         ^-^ plus.length
        //             ^ start iteration
        //                 ^ offset start iteration
        //                     ^ end
        //                         ^ offset end
        //             ^ start + minus.length - plus.length
        //             ^ start - diff
        //                 ^------^ tail before
        //             ^------^ tail after
        //                     ^ length - diff
        //                     ^ newLength
        for (var index = start + plus.length; index < oldLength - diff; index++) {
            var offset = index - diff;
            if (offset in array) {
                array[index] = array[offset];
            } else {
                array[index] = void 0;
                delete array[index];
            }
        }
    }
    array.length = newLength;
}
