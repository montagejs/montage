
var Scope = require("./scope");
var Observers = require("./observers");
var autoCancelPrevious = Observers.autoCancelPrevious;
var observeRangeChange = Observers.observeRangeChange;
var cancelEach = Observers.cancelEach;
var makeNotObserver = Observers.makeNotObserver;
var makeOrObserver = Observers.makeOrObserver;
var makeAndObserver = Observers.makeAndObserver;
var observeValue = Observers.observeValue;
var observeUndefined = Observers.makeLiteralObserver();
var trueScope = new Scope(true);
var falseScope = new Scope(false);

function getStackTrace() {
    return new Error("").stack.replace(/^.*\n.*\n/, "\n");
}

exports.bindProperty = bindProperty;
var _bindProperty = bindProperty; // to bypass scope shadowing problems below
function bindProperty(object, key, observeValue, source, descriptor, trace) {
    return observeValue(autoCancelPrevious(function replaceBoundPropertyValue(value) {
        if (descriptor.isActive) {
            return;
        }
        try {
            descriptor.isActive = true;
            trace && console.log("SET", trace.targetPath, "TO", value, "ON", object, "BECAUSE", trace.sourcePath, getStackTrace());
            if (Array.isArray(object) && key >>> 0 === key) {
                // TODO spec this case
                object.set(key, value);
            } else {
                object[key] = value;
            }
        } finally {
            descriptor.isActive = false;
        }
    }), source);
}

exports.makePropertyBinder = makePropertyBinder;
function makePropertyBinder(observeObject, observeKey) {
    return function bindProperty(observeValue, source, target, descriptor, trace) {
        return observeKey(autoCancelPrevious(function replaceKey(key) {
            if (key == null) return;
            function replaceObject(object) {
                return (object == null)
                        ? void 0
                        : (object.bindProperty)
                            ? object.bindProperty(key, observeValue, source, descriptor, trace)
                            : replaceObject.bindProperty(object, key, observeValue, source, descriptor, trace);
            };
            replaceObject.bindProperty = _bindProperty;
            return observeObject(autoCancelPrevious(replaceObject), target);
        }), target);
    };
}

exports.bindGet = bindGet;
var _bindGet = bindGet; // to bypass scope shadowing below
function bindGet(collection, key, observeValue, source, descriptor, trace) {
    return observeValue(autoCancelPrevious(function replaceValue(value) {
        if (descriptor.isActive) {
            return;
        }
        try {
            descriptor.isActive = true;
            trace && console.log("SET FOR KEY", key, "TO", value, "ON", collection, "BECAUSE", trace.sourcePath, getStackTrace());
            collection.set(key, value);
        } finally {
            descriptor.isActive = false;
        }
    }), source);
}

exports.makeGetBinder = makeGetBinder;
function makeGetBinder(observeCollection, observeKey) {
    return function bindGet(observeValue, source, target, descriptor, trace) {
        return observeCollection(autoCancelPrevious(function replaceCollection(collection) {
            if (!collection) return;

            function replaceKey(key) {
                return (key == null)
                        ?  void 0
                        : replaceKey.bindGet(collection, key, observeValue, source, descriptor, trace);
            };
            replaceKey.bindGet = _bindGet;

            return observeKey(autoCancelPrevious(replaceKey), target);
        }), target);
    };
}

exports.makeHasBinder = makeHasBinder;
function makeHasBinder(observeSet, observeValue) {
    return function bindHas(observeHas, source, target, descriptor, trace) {
        return observeSet(autoCancelPrevious(function replaceHasBindingSet(set) {
            if (!set) return;
            return observeValue(autoCancelPrevious(function replaceHasBindingValue(value) {
                if (value == null) return;

                function changeWhetherSetHas(has) {
                    // wait for the initial value to be updated by the
                    // other-way binding
                    if (has) { // should be in set
                        if (!changeWhetherSetHas.set.has(value)) {
                            trace && console.log("ADD", value, "TO", trace.targetPath, "BECAUSE", trace.sourcePath, getStackTrace());
                            changeWhetherSetHas.set.add(value);
                        }
                    } else { // should not be in set
                        while (changeWhetherSetHas.set.has(value)) {
                            trace && console.log("REMOVE", value, "FROM", trace.targetPath, "BECAUSE", trace.sourcePath, getStackTrace());
                            changeWhetherSetHas.set.delete(value);
                        }
                    }
                };
                changeWhetherSetHas.set = set;
                return observeHas(autoCancelPrevious(changeWhetherSetHas), source);
            }), target);
        }), target);
    };
}

// a == b <-> c
exports.makeEqualityBinder = makeEqualityBinder;
function makeEqualityBinder(bindLeft, observeRight) {
    return function bindEquals(observeEquals, source, target, descriptor, trace) {
        // c
        return observeEquals(autoCancelPrevious(function changeWhetherEquals(equals) {
            if (equals) {
                trace && console.log("BIND", trace.targetPath, "TO", trace.sourcePath, getStackTrace());
                // a <-> b
                var cancel = bindLeft(observeRight, source, source, descriptor, trace);
                return function cancelEqualityBinding() {
                    trace && console.log("UNBIND", trace.targetPath, "FROM", trace.sourcePath, getStackTrace());
                };
            }
        }), target);
    };
}

// collection.every{condition} <- everyCondition
exports.makeEveryBlockBinder = makeEveryBlockBinder;
function makeEveryBlockBinder(observeCollection, bindCondition, observeValue) {
    return function bindEveryBlock(observeEveryCondition, source, target, descriptor, trace) {
        return observeEveryCondition(autoCancelPrevious(function replaceCondition(condition) {
            if (!condition) return;
            return observeCollection(autoCancelPrevious(function replaceCollection(collection) {
                if (!collection) return;
                var cancelers = [];
                function rangeChange(plus, minus, index) {
                    rangeChange.cancelEach(cancelers.slice(index, index + minus.length));
                    var plusMapped = [];
                    for(var i=0, countI = plus.length, scope;i<countI;i++) {
                        scope = target.nest(plus[i]);
                        plusMapped.push(rangeChange.bindCondition(observeValue, scope, scope, descriptor, trace));
                    }
                    cancelers.swap(index, minus.length, plusMapped);
                };
                rangeChange.cancelEach = cancelEach;
                rangeChange.bindCondition = bindCondition;

                var cancelRangeChange = observeRangeChange(collection, rangeChange, target);
                return function cancelEveryBinding() {
                    cancelEach(cancelers);
                    cancelRangeChange();
                };
            }), target);
        }), source);
    };
};

exports.makeAndBinder = makeAndBinder;
function makeAndBinder(bindLeft, bindRight, observeLeft, observeRight, observeLeftBind, observeRightBind) {
    var observeNotRight = makeNotObserver(observeRight);
    var observeLeftAndNotRight = makeAndObserver(observeLeft, observeNotRight);
    return function bindEveryBlock(observeAndCondition, source, target, descriptor, trace) {
        return observeAndCondition(autoCancelPrevious(function replaceAndCondition(condition) {
            if (condition == null) {
            } else if (condition) {
                var cancelLeft = bindLeft(observeLeftBind, trueScope, target, descriptor, trace);
                var cancelRight = bindRight(observeRightBind, trueScope, target, descriptor, trace);
                return function cancelAndBinding() {
                    cancelLeft();
                    cancelRight();
                };
            } else {
                return bindLeft(observeLeftAndNotRight, target, target, descriptor, trace);
            }
        }), source);
    };
}

exports.makeOrBinder = makeOrBinder;
function makeOrBinder(bindLeft, bindRight, observeLeft, observeRight, observeLeftBind, observeRightBind) {
    var observeNotRight = makeNotObserver(observeRight);
    var observeLeftOrNotRight = makeOrObserver(observeLeft, observeNotRight);
    return function bindEveryBlock(observeOrCondition, source, target, descriptor, trace) {
        return observeOrCondition(autoCancelPrevious(function replaceOrCondition(condition) {
            if (condition == null) {
            } else if (!condition) {
                var cancelLeft = bindLeft(observeLeftBind, falseScope, target, descriptor, trace);
                var cancelRight = bindRight(observeRightBind, falseScope, target, descriptor, trace); return function cancelOrBinding() {
                    cancelLeft();
                    cancelRight();
                };
            } else {
                return bindLeft(observeLeftOrNotRight, target, target, descriptor, trace);
            }
        }), source);
    };
}

// (a ? b : c) <- d
exports.makeConditionalBinder = makeConditionalBinder;
function makeConditionalBinder(observeCondition, bindConsequent, bindAlternate) {
    return function bindCondition(observeSource, source, target, descriptor, trace) {
        // a
        return observeCondition(autoCancelPrevious(function replaceCondition(condition) {
            if (condition == null) return;
            if (condition) {
                // b <- d
                return bindConsequent(observeSource, source, target, descriptor, trace);
            } else {
                // c <- d
                return bindAlternate(observeSource, source, target, descriptor, trace);
            }
        }), source);
    };
}

// collection.only() <- value
exports.makeOnlyBinder = makeOnlyBinder;
function makeOnlyBinder(observeCollection) {
    return function bindOnly(observeValue, sourceScope, targetScope, descriptor, trace) {
        return observeCollection(autoCancelPrevious(function replaceCollection(collection) {
            if (!collection) return;
            return observeValue(autoCancelPrevious(function replaceOnlyValue(value) {
                if (value == null) return;
                if (collection.splice) {
                    collection.splice(0, collection.length, value);
                } else if (collection.clear && collection.add) {
                    collection.clear();
                    collection.add(value);
                }
            }), sourceScope);
        }), targetScope);
    };
}

// collection.one() <- value
// empty the collection and set its one item to value
exports.makeOneBinder = makeOneBinder;
function makeOneBinder(observeCollection) {
    return function bindOne(observeValue, sourceScope, targetScope, descriptor, trace) {
        return observeCollection(autoCancelPrevious(function replaceCollection(collection) {
            if (!collection) return;
            return observeValue(autoCancelPrevious(function replaceOneValue(value) {
                if (value == null) return;

                // FIXME: this is debatable. If set to its current value, do we clear the rest of the collection?
                // I err towards no, in part because this solves the case of two-way bindings, where we were always
                // clearing out the source collection. That could be solved other ways without this little quirk.
                if (value === collection.one()) return;

                if (collection.splice) {
                    collection.splice(0, collection.length, value);
                } else if (collection.clear && collection.add) {
                    collection.clear();
                    collection.add(value);
                }
            }), sourceScope);
        }), targetScope);
    };
}

// a.rangeContent() <- b
exports.makeRangeContentBinder = makeRangeContentBinder;
function makeRangeContentBinder(observeTarget, bindTarget) {
    return function bindRangeContent(observeSource, sourceScope, targetScope, descriptor, trace) {
        return observeTarget(autoCancelPrevious(function replaceRangeContentTarget(target) {
            if (!target) {
                return bindTarget(
                    Observers.makeLiteralObserver([]),
                    sourceScope,
                    targetScope,
                    descriptor,
                    trace
                );
            }

            return observeSource(autoCancelPrevious(function replaceRangeContentSource(source) {
                if (source === target) {
                    return;
                }
                if (!source) {
                    target.clear();
                    return;
                }
                if (!source.addRangeChangeListener) {
                    return;
                }

                function rangeContentSourceRangeChange(plus, minus, index) {
                    if (isActive(target))
                        return;
                    if (trace) {
                        console.log("SWAPPING", minus, "FOR", plus, "AT", index, "ON", trace.targetPath, getStackTrace());
                    }
                    if (target.swap) {
                        target.swap(index, minus.length, plus);
                    } else if (target.add && (target.remove || target["delete"])) {
                        var i, countI, item, deleteMethod;
                        for(i=0, countI = plus.length, item;(item = plus[i]); i++) {
                            target.add(item);
                        }

                        deleteMethod = target.remove || target["delete"];
                        for(i=0, countI = minus.length, item;(item = minus[i]); i++) {
                            target.deleteMethod(item);
                        }
                    }
                }

                source.addRangeChangeListener(rangeContentSourceRangeChange);
                rangeContentSourceRangeChange(Array.from(source), Array.from(target), 0);
                return function cancelRangeContentBinding() {
                    source.removeRangeChangeListener(rangeContentSourceRangeChange);
                };
            }), sourceScope);
        }), targetScope);
    };
}

exports.makeMapContentBinder = makeMapContentBinder;
function makeMapContentBinder(observeTarget) {
    return function bindMapContent(observeSource, source, target, descriptor, trace) {
        return observeTarget(autoCancelPrevious(function replaceMapContentBindingTarget(target) {
            if (!target) return;
            return observeSource(autoCancelPrevious(function replaceMapContentBindingSource(source) {
                if (!source) {
                    target.clear();
                    return;
                }

                function mapChange(value, key) {
                    if (descriptor.isActive) {
                        return;
                    }
                    try {
                        descriptor.isActive = true;
                        if (value === undefined) {
                            if (trace) {
                                trace && console.log("DELETED", trace.targetPath, "FOR KEY", key, "ON", target, "BECAUSE", trace.sourcePath, getStackTrace());
                            }
                            if (Array.isArray(target)) {
                                target.splice(key, 1);
                            } else {
                                target["delete"](key);
                            }
                        } else {
                            if (trace) {
                                trace && console.log("SET", trace.targetPath, "FOR KEY", key, "TO", value, "ON", target, "BECAUSE", trace.sourcePath, getStackTrace());
                            }
                            target.set(key, value);
                        }
                    } finally {
                        descriptor.isActive = false;
                    }
                }
                target.clear();
                source.forEach(mapChange);
                return source.addMapChangeListener(mapChange);
            }), source);
        }), target);
    };
}

// a.reversed() <-> b
exports.makeReversedBinder = makeReversedBinder;
function makeReversedBinder(observeTarget) {
    return function bindReversed(observeSource, source, target, descriptor, trace) {
        return observeTarget(autoCancelPrevious(function replaceReversedBindingTarget(target) {
            if (!target) return;
            return observeSource(autoCancelPrevious(function replaceReversedBindingSource(source) {
                if (!source) {
                    target.clear();
                    return;
                }

                function rangeChange(plus, minus, index) {
                    if (isActive(target))
                        return;
                    var reflected = target.length - index - minus.length;
                    target.swap(reflected, minus.length, plus.reversed());
                }
                source.addRangeChangeListener(rangeChange);
                rangeChange(source, target, 0);
                return function cancelReversedBinding() {
                    source.removeRangeChangeListener(rangeChange);
                };
            }), source);
        }), target);
    };
}

exports.makeDefinedBinder = makeDefinedBinder;
function makeDefinedBinder(bindTarget) {
    return function bindReversed(observeSource, sourceScope, targetScope, descriptor, trace) {
        return observeSource(autoCancelPrevious(function replaceSource(condition) {
            if (!condition) {
                return bindTarget(
                    observeUndefined,
                    sourceScope,
                    targetScope,
                    descriptor,
                    trace
                );
            } else {
                return Function.noop;
            }
        }), targetScope);
    }
}

exports.makeParentBinder = makeParentBinder;
function makeParentBinder(bindTarget) {
    return function bindParent(observeSource, sourceScope, targetScope, descriptor, trace) {
        if (!targetScope.parent) {
            return;
        }
        return bindTarget(observeSource, sourceScope, targetScope.parent, descriptor, trace);
    };
}

exports.makeWithBinder = makeWithBinder;
function makeWithBinder(observeTarget, bindTarget) {
    return function bindWith(observeSource, sourceScope, targetScope, descriptor, trace) {
        return observeTarget(autoCancelPrevious(function replaceTarget(target) {
            if (target == null) {
                return;
            }
            return bindTarget(
                observeSource,
                sourceScope,
                targetScope.nest(target),
                descriptor,
                trace
            );
        }), targetScope);
    };
}

function isActive(target) {
    return (
        target.getRangeChangeDescriptor &&
        target.getRangeChangeDescriptor().isActive
    );
}
