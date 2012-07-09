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

var Selector = require("montage/core/selector").Selector;

var assert = function (actual, expected) {
    expect(actual).toEqual(expected);
};

describe('core/selector-spec', function () {

    describe('parsing:', function () {

        describe('scalar:', function () {

            it('creates literals from function calls', function () {
                assert(Selector(10).syntax, {type: 'literal', value: 10});
            });

            it('creates literals from constants', function () {
                assert(Selector.true.syntax, {type: 'literal', value: true});
                assert(Selector.false.syntax, {type: 'literal', value: false});
            });

            it('parses degenerate syntax with implied value term', function () {
                assert(Selector.syntax, {type: 'value'})
            });

            it('parses degenerate parentheticals with implied value term', function () {
                assert(Selector.begin.end.syntax, {type: 'value'})
            });

            it('parses explicit subject term', function () {
                assert(Selector.value.syntax, {type: 'value'});
            });

            it('parses comparison to constant with implied subject', function () {
                assert(Selector.equals.true.syntax, {
                    type: 'equals',
                    args: [
                        {type: 'value'},
                        {type: 'literal', value: true}
                    ]
                });
                assert(Selector.true.or.syntax, {
                    type: 'or',
                    args: [
                        {type: 'literal', value: true},
                        {type: 'value'}
                    ]
                });
            });

            it('parses negation of explicit subject, as distinct from negation of operator', function () {
                assert(Selector.not.value.syntax, {
                    type: 'not',
                    args: [{type: 'value'}]
                });
            });

            //// TODO MAYBE
            //it('parses mere negation of implied subject', function () {
            //    assert(Selector.not.syntax, {
            //        type: 'not',
            //        args: [{type: 'value'}]
            //    });
            //});

            it('parses negation of constant', function () {
                assert(Selector.not.true.syntax, {
                    type: 'not',
                    args: [{type: 'literal', value: true}]
                })
            });

            it('parses logical combination of given parameters', function () {
                assert(Selector.parameter('a').and.parameter('b').syntax, {
                    "type": "and",
                    "args": [
                        {
                            "type": "get",
                            "args": [
                                {
                                    "type": "parameters",
                                },
                                {
                                    "type": "literal",
                                    "value": "a"
                                }
                            ]
                        },
                        {
                            "type": "get",
                            "args": [
                                {
                                    "type": "parameters",
                                },
                                {
                                    "type": "literal",
                                    "value": "b"
                                }
                            ]
                        },

                    ]
                });
            });

            it('has left to right associativity with literals as leaves', function () {
                assert(Selector(1).and(2).and(3).syntax, {
                    type: 'and',
                    args: [
                        {
                            type: 'and',
                            args: [
                                {type: 'literal', value: 1},
                                {type: 'literal', value: 2}
                            ]
                        },
                        {type: 'literal', value: 3}
                    ]
                });

            });

            it('supports precedence of logical operators', function () {
                assert(Selector(true).and(false).or(true).and(false).syntax, {
                    type: 'or',
                    args: [
                        {
                            type: 'and',
                            args: [
                                {type: 'literal', value: true},
                                {type: 'literal', value: false}
                            ]
                        },
                        {
                            type: 'and',
                            args: [
                                {type: 'literal', value: true},
                                {type: 'literal', value: false}
                            ]
                        }
                    ]
                });
            });

            it("supports single literal", function () {
                assert(
                    Selector(10).syntax,
                    {type: 'literal', value: 10}
                );
            });

            it("supports single operator", function () {
                assert(
                    Selector.and.syntax,
                    {
                        type: 'and',
                        args: [
                            {type: 'value'},
                            {type: 'value'}
                        ]
                    }
                );
            });

            it("supports combination of properties and operators", function () {
                assert(
                    Selector.property('a.b').equals('c').syntax,
                    {
                        type: 'equals',
                        args: [
                            {
                                type: 'get',
                                args: [
                                    {
                                        type: 'get',
                                        args: [
                                            {type: 'value'},
                                            {type: 'literal', value: 'a'}
                                        ]
                                    },
                                    {type: 'literal', value: 'b'}
                                ]
                            },
                            {type: 'literal', value: 'c'}
                        ]
                    }
                );
            });

            it("supports insensitive modifier on equals operator", function () {
                assert(Selector.insensitive.equals("Charles Babbage").syntax, {
                    type: 'equals',
                    insensitive: true,
                    args: [
                        {type: 'value'},
                        {type: 'literal', value: 'Charles Babbage'}
                    ]
                });
            });

        });

        describe("linear:", function () {

            it("supports syntax for evaluation of every element in collection", function () {
                assert(Selector.some.every.equals(10).syntax, {
                    type: "some",
                    args: [
                        {type: "value"},
                        {
                            type: "every",
                            args: [
                                {type: "value"},
                                {
                                    type: "equals",
                                    args: [
                                        {type: "value"},
                                        {
                                            type: "literal",
                                            value: 10
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                });
            });

        });

    });

    describe('evaluation:', function () {

        describe("scalar:", function () {

            it('evaluates degenerate implied subject', function () {
                assert(Selector.evaluate(), undefined)
                assert(Selector.evaluate(10), 10);
            });

            it('evaluates degenerate generated constant', function () {
                assert(Selector(10).evaluate(), 10)
            });

            it("evaluates built in constants", function () {
                assert(Selector.true.evaluate(), true);
                assert(Selector.false.evaluate(), false);
                assert(Selector.true.or.false.evaluate(), true);
            });

            it("evaluates built in constants with provided constants", function () {
                assert(Selector.true.or(false).evaluate(), true);
                assert(Selector.true.or(false).evaluate(), true);
                assert(Selector.false.or(false).evaluate(), false);
            });

            it("evaluates negated constants", function () {
                assert(Selector.not.false.evaluate(), true);
            });

            it("evaluates comparison of constants", function () {
                assert(Selector.true.equals(true).evaluate(), true);
            });

            it("evaluates comparison of implied subject to constant", function () {
                assert(Selector.equals(10).evaluate(10), true);
            });

            it("evaluates comparison of implied subject to constant", function () {
                assert(Selector.not.equals(10).evaluate(10), false);
            });


            it("evaluates comparison of implied subject to constant", function () {
                assert(Selector.lessThan(10).evaluate(20), false);
            });

            it("evaluates comparison of implied subject to constant", function () {
                assert(Selector.true.or.evaluate(), true);
            });

            it("evaluates comparison of implied subject to parameter", function () {
                assert(Selector.equals.parameter('a').evaluate(10, {a: 10}), true);
            });

            it("evaluates property of implied subject", function () {
                assert(Selector.property("foo").evaluate({foo: 10}), 10);
            });

            it("evaluates comparison of property of implied subject", function () {
                assert(Selector.property("foo").equals("foo").evaluate({"foo": "foo"}), true);
            });

            it("evaluates explicitly nested properties", function () {
                assert(Selector.property("a").property("b").evaluate({a:{b:10}}), 10);
            });

            it("evaluates nested property path", function () {
                assert(Selector.property("a.b").evaluate({a:{b:10}}), 10);
            });

            it("compares property or value of implied subject", function () {
                assert(Selector.property("foo").equals("foo").or.equals("bar").evaluate("bar"), true);
                assert(Selector.property("foo").equals("foo").or.equals("bar").evaluate({foo: "foo"}), true);
            });

            it("compares strings with case-insensitivity", function () {
                assert(Selector.insensitive.equals("Charles Babbage").evaluate("charles babbage"), true);
                assert(Selector.insensitive.startsWith("charles").evaluate("Charles Babbage"), true);
                assert(Selector.insensitive.endsWith("babbage").evaluate("Charles Babbage"), true);
            });

            describe("conditional expressions:", function () {

                it("where the guard is the implicit subject value", function () {
                    assert(Selector.if.then(1).else(2).evaluate(true), 1);
                    assert(Selector.if.then(1).else(2).evaluate(false), 2);
                });

                it("where the guard is a parameter", function () {
                    assert(Selector.if.parameter('a').then('a').else('b').evaluate(null, {a:true}), 'a');
                });

                it("where all values are parameters", function () {
                    assert(
                        Selector.if
                            .parameter('guard')
                            .then.parameter('consequent')
                            .else.parameter('alternate')
                        .evaluate(null, {
                            guard: false,
                            consequent: 'consequent',
                            alternate: 'alternate'
                        }),
                        'alternate'
                    );
                });

            });

        });

        describe("linear:", function () {

            it("works for map", function () {
                assert(Selector.map.not.value.evaluate([false, false]), [true, true]);
            });

            it("works for filter", function () {
                assert(Selector.filter.equals(10).evaluate([1,2,3,4,5,10]), [10]);
            });

            it("works for every", function () {
                assert(Selector.every.equals(10).evaluate([10, 20]), false);
                assert(Selector.every.equals(10).evaluate([10, 10]), true);
            });

            it("works for only", function () {
                assert(Selector.only.equals(10).evaluate([10]), true);
                assert(Selector.only.equals(10).evaluate([10, 20]), false);
                assert(Selector.only.equals(10).evaluate([20]), false);
                assert(Selector.only.equals(10).evaluate([]), false);
            });

            it("works for only with property", function () {
                assert(Selector.only.property('name').equals('Charles Babbage').evaluate([
                    {name: 'Charles Babbage'}
                ]), true);
            });

            describe("with various demorgan combinations of some/every not? equals", function () {
                assert(Selector.some.notEquals(10).evaluate([10, 20]), true);
                assert(Selector.not.every.equals(10).evaluate([10, 20]), true);
                assert(Selector.some.not.equals(10).evaluate([10, 10]), false);
                assert(Selector.some.not.equals(10).evaluate([]), false);
                assert(Selector.some.not.equals(10).evaluate([20]), true);
            });

            it("computes sums", function () {
                assert(Selector.sum.evaluate([1,2,3]), 6);
            });

            it("computes counts", function () {
                assert(Selector.count.evaluate([1,2,3]), 3);
            });

            it("count and algebra compose", function () {
                assert(Selector.count.add(1).evaluate([1,2,3]), 4);
            });

            it("computes sum of filtered array", function () {
                var input = [1,2,3,4,5,6,7];
                var output = input.filter(function (n) {
                    return n % 2 === 1;
                }).reduce(function (a, b) {
                    return a + b;
                }, 0);
                var selector = Selector.filter.mod(2).equals(1).sum;
                assert(selector.evaluate(input), output);
            });

        });

        describe("planar:", function () {

            it("evaluates comparison of nested arrays", function () {
                assert(Selector.some.every.equals(10).evaluate([
                    [20, 20, 20],
                    [10, 10, 10]
                ]), true)
            });

        });

    });

    describe("cases:", function () {

        describe("value equals literal", function () {

            var selector = Selector.equals(10);

            it("has proper tokens", function () {
                assert(selector.tokens, [
                   {type: 'equals'},
                   {type: 'literal', value: 10}
                ]);
            });

            it("has proper syntax", function () {
                assert(selector.syntax, {
                    type: 'equals',
                    args: [
                        {type: 'value'},
                        {type: 'literal', value: 10}
                    ]
                });
            });

            it("has evaluates properly", function () {
                assert(selector.evaluate(10), true);
                assert(selector.evaluate(20), false);
            });

        });

        describe("algebraic operator precedence:", function () {

            it("add precedes map", function () {
                assert(Selector.map.add(1).evaluate([1,2,3]), [2,3,4]);
            });

            it("mul precedes add", function () {
                assert(Selector(2).mul(3).add(4).mul(5).evaluate(), 26);
            });

        });

        describe("implied value term:", function () {

            it("is implied on both sides of an operator", function () {
                assert(Selector.mul.evaluate(2), 4);
                assert(Selector.mul.mul.evaluate(2), 8);
            });

        });

        describe("slice", function () {
            var selector = Selector([0,1,2,3]).slice(0, 2);
            it("produces proper syntax", function () {
                assert(selector.syntax, {
                    type: 'slice',
                    args: [
                        {type: 'literal', value: [0,1,2,3]},
                        {type: 'literal', value: 0},
                        {type: 'literal', value: 2}
                    ]
                });
            })
            it("produces proper value", function () {
                assert(selector.evaluate(), [0,1]);
            });
        })

        describe("slice.from", function () {
            var selector = Selector([0,1,2,3]).slice.from(1, 2);
            it("produces proper syntax", function () {
                assert(selector.syntax, {
                    type: 'sliceFrom',
                    args: [
                        {type: 'literal', value: [0,1,2,3]},
                        {type: 'literal', value: 1},
                        {type: 'literal', value: 2}
                    ]
                });
            })
            it("produces proper value", function () {
                assert(selector.evaluate(), [1, 2]);
            });
        });

        describe("sorting", function () {

            var selector = Selector([0,2,1,0,3]).sorted;
            it("produces proper value", function () {
                assert(selector.evaluate(), [0, 0, 1, 2, 3]);
            });

            describe("by", function () {
                var selector = Selector.sorted.by.property("age");
                it("produces proper value", function () {
                    assert(selector.evaluate([
                        {age: 81},
                        {age: 27},
                        {age: 32}
                    ]), [
                        {age: 27},
                        {age: 32},
                        {age: 81}
                    ]);
                });
            });

            describe("descending", function () {
                var selector = Selector([0,2,1,0,3]).sorted.descending;
                it("produces proper value", function () {
                    assert(selector.evaluate(), [3, 2, 1, 0, 0]);
                });
            });

            describe("by descending", function () {
                var selector = Selector.sorted.by.property("age").descending;
                it("produces proper value", function () {
                    assert(selector.evaluate([
                        {age: 81},
                        {age: 27},
                        {age: 32}
                    ]), [
                        {age: 81},
                        {age: 32},
                        {age: 27}
                    ]);
                });
            });

            describe("of arrays", function () {
                var selector = Selector.sorted;
                it("produces proper value", function () {
                    assert(selector.evaluate([
                        [1, 0],
                        [0, 0, 0],
                        [0, 10],
                        [0, 0, 0, 0]
                    ]), [
                        [0, 0, 0],
                        [0, 0, 0, 0],
                        [0, 10],
                        [1, 0]
                    ]);
                });
            });

            describe("of strings", function () {
                var selector = Selector.sorted;
                assert(selector.evaluate([
                    'z',
                    'a',
                    'Z',
                    'A'
                ]), [
                    'A',
                    'Z',
                    'a',
                    'z'
                ]);
            });

            /*
            describe("of insensitive strings", function () {
                var selector = Selector.sorted.insensitive;
                assert(selector.evaluate([
                    'z',
                    'a',
                    'Z',
                    'A'
                ]), [
                    'A',
                    'a',
                    'Z',
                    'z'
                ]);
            });
            */

        });

        describe("matcher shorthand:", function () {

            it("evaluates multiple properties of value", function () {

                assert(Selector.matches({
                    name: 'Charles Babbage',
                    name_startsWith: 'Charles',
                    name_insensitive_startsWith: 'Charles',
                    name_endsWith: 'Babbage',
                    name_insensitive_endsWith: 'babbage',
                    name_not_endsWith: 'Lovelace'
                }).evaluate({
                    name: 'Charles Babbage'
                }), true)
            });

            it("evaluates multiple properties of a property", function () {
                assert(Selector.property("charles").matches({
                    name: 'Charles Babbage',
                    name_startsWith: 'Charles',
                    name_insensitive_startsWith: 'Charles',
                    name_endsWith: 'Babbage',
                    name_insensitive_endsWith: 'babbage',
                    name_not_endsWith: 'Lovelace'
                }).evaluate({
                    charles: {
                        name: 'Charles Babbage'
                    }
                }), true)
            });

            it("evaluates selected value against a complex predicate", function () {
                assert(
                    Selector.property("foo")
                        .it
                            .equals(10).and
                            .lessThan(20)
                    .evaluate({foo: 10}),
                    true
                );
            });

        });

        it("every interacts well with nested data", function () {

            var ada = {"name": "Ada Lovelace"};
            var charles = {"name": "Charles Babbage"};
            charles.directReports = [ada];
            ada.manager = charles;

            assert(
                Selector
                .property('directReports')
                .every.property('manager.name')
                .equals('Charles Babbage')
                .evaluate(charles),
                true
            );

        });

        describe("match clauses", function () {

            it("evaluates or clause for properties", function () {
                var either = Selector.property("foo").equals("foo").or.property("foo").equals("bar");
                assert(either.evaluate({foo: "foo"}), true);
                assert(either.evaluate({foo: "bar"}), true);
                assert(either.evaluate({foo: "baz"}), false);
            });

            it("evaluates match clause on a property", function () {
                var either = Selector.property("foo").it
                    .equals("foo").or
                    .equals("bar");
                assert(either.evaluate({foo: "foo"}), true);
                assert(either.evaluate({foo: "bar"}), true);
                assert(either.evaluate({foo: "baz"}), false);
            });

            it("evaluates matching clause in parenthetical clause", function () {
                var either = Selector
                .begin
                    .property("foo").it
                        .equals("foo").or
                        .equals("bar")
                .end.and
                    .property("bar")
                        .equals("bar");
                assert(either.evaluate({foo: "foo", bar: "bar"}), true);
                assert(either.evaluate({foo: "foo", bar: "foo"}), false);
                assert(either.evaluate({foo: "bar", bar: "bar"}), true);
                assert(either.evaluate({foo: "baz", bar: "bar"}), false);
            });

        });

        describe("aliases", function () {
            assert(Selector(10).lt(20).evaluate(), true);
        });

        describe("parameters", function () {

            it('parses single parameter', function () {
                assert(Selector.parameter('a').syntax, {
                    type: 'get',
                    args: [
                        {type: 'parameters'},
                        {type: 'literal', value: 'a'}
                    ]
                })
            });

            it('evaluates a single parameter', function () {
                assert(Selector.parameter('a').evaluate(null, {a:10}), 10);
            });

            it('evaluates comparison of two parameters', function () {
                assert(Selector.parameter('a').and.parameter('b').evaluate(null, {
                    a: true,
                    b: true
                }), true);
            });

        });

        describe("partial compilation", function () {

            //// TODO partial compilation
            //it("evaluates partially compiled parameters", function () {
            //    assert(Selector.parameter('a').and.parameter('b').compile({
            //        a: true
            //    })(null, {
            //        b: true
            //    }), true);
            //});

        });

        describe("same subject for all terms", function () {

            var selector = Selector
                .property('foo.bar').equals(10).and
                .property('bar').equals(20);

            it("parses", function () {
                assert(selector.syntax, {
                    "type": "and",
                    "args": [
                        {
                            "type": "equals",
                            "args": [
                                {
                                    "type": "get",
                                    "args": [
                                        {
                                            "type": "get",
                                            "args": [
                                                {
                                                    "type": "value"
                                                },
                                                {
                                                    "type": "literal",
                                                    "value": "foo"
                                                }
                                            ]
                                        },
                                        {
                                            "type": "literal",
                                            "value": "bar"
                                        }
                                    ]
                                },
                                {
                                    "type": "literal",
                                    "value": 10
                                }
                            ]
                        },
                        {
                            "type": "equals",
                            "args": [
                                {
                                    "type": "get",
                                    "args": [
                                        {
                                            "type": "value"
                                        },
                                        {
                                            "type": "literal",
                                            "value": "bar"
                                        }
                                    ]
                                },
                                {
                                    "type": "literal",
                                    "value": 20
                                }
                            ]
                        }
                    ]
                });
            });

            it("evaluates", function () {
                assert(selector.evaluate({
                    foo: {
                        bar: 10
                    },
                    bar: 20
                }), true);
            });
        });

        describe("operator algebra", function () {

            it("negates equality", function () {
                assert(Selector('a').not.equals('b').evaluate(), true);
            });

            //// TODO operator algebra
            //it("combines lessThan or equals", function () {
            //    assert(Selector(10).lessThan.or.equals(10).evaluate(), true);
            //});

        });

        describe('properties of undefined objects', function () {
            it('should pass through without errors', function () {
                expect(Selector.property("a.b.c").evaluate(undefined)).toBe(undefined);
            });
        });

    });

    describe("combination", function () {

        it("captures tokens", function () {
            assert(Selector(Selector.equals(10)).tokens, [
                {type: "begin"},
                {type: "equals"},
                {type: "literal", value: 10},
                {type: "end"}
            ]);
        });

        it("captures syntax", function () {
            assert(Selector(Selector.equals(10)).syntax, {
                type: "equals",
                args: [
                    {type: "value"},
                    {type: "literal", value: 10}
                ]
            });
        });

        it("evaluates", function () {
            assert(
                Selector(
                    Selector
                    .equals(10)
                    .or
                    .equals(20)
                ).and(
                    Selector
                    .equals(10)
                    .or
                    .equals(20)
                ).evaluate(10),
                true
            );
        });

    });

    describe("visitor", function () {
        it("visits each getter node", function () {

            var visits = [];
            Selector.property("a.b").property("c").equals(10).evaluate({
                a: {
                    b: {
                        c: 10
                    }
                }
            }, {}, function (object, key, value, remaining) {
                visits.push([key, remaining]);
            })

            expect(visits).toEqual([
                ['a', 'b.c'],
                ['b', 'c'],
                ['c', null]
            ]);

        });
    });

    describe("property map", function () {
        var evaluate = Selector.property("array.*.foo").compile();

        expect(evaluate({
            array: [
                {'foo': 10},
                {'foo': 20},
                {'foo': 30}
            ]
        })).toEqual([
            10,
            20,
            30
        ]);

    });

    describe("tuple", function () {

        it("tokenizes", function () {
            expect(Selector.array(1, 2, 3).end.tokens).toEqual([
                {type: 'array'},
                {type: 'literal', value: 1},
                {type: 'comma'},
                {type: 'literal', value: 2},
                {type: 'comma'},
                {type: 'literal', value: 3},
                {type: 'end'}
            ]);
        });

        it("evaluates", function () {
            expect(Selector.array(1, 2).end.evaluate()).toEqual([1, 2]);
        });

        it("evaluates 0-uple", function () {
            expect(Selector.array.end.evaluate()).toEqual([]);
        });

        it("works with expressions", function () {
            expect(Selector.array(1).comma(2).end.evaluate()).toEqual([1, 2]);
        })

        it("works with nested expressions", function () {
            expect(
                Selector.array
                    .true.or.false.comma
                    .false.and.true
                .end
                .evaluate()
            )
            .toEqual([
                true,
                false
            ]);
        })

    });

    // TODO serialize and deserialize

    // TODO median, mode, partition

    describe('flatten and unique', function () {
        it('evaluates', function () {
            expect(Selector.flatten.unique.evaluate([[1, 2], [3, 2]])).toEqual([1, 2, 3]);
        });
    });

    require("./selector/property-spec");

});
