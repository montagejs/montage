/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

var Montage = require("core/core").Montage;
var Semantics = require("./semantics").Semantics;

var ObserverSemantics = exports.ObserverSemantics = Montage.create(Montage, {

    // Each property name in the `operators` and `compilers` section
    // corresponds to the `type` property of a node in the syntax tree.
    // An operator is a shorthand for an compiler, in the cases where all of
    // the operands must be observed unconditionally and starting with the
    // same value.
    // For example, `if`, `and`, and `or` cannot be modeled as operators
    // because they conditionally observe their latter terms.
    // `map`, `filter`, and their ilk observe their second argument with one
    // value from the first, so they are also not modeled as operators.

    compilers: {
        value: {

            // properties
            get: function (observeObject, observeKey) {

                return function (value, parameters, callback, errback) {
                    return observeKey(
                        value,
                        parameters,
                        function keyChange(key) {
                            return observeObject(
                                value,
                                parameters,
                                function objectChange(object) {
                                    object = object || Object.empty;

                                    var _cancel;

                                    var onchange = function () {
                                        var result;
                                        if (typeof object.get === "function") {
                                            result = object.get(key);
                                        } else {
                                            result = object[key];
                                        }
                                        if (_cancel) {
                                            _cancel();
                                        }
                                        _cancel = callback(result);
                                    };

                                    onchange();

                                    object.addPropertyChangeListener(key, onchange);

                                    return function cancel() {
                                        if (_cancel) {
                                            _cancel();
                                        }
                                        object.removePropertyChangeListener(key, onchange);
                                    };

                                },
                                errback
                            );
                        },
                        errback
                    );

                };
            },

            "if": function (observeGuard, observeConsequent, observeAlternate) {
                return function (value, parameters, callback, errback) {
                    return observeGuard(value, parameters, function (guard) {
                        if (guard === true) {
                            return observeConsequent(value, parameters, callback, errback);
                        } else if (guard === false) {
                            return observeAlternate(value, parameters, callback, errback);
                        } else {
                            errback(new Error("Expected true or false"));
                        }
                    }, errback);
                };
            },

            it: function (observeIt, observeTransform) {
                return function (value, parameters, callback, errback) {
                    return observeIt(
                        value,
                        parameters,
                        function (it) {
                            return observeTransform(
                                it,
                                parameters,
                                callback,
                                errback
                            );
                        },
                        errback
                    );
                };
            },

            one: makeNoArgumentsMethodCompiler('one'),
            only: makeNoArgumentsMethodCompiler('only'),

            map: makeReductionCompiler(
                function (collection, item, index) {
                    collection[index] = item;
                    return collection;
                },
                function makeBasis(length) {
                    return Array(length);
                }
            ),

            filter: makeReductionCompiler(
                function (collection, guard, index, item) {
                    if (guard) {
                        collection.push(item);
                    }
                    return collection;
                },
                function () {
                    return [];
                }
            ),

            every: makeReductionCompiler(
                function (result, guard) {
                    return result && guard;
                },
                function makeBasis() {
                    return true;
                }
            ),

            some: makeReductionCompiler(
                function (result, guard) {
                    return result || guard;
                },
                function makeBasis() {
                    return false;
                }
            ),

            // TODO sorted

            sum: makeNoArgumentsMethodCompiler('sum'),
            count: makeNoArgumentsMethodCompiler('count'),
            any: makeNoArgumentsMethodCompiler('any'),
            all: makeNoArgumentsMethodCompiler('all'),
            average: makeNoArgumentsMethodCompiler('average'),
            unique: makeNoArgumentsMethodCompiler('unique'),
            flatten: makeNoArgumentsMethodCompiler('flatten')

        }
    },

    compile: {
        value: function (syntax, parent) {
            // TODO put a weak map memo of syntax to evaluator here to speed up common property compilation
            var self = this;
            if (syntax.type === 'value') {
                return function (value, parameters, callback) {
                    return callback(value);
                };
            } else if (syntax.type === 'parameters') {
                return function (value, parameters, callback) {
                    return callback(parameters);
                };
            } else if (syntax.type === 'literal') {
                return function (value, parameters, callback) {
                    return callback(syntax.value);
                };
            } else if (syntax.type === 'array') {
                var termEvaluators = syntax.terms.map(function (term) {
                    return self.compile(term, syntax);
                });
                return makeFixedLengthArrayObserver(termEvaluators);
            } else if (self.compilers[syntax.type]) {
                var compiler = self.compilers[syntax.type];
                var length = compiler.length;
                var argEvaluators = syntax.args.map(function (child) {
                    return self.compile(child, syntax);
                });

                // song and dance to make case insensitive comparisons work by
                // converting all argEvaluators into lower-case argEvaluators.
                if (syntax.insensitive) {
                    argEvaluators = argEvaluators.map(function (observeArg) {
                        return function (value, parameters, callback, errback) {
                            var subcancel;
                            var cancel = observeArg.call(
                                self,
                                value,
                                parameters,
                                function _callback(value) {
                                    if (subcancel) {
                                        subcancel();
                                    }
                                    subcancel = callback(value.toLowerCase());
                                },
                                function _errback(exception) {
                                    if (subcancel) {
                                        subcancel();
                                    }
                                    subcancel = errback(exception);
                                }
                            );
                            return function () {
                                if (subcancel) {
                                    subcancel();
                                }
                                if (cancel) {
                                    cancel();
                                }
                            };
                        };
                    })
                }

                // song and dance so callbacks can return new cancelation
                // functions, and so canceled observers can no longer propagate
                // through the callback
                var _observe = compiler.apply(self, argEvaluators);
                return function observe(value, parameters, callback, errback) {
                    var _subcancel, canceled;
                    var _callback = function (value) {
                        if (canceled) {
                            return;
                        }
                        subcancel();
                        if (callback) {
                            _subcancel = callback(value);
                        } else {
                            _subcancel = void 0;
                        }
                    };
                    var _errback = function (exception) {
                        if (canceled) {
                            return;
                        }
                        subcancel();
                        if (errback) {
                            _subcancel = errback(exception);
                        } else {
                            _subcancel = void 0;
                        }
                    };
                    var subcancel = function () {
                        if (_subcancel) {
                            _subcancel();
                        }
                    };
                    var cancel = function () {
                        if (canceled) {
                            return;
                        }
                        canceled = true; // XXX this will mask errors in unregistering events
                        subcancel();
                        if (_cancel) {
                            _cancel();
                        }
                    };
                    var _cancel = _observe(value, parameters, _callback, _errback);
                    return cancel;
                };

            } else {
                throw new Error("Can't compile: " + syntax.type);
            }
        }
    },

});

// make compilers for every operator in the language's semantics
var compilers = ObserverSemantics.compilers;
var operators = Semantics.operators;
Object.keys(operators).forEach(function (name) {
    var operator = operators[name];
    compilers[name] = makeOperatorCompiler(operator);
});

function makeOperatorCompiler(operator) {
    return function () {
        var argumentObservers = Array.prototype.slice.call(arguments, 0, operator.length);
        var observeArguments = makeFixedLengthArrayObserver(argumentObservers);
        return function (value, parameters, callback, errback) {
            return observeArguments(
                value,
                parameters,
                function (args) {
                    return callback(operator.apply(Semantics, args));
                },
                errback
            );
        };
    };
}

// used to generate compilers for functions that take no arguments, like
// 'sum', 'count', 'any', 'all'
function makeNoArgumentsMethodCompiler(name) {
    return function (observeCollection, observeContinuation) {
        return function (value, parameters, callback, errback) {
            return observeCollection(
                value,
                parameters,
                function (collection) {

                    var _subcancel;
                    var subcancel = function () {
                        if (_subcancel) {
                            _subcancel();
                        }
                    };

                    var onchange = function () {
                        subcancel();
                        try {
                            _subcancel = observeContinuation(
                                collection[name](),
                                parameters,
                                callback,
                                errback
                            );
                        } catch (exception) {
                            _subcancel = errback(exception);
                        }
                    };

                    collection.addPropertyChangeListener(null, onchange);

                    onchange();

                    return function cancel() {
                        subcancel();
                        collection.removePropertyChangeListener(null, onchange);
                    };
                },
                errback
            );
        };
    };
}

function makeReductionCompiler(operation, makeBasis) {
    return function (observeCollection, observeTranslation) {
        return function (value, parameters, callback, errback) {
            return observeCollection(
                value,
                parameters,
                function (collection) {
                    var subcancel;

                    var onchange = function (event) {
                        if (subcancel) {
                            subcancel();
                        }

                        var count = collection.length;
                        var basis = makeBasis(count);
                        var cancelers = [];

                        subcancel = function () {
                            if (cancelers) {
                                cancelers.forEach(function (cancel) {
                                    if (cancel) {
                                        cancel();
                                    }
                                });
                            }
                        };

                        collection.forEach(function (item, index) {
                            cancelers.push(observeTranslation(
                                item,
                                parameters,
                                function (mappedItem) {
                                    if (count >= 0) {
                                        basis = operation(basis, mappedItem, index, item);
                                        count--;
                                    }
                                    if (count === 0) {
                                        callback(basis);
                                    } else if (count < 0) {
                                        // changes to the content of the array
                                        onchange();
                                    }
                                },
                                errback
                            ));
                        });
                    };

                    // changes to the shape of the array
                    collection.addPropertyChangeListener(null, onchange);

                    onchange();

                    return function cancel() {
                        if (subcancel) {
                            subcancel();
                            subcancel = void 0;
                        }
                        collection.removePropertyChangeListener(null, onchange);
                    };

                },
                errback
            );
        };
    };
};

function makeFixedLengthArrayObserver(observers) {
    var array = new Array(observers.length);
    var observer = makeIncrementalFixedLengthArrayObserver(observers);
    return function (value, parameters, callback, errback) {
        return observer(value, parameters, function () {
            callback(array);
        }, errback, function (item, index) {
            array[index] = item;
        });
    };
}

function makeIncrementalFixedLengthArrayObserver(observers) {
    return function (value, parameters, callback, errback, itemback) {
        var canceled = false;
        var cancelers = [];
        var _callback = function () {
            if (canceled) {
                return;
            }
            callback();
        };
        var _errback = function (exception) {
            if (canceled) {
                return;
            }
            cancel();
            errback(exception);
        };
        var cancel = function () {
            cancelers.forEach(function (cancel) {
                if (cancel) {
                    cancel();
                }
            });
            canceled = true;
        };
        var count = observers.length;
        observers.forEach(function (observe, index) {
            cancelers.push(observe(value, parameters, function onchange(item) {
                if (itemback) {
                    itemback(item, index);
                }
                count--;
                if (count <= 0) {
                    _callback();
                }
            }, _errback));
        });
        return cancel;
    };
}

