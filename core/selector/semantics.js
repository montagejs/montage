/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

var AbstractSemantics = require("./abstract-semantics").AbstractSemantics;

var Semantics = exports.Semantics = AbstractSemantics.create(AbstractSemantics, {

    operators: {
        value: {

            // from highest to lowest precedence

            // unary
            not: function (a) {
                return !a;
            },

            // function calls
            startsWith: function (a, b) {
                return a.startsWith(b);
            },
            endsWith: function (a, b) {
                return a.endsWith(b);
            },

            // algebra

            // exponential
            pow: function (a, b) {
                return Math.pow(a, b);
            },

            // multiplicative
            mul: function (a, b) {
                return a * b;
            },
            div: function (a, b) {
                return a / b;
            },
            mod: function (a, b) {
                return a % b;
            },

            // arithmetic
            add: function (a, b) {
                return a + b;
            },
            sub: function (a, b) {
                return a - b;
            },

            // transitive relations
            lessThan: function (a, b) {
                return Object.compare(a, b) < 0;
            },
            lessThanOrEquals: function (a, b) {
                return Object.compare(a, b) <= 0;
            },
            greaterThan: function (a, b) {
                return Object.compare(a, b) > 0;
            },
            greaterThanOrEquals: function (a, b) {
                return Object.compare(a, b) >= 0;
            },

            // equivalence relations
            equals: Object.equals,
            notEquals: function (a, b) {
                return !Object.equals(a, b);
            },

            // logical

            and: function (a, b) {
                return a && b;
            },
            or: function (a, b) {
                return a || b;
            },
            // retained as distinct from notEqual because of a different
            // type signature and level of precedence.  the type is not
            // important for JavaScript in memory, but is distinguished
            // for data-layer queries.
            xor: function (a, b) {
                return a !== b;
            },

            // collection operators

            contains: function (collection, string) {
                return collection.contains(string);
            },
            has: function (collection, value) {
                return collection.has(value);
            },

            slice: function (collection, start, stop) {
                return collection.slice(start, stop);
            },
            // TODO rewrite to accept length then from value
            sliceFrom: function (collection, value, length) {
                var start = collection.indexOf(value);
                if (start !== -1) {
                    length = Math.min(collection.length - start, length);
                    return collection.slice(start, start + length);
                } else {
                    return [];
                }
            }

        }
    },

    evaluators: {
        value: {

            // properties
            get: function (evaluateObject, evaluateKey) {

                return function (value, parameters) {
                    var object = evaluateObject(value, parameters);
                    var key = evaluateKey(value, parameters);
                    return Object.get(object, key);
                };
            },

            // ternary conditional
            "if": function (guard, consequent, alternate) {
                return function (value, parameters) {
                    var flag = guard(value, parameters);
                    if (flag === true) {
                        return consequent(value, parameters);
                    } else if (flag === false) {
                        return alternate(value, parameters);
                    } else {
                        throw new Error("Expected true or false, got: " + JSON.stringify(flag));
                    }
                };
            },

            it: function (it, modify) {
                return function (value, parameters) {
                    return modify(it(value, parameters), parameters);
                };
            },

            one: makeNoArgumentsMethodCompiler("one"),
            only: makeNoArgumentsMethodCompiler("only"),

            map: makeReductionCompiler("map"),
            filter: makeReductionCompiler("filter"),
            every: makeReductionCompiler("every"),
            some: makeReductionCompiler("some"),

            sorted: function (collection, by, descending) {
                return function (value, parameters) {
                    return collection(value, parameters)
                    .sorted(Object.compare, function (item) {
                        return by(item, parameters);
                    }, descending() ? -1 : 1);
                };
            },

            sum: makeNoArgumentsMethodCompiler("sum"),
            count: makeNoArgumentsMethodCompiler("count"),
            any: makeNoArgumentsMethodCompiler("any"),
            all: makeNoArgumentsMethodCompiler("all"),
            average: makeNoArgumentsMethodCompiler("average"),
            min: makeNoArgumentsMethodCompiler("min"),
            max: makeNoArgumentsMethodCompiler("max"),
            unique: makeNoArgumentsMethodCompiler("unique"),
            flatten: makeNoArgumentsMethodCompiler("flatten")

        }
    },

    compile: {
        value: function (syntax, parents) {
            var self = this;
            var child = {
                syntax: syntax,
                parents: parents
            };
            if (syntax.type === "array") {
                var terms = syntax.terms.map(function (term) {
                    return self.compile(term, child);
                });
                return function (value, parameters) {
                    return terms.map(function (term) {
                        return term(value, parameters);
                    });
                };
            } else {
                return AbstractSemantics.compile.call(self, syntax, parents);
            }
        }
    }

});

// used to generate evaluators that iterate through a collection
// applying some predicate, like "map", "filter", "every", "some"
function makeReductionCompiler(name) {
    return function (collection, relation) {
        return function (value, parameters, visitor) {
            return collection(value, parameters, visitor)
            [name](function (object) {
                return relation(object, parameters, visitor);
            });
        };
    };
}

// used to generate evaluators for functions that take no arguments, like
// "sum", "count", "any", "all"
function makeNoArgumentsMethodCompiler(name) {
    return function (collection, modify) {
        var self = this;
        return function (value, parameters, visitor) {
            return modify(
                collection(value, parameters, visitor)[name](),
                parameters
            );
        };
    };
}

