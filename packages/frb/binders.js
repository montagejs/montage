
var Observers = require("./observers");
var autoCancelPrevious = Observers.autoCancelPrevious;
var once = Observers.once;

exports.makePropertyBinder = makePropertyBinder;
function makePropertyBinder(observeObject, observeKey) {
    return function (observeValue, source, target, parameters, descriptor, trace) {
        return observeObject(autoCancelPrevious(function (object) {
            return observeKey(autoCancelPrevious(function (key) {
                return observeValue(autoCancelPrevious(function (value) {
                    if (descriptor.isActive) {
                        trace && console.log("IGNORED SET", trace.targetPath, "TO", value, "ON", object, "BECAUSE", trace.sourcePath, "ALREADY ACTIVE");
                        return;
                    }
                    try {
                        descriptor.isActive = true;
                        trace && console.log("SET", trace.targetPath, "TO", value, "ON", object, "BECAUSE", trace.sourcePath);
                        object[key] = value;
                    } finally {
                        descriptor.isActive = false;
                    }
                }), source, parameters, false, descriptor, trace);
            }), target, parameters, false, descriptor, trace);
        }), target, parameters, false, descriptor, trace);
    };
}

exports.makeHasBinder = makeHasBinder;
function makeHasBinder(observeSet, observeValue) {
    return function (observeHas, source, target, parameters, descriptor, trace) {
        return observeSet(autoCancelPrevious(function (set) {
            return observeValue(autoCancelPrevious(function (value) {
                return observeHas(autoCancelPrevious(function (has) {
                    // wait for the initial value to be updated by the
                    // other-way binding
                    if (has) { // should be in set
                        if (!(set.has || set.contains).call(set, value)) {
                            trace && console.log("ADD", value, "TO", trace.targetPath, "BECAUSE", trace.sourcePath);
                            set.add(value);
                        }
                    } else { // should not be in set
                        while ((set.has || set.contains).call(set, value)) {
                            trace && console.log("REMOVE", value, "FROM", trace.targetPath, "BECAUSE", trace.sourcePath);
                            (set.remove || set['delete']).call(set, value);
                        }
                    }
                }), target, parameters, false, descriptor, trace);
            }), source, parameters, false, descriptor, trace);
        }), source, parameters, false, descriptor, trace);
    };
}

exports.makeEqualityBinder = makeEqualityBinder;
function makeEqualityBinder(bindLeft, observeRight) {
    return function (observeEquals, source, target, parameters, descriptor, trace) {
        return observeEquals(autoCancelPrevious(function (equals) {
            if (equals) {
                trace && console.log("BIND", trace.targetPath, "TO", trace.sourcePath);
                var cancel = bindLeft(observeRight, source, source, parameters, descriptor, trace);
                return function () {
                    trace && console.log("UNBIND", trace.targetPath, "FROM", trace.sourcePath);
                };
            }
        }), target, parameters, false, descriptor, trace);
    };
}

exports.makeContentBinder = makeContentBinder;
function makeContentBinder(observeTarget) {
    return function (observeSource, source, target, parameters, descriptor, trace) {
        return observeTarget(Observers.autoCancelPrevious(function (target) {
            return observeSource(Observers.autoCancelPrevious(function (source) {
                function rangeChange(plus, minus, index) {
                    if (isActive(target))
                        return;
                    if (trace) {
                        console.log("SWAPPING", minus, "FOR", plus, "AT", index);
                    }
                    if (target.swap) {
                        target.swap(index, minus.length, plus);
                    } else if (target.add && (target.remove || target["delete"])) {
                        plus.forEach(target.add, target);
                        minus.forEach(target.remove || target["delete"], target);
                    }
                }
                source.addRangeChangeListener(rangeChange);
                rangeChange(Array.from(source), Array.from(target), 0);
                return once(function () {
                    source.removeRangeChangeListener(rangeChange);
                });
            }), source, parameters, false, descriptor, trace);
        }), target, parameters, false, descriptor, trace);
    };
}

exports.makeReversedBinder = makeReversedBinder;
function makeReversedBinder(observeTarget) {
    return function (observeSource, source, target, parameters, descriptor, trace) {
        return observeTarget(Observers.autoCancelPrevious(function (target) {
            return observeSource(Observers.autoCancelPrevious(function (source) {
                function rangeChange(plus, minus, index) {
                    if (isActive(target))
                        return;
                    var reflected = target.length - index - minus.length;
                    target.swap(reflected, minus.length, plus.reversed());
                }
                source.addRangeChangeListener(rangeChange);
                rangeChange(source, target, 0);
                return once(function () {
                    source.removeRangeChangeListener(rangeChange);
                });
            }), source, parameters, false, descriptor, trace);
        }), target, parameters, false, descriptor, trace);
    };
}

function isActive(target) {
    return (
        target.getRangeChangeDescriptor &&
        target.getRangeChangeDescriptor().isActive
    );
}

