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

var empty = {}; // used for getting properties of falsy objects

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
                return a.length >= b.length &&
                    this.equals(a.slice(0, b.length), b);
            },
            endsWith: function (a, b) {
                return a.length >= b.length &&
                    this.equals(a.slice(a.length - b.length, a.length), b);
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
                return Semantics.compare(a, b) < 0;
            },
            lessThanOrEquals: function (a, b) {
                return Semantics.compare(a, b) <= 0;
            },
            greaterThan: function (a, b) {
                return Semantics.compare(a, b) > 0;
            },
            greaterThanOrEquals: function (a, b) {
                return Semantics.compare(a, b) >= 0;
            },

            // equivalence relations
            equals: function (a, b) {
                if (a == null || b == null) {
                    return a === b;
                } else if (a.equals) {
                    return a.equals(b);
                } else if (b.equals) {
                    return b.equals(a);
                } else {
                    return a === b;
                }
            },
            notEquals: function (a, b) {
                return !this.equals(a, b);
            },

            // logical ('and' and 'or' are evaluators for the short-circuiting)

            xor: function (a, b) {
                return a !== b;
            },

            // collection operators

            contains: function (collection, value) { // pertains to strings
                return collection.indexOf(value) !== -1;
            },
            has: function (collection, value) { // pertains to other collections
                return collection.indexOf(value) !== -1;
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
            get: function (evaluateObject, evaluateKey, parents) {

                // construct remaining path
                var remainingPath = [];
                parents = parents.parents;
                while (parents) {
                    if (parents.syntax.type !== 'get')
                        break;
                    remainingPath.push(parents.syntax.args[1].value);
                    parents = parents.parents;
                }
                if (remainingPath.length === 0) {
                    remainingPath = null;
                } else {
                    remainingPath = remainingPath.join(".");
                }

                return function (value, parameters, visitor) {
                    var object = evaluateObject(value, parameters, visitor);
                    var key = evaluateKey(value, parameters, visitor);
                    var result = (object || empty)[key];
                    if (visitor) {
                        visitor(object, key, result, remainingPath);
                    }
                    return result;
                };
            },

            // logical
            and: function (a, b) {
                return function (value, parameters) {
                    return a(value, parameters) && b(value, parameters);
                };
            },
            or: function (a, b) {
                return function (value, parameters) {
                    return a(value, parameters) || b(value, parameters);
                };
            },

            // ternary conditional
            'if': function (guard, consequent, alternate) {
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

            it: function (a, b) {
                return function (value, parameters) {
                    return b(a(value, parameters), parameters);
                }
            },

            one: function (a, b) {
                return function (value, parameters) {
                    var object = a(value, parameters)[0]; // handle other collections
                    return b(object, parameters);
                };
            },
            only: function (a, b) {
                return function (value, parameters) {
                    var objects = a(value, parameters); // handle other collections
                    if (objects.length !== 1)
                        return false;
                    return b(objects[0], parameters);
                };
            },
            filter: function (a, b) {
                return function (value, parameters) {
                    return a(value, parameters)
                    .filter(function (object) {
                        return b(object, parameters);
                    });
                };
            },
            every: function (a, b) {
                return function (value, parameters) {
                    return a(value, parameters)
                    .every(function (object) {
                        return b(object, parameters);
                    });
                };
            },
            some: function (a, b) {
                return function (value, parameters) {
                    return a(value, parameters)
                    .some(function (object) {
                        return b(object, parameters);
                    });
                };
            },
            map: function (a, b) {
                return function (value, parameters) {
                    return a(value, parameters)
                    .map(function (object) {
                        return b(object, parameters);
                    });
                };
            },

            sorted: function (collection, by, descending) {
                var semantics = this;
                return function (value, parameters) {
                    var order = descending() ? -1 : 1;
                    return collection(value, parameters)
                    .map(function (item) {
                        return {
                            by: by(item, parameters),
                            value: item
                        };
                    })
                    .sort(function (a, b) {
                        return semantics.compare(a.by, b.by) * order;
                    })
                    .map(function (pair) {
                        return pair.value;
                    })
                }
            },

            // reductions
            sum: function (collection, modify) {
                var self = this;
                return function (value, parameters) {
                    var value = self.sum(collection(value, parameters));
                    return modify(value, parameters);
                };
            },
            count: function (collection, modify) {
                var self = this;
                return function (value, parameters) {
                    var value = self.count(collection(value, parameters));
                    return modify(value, parameters);
                };
            },
            average: function (collection, modify) {
                var self = this;
                return function (value, parameters) {
                    var value = self.average(collection(value, parameters));
                    return modify(value, parameters);
                };
            },
            unique: function (collection, modify) {
                var self = this;
                return function (value, parameters) {
                    var value = self.unique(collection(value, parameters));
                    return modify(value, parameters);
                };
            },
            flatten: function (collection, modify) {
                var self = this;
                return function (value, parameters) {
                    var value = self.flatten(collection(value, parameters));
                    return modify(value, parameters);
                };
            }

        }
    },

    compile: {
        value: function (syntax, parents) {
            var self = this;
            var child = {
                syntax: syntax,
                parents: parents
            };
            if (syntax.type === 'array') {
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
    },

    compare: {
        value: function (a, b) {
            if (typeof a !== typeof b)
                return 0;
            if (a === b)
                return 0;
            if (typeof a === "number")
                return a - b;
            if (typeof a === "string")
                return a < b ? -1 : 1;
            if (Array.isArray(a)) {
                if (!Array.isArray(b))
                    return 0;
                var length = Math.min(a.length, b.length);
                for (var i = 0; i < length; i++) {
                    var comparison = this.compare(a[i], b[i]);
                    if (comparison)
                        return comparison;
                }
                return a.length - b.length;
            }
            if (typeof a.compare === "function")
                return a.compare(b);
            if (typeof b.compare === "function")
                return -b.compare(a);
            if (typeof a.lessThan === "function" && typeof a.equals === "function")
                return a.equals(b) ? 0 : a.lessThan(b) ? -1 : 1;
            return 0;
        }
    },

    count: {
        value: function (collection) {
            if (typeof collection.count === "function") {
                return collection.count();
            } else {
                return collection.length;
            }
        }
    },

    sum: {
        value: function (collection) {
            return collection.reduce(function (a, b) {
                return a + b;
            }, 0);
        }
    },

    average: {
        value: function (collection) {
            return this.sum(collection) / this.count(collection);
        }
    },

    unique: {
        value: function (collection) {
            var unique = [];
            collection.forEach(function (value) {
                if (unique.every(function (uniqueValue) {
                    return Semantics.compare(value, uniqueValue) !== 0;
                })) {
                    unique.push(value);
                }
            });
            return unique;
        }
    },

    flatten: {
        value: function (table) {
            return table.reduce(function (flat, row) {
                return flat.concat(row);
            }, [])
        }
    }

});

