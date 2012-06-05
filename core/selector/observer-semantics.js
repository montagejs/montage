/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

var Montage = require("core/core").Montage;
var Promise = require("core/promise").Promise;
var WeakMap = require("core/shim/weak-map").WeakMap;
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
            getProperty: function (observeObject, observeKey) {

                return function (value, callback, errback, parameters) {
                    return observeKey(
                        value,
                        function keyChange(key) {
                            return observeObject(
                                value,
                                function objectChange(object) {

                                    var _cancel;

                                    var onchange = function () {
                                        if (_cancel) {
                                            _cancel();
                                        }
                                        _cancel = callback(object[key]);
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
                                errback,
                                parameters
                            );
                        },
                        errback,
                        parameters
                    );

                };
            },

            "if": function (observeGuard, observeConsequent, observeAlternate) {
                return function (value, callback, errback, parameters) {
                    return observeGuard(value, function (guard) {
                        if (guard === true) {
                            return observeConsequent(value, callback, errback, parameters);
                        } else if (guard === false) {
                            return observeAlternate(value, callback, errback, parameters);
                        } else {
                            errback(new Error("Expected true or false"));
                        }
                    }, errback, parameters);
                };
            },

            it: function (observeIt, observeTransform) {
                return function (value, callback, errback, parameters) {
                    return observeIt(
                        value,
                        function (it) {
                            return observeTransform(
                                it,
                                callback,
                                errback,
                                parameters
                            );
                        },
                        errback,
                        parameters
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

    memo: {
        value: new WeakMap()
    },

    compile: {
        value: function (syntax) {
            if (!this.memo.has(syntax)) {
                this.memo.set(syntax, this.memoizedCompile(syntax));
            }
            return this.memo.get(syntax);
        }
    },

    memoizedCompile: {
        value: function (syntax) {
            var self = this;
            var observe;
            if (syntax.type === 'value') {
                observe = function (value, callback) {
                    return callback(value);
                };
            } else if (syntax.type === 'parameters') {
                observe = function (value, callback, errback, parameters) {
                    return callback(parameters);
                };
            } else if (syntax.type === 'literal') {
                observe = function (value, callback) {
                    return callback(syntax.value);
                };
            } else if (syntax.type === 'array') {
                var termEvaluators = syntax.terms.map(function (term) {
                    return self.compile(term, syntax);
                });
                observe = makeFixedLengthArrayObserver(termEvaluators);
            } else if (Object.has(self.compilers, syntax.type)) {
                var compiler = Object.get(self.compilers, syntax.type);
                var length = compiler.length;
                var argEvaluators = syntax.args.map(function (child) {
                    return self.compile(child, syntax);
                });

                // song and dance to make case insensitive comparisons work by
                // converting all argEvaluators into lower-case argEvaluators.
                if (syntax.insensitive) {
                    argEvaluators = argEvaluators.map(function (observeArg) {
                        return function (value, callback, errback, parameters) {
                            var subcancel;
                            var cancel = observeArg.call(
                                self,
                                value,
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
                                },
                                parameters
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
                observe = function observe(value, callback, errback, parameters) {
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
                    var _cancel = _observe(value, _callback, _errback, parameters);
                    return cancel;
                };

            } else {
                throw new Error("Can't compile: " + syntax.type);
            }

            // dance to make sure that an observed promise does not get
            // observed until fulfilled
            return function (value, callback, errback, parameters) {
                return observe(value, function (value) {
                    if (Promise.isPromise(value)) {
                        value.then(callback, errback).end();
                    } else {
                        return callback(value);
                    }
                }, errback, parameters);
            };
        }
    },

});

// make compilers for every operator in the language's semantics
var compilers = ObserverSemantics.compilers;
var operators = Semantics.operators;
Object.forEach(operators, function (operator, name) {
    if (!Object.has(compilers, name)) {
        compilers[name] = makeOperatorCompiler(operator);
    }
});

function makeOperatorCompiler(operator) {
    return function () {
        var argumentObservers = Array.prototype.slice.call(arguments, 0, operator.length);
        var observeArguments = makeFixedLengthArrayObserver(argumentObservers);
        return function (value, callback, errback, parameters) {
            return observeArguments(
                value,
                function (args) {
                    return callback(operator.apply(Semantics, args));
                },
                errback,
                parameters
            );
        };
    };
}

// used to generate compilers for functions that take no arguments, like
// 'sum', 'count', 'any', 'all'
function makeNoArgumentsMethodCompiler(name) {
    return function (observeCollection, observeContinuation) {
        return function (value, callback, errback, parameters) {
            return observeCollection(
                value,
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
                                callback,
                                errback,
                                parameters
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
                errback,
                parameters
            );
        };
    };
}

function makeReductionCompiler(operation, makeBasis) {
    return function (observeCollection, observeTranslation) {
        return function (value, callback, errback, parameters) {
            return observeCollection(
                value,
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
                                errback,
                                parameters
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
                errback,
                parameters
            );
        };
    };
};

function makeFixedLengthArrayObserver(observers) {
    var array = new Array(observers.length);
    var observer = makeIncrementalFixedLengthArrayObserver(observers);
    return function (value, callback, errback, parameters) {
        return observer(
            value,
            function _callback() {
                callback(array);
            },
            errback,
            function _itemback(item, index) {
                array[index] = item;
            },
            parameters
        );
    };
}

function makeIncrementalFixedLengthArrayObserver(observers) {
    return function (value, callback, errback, itemback, parameters) {
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
            cancelers.push(observe(value, function onchange(item) {
                if (itemback) {
                    itemback(item, index);
                }
                count--;
                if (count <= 0) {
                    _callback();
                }
            }, _errback, parameters));
        });
        return cancel;
    };
}

