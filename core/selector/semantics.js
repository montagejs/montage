/* <copyright>
Copyright (c) 2012, Motorola Mobility LLC.
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of Motorola Mobility LLC nor the names of its
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */

var AbstractSemantics = require("./abstract-semantics").AbstractSemantics;

var Semantics = exports.Semantics = AbstractSemantics.create(AbstractSemantics, {

    operators: {
        value: {

            // from highest to lowest precedence

            // properties
            getProperty: function (object, name) {
                return object[name];
            },

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
                    var result = collection(value, parameters);
                    if (result == null) { // iff null or undefined
                        return result;
                    }
                    return result.sorted(Object.compare, function (item) {
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
            var result = collection(value, parameters, visitor);
            if (result == null) { // iff null or undefined
                return result;
            }
            return result[name](function (object) {
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
            var result = collection(value, parameters, visitor);
            if (result == null) { // iff null or undefined
                return result;
            }
            return modify(result[name](), parameters);
        };
    };
}

