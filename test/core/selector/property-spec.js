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

var PropertyLanguage = require('montage/core/selector/property-language').PropertyLanguage;
var Selector = require('montage/core/selector').Selector;

describe('core/selector/property-spec', function () {

    function describeParsing(expectSyntax) {

        describe('properties', function() {

            it('makes syntax tree for "a"', function () {
                expectSyntax('a').toEqual({
                    type: 'get',
                    args: [
                        {type: 'value'},
                        {type: 'literal', value: 'a'}
                    ]
                });
            });

            it('makes syntax tree for "a.b"', function () {
                expectSyntax('a.b').toEqual({
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
                })
            });

        });

        describe('indicies', function() {

            it('makes syntax tree for "array.0"', function () {
                expectSyntax('array.0').toEqual({
                    type: 'get',
                    args: [
                        {
                            type: 'get',
                            args: [
                                {type: 'value'},
                                {type: 'literal', value: 'array'}
                            ]
                        },
                        {type: 'literal', value: 0}
                    ]
                })
            });

        });

        describe('mapped properties', function () {

            it('parses *', function () {
                expectSyntax('*').toEqual({
                    type: 'value'
                });
            });

            it('parses array.*.foo', function () {
                expectSyntax('array.*.foo').toEqual({
                    type: 'map',
                    args: [
                        {
                            type: 'get',
                            args: [
                                {type: 'value'},
                                {type: 'literal', value: 'array'}
                            ]
                        },
                        {
                            type: 'get',
                            args: [
                                {type: 'value'},
                                {type: 'literal', value: 'foo'}
                            ]
                        }
                    ]
                });
            });

        });

        describe('functions', function () {

            it('parses sorted()', function () {
                expectSyntax('sorted()').toEqual({
                    type: 'sorted',
                    args: [
                        {type: 'value'},
                        {type: 'value'},
                        {type: 'literal', value: false}
                    ]
                });
            });

            it('parses array.sorted() from the array property', function () {
                expectSyntax('array.sorted()').toEqual({
                    type: 'sorted',
                    args: [
                        {
                            type: 'get',
                            args: [
                                {type: 'value'},
                                {type: 'literal', value: 'array'}
                            ]
                        },
                        {type: 'value'},
                        {type: 'literal', value: false}
                    ]
                });
            });

            it('parses unique(foo) with a property to map', function () {
                expectSyntax('array.unique(foo)').toEqual({
                    type: 'unique',
                    args: [
                        {
                            type: 'map',
                            args: [
                                {
                                    type: 'get',
                                    args: [
                                        {type: 'value'},
                                        {type: 'literal', value: 'array'}
                                    ]
                                },
                                {
                                    type: 'get',
                                    args: [
                                        {type: 'value'},
                                        {type: 'literal', value: 'foo'}
                                    ]
                                }
                            ]
                        },
                        {
                            type: 'value'
                        }
                    ]
                });
            });

        });

        describe('arrays', function () {

            it('parses duple with properties', function () {
                expectSyntax('(a,b)').toEqual({
                    type: 'array',
                    terms: [
                        {
                            type: 'get',
                            args: [
                                {type: 'value'},
                                {type: 'literal', value: 'a'}
                            ]
                        },
                        {
                            type: 'get',
                            args: [
                                {type: 'value'},
                                {type: 'literal', value: 'b'}
                            ]
                        }
                    ]
                })
            });

            it('parses triple of indicies', function () {
                expectSyntax('10,20,30').toEqual({
                    type: 'array',
                    terms: [
                        {
                            type: 'get',
                            args: [
                                {type: 'value'},
                                {type: 'literal', value: 10}
                            ]
                        },
                        {
                            type: 'get',
                            args: [
                                {type: 'value'},
                                {type: 'literal', value: 20}
                            ]
                        },
                        {
                            type: 'get',
                            args: [
                                {type: 'value'},
                                {type: 'literal', value: 30}
                            ]
                        }
                    ]
                })
            });

            it('parses a 1-uple', function () {
                expectSyntax('(10,)').toEqual({
                    type: 'array',
                    terms: [
                        {
                            type: 'get',
                            args: [
                                {type: 'value'},
                                {type: 'literal', value: 10}
                            ]
                        }
                    ]
                })
            });

            it('parses a 0-uple', function () {
                expectSyntax('()').toEqual({
                    type: 'array',
                    terms: []
                })
            });

        });

    }

    function describeEvaluation(expectEvaluation) {

        describe('properties', function() {

            it('evaluates a property of an object', function () {
                expectEvaluation('a', {a: 10}).toEqual(10);
            });

            it('traverses a property path', function () {
                expectEvaluation('a.b', {a: {b: 10}}).toEqual(10);
            });

            it('handles null properties', function () {
                expectEvaluation('a.b', {a: 10}).toEqual(undefined);
            });

        });

        describe('indicies', function() {
            it('evaluates a zero index of an array', function () {
                expectEvaluation('0', ['a']).toEqual('a');
            });
        });

        describe('functions', function () {

            describe('count()', function () {
                it('is accurate', function () {
                    expectEvaluation("count()", [
                        'a', 'b', 'c'
                    ]).toEqual(3);
                });
            });

            describe('average()', function () {
                it('is accurate', function () {
                    expectEvaluation("average()", [
                        2, 2, 4, 4
                    ]).toEqual(3);
                });
            });

            describe('unique()', function () {
                it('is accurate', function () {
                    expectEvaluation("unique()", [
                        2, 2, 4, 4
                    ]).toEqual([2, 4]);
                });
            });

        });

        describe('arrays', function () {

            it('evaluates a duple of properties', function () {
                expectEvaluation('(a,b)', {
                    a: 10,
                    b: 20
                }).toEqual([
                    10,
                    20
                ]);
            });

        });

        describe('sum', function () {
            it('evaluates', function () {
                expectEvaluation('sum(foo)', [
                    {foo: 10},
                    {foo: 20}
                ]).toEqual(30)
            });
        });

        describe('sum of array', function () {
            it('evaluates', function () {
                expectEvaluation('*.foo.sum()', [
                    {foo: 10},
                    {foo: 20}
                ]).toEqual(30)
            });
        });

        describe('sum of array property', function () {
            it('evaluates', function () {
                expectEvaluation('array.*.foo.sum()', {
                    array: [
                        {foo: 10},
                        {foo: 20}
                    ]
                }).toEqual(30)
            });
        });

        describe('map of array with asterisk', function () {
            it('evaluates', function () {
                expectEvaluation('*.foo', [
                    {foo: 10},
                    {foo: 20}
                ]).toEqual([
                    10,
                    20
                ])
            });
        });

        describe('map of array', function () {
            it('evaluates', function () {
                expectEvaluation('map(foo)', [
                    {foo: 10},
                    {foo: 20}
                ]).toEqual([
                    10,
                    20
                ])
            });
        });

        describe('map multi-property relation, then sum', function () {
            it('evaluates', function () {
                expectEvaluation('*.(foo.bar).sum()', [
                    {foo: {bar: 10}},
                    {foo: {bar: 20}}
                ]).toEqual(30)
            });
        });

    }

    describe('PropertyLanguage', function () {

        describe('tokenize', function () {

            it('returns tokens of "a.b"', function () {
                expect(PropertyLanguage.tokenize('a.b')).toEqual([
                    {type: 'literal', value: 'a'},
                    {type: 'literal', value: 'b'},
                ]);
            });

            it('emits tokens of "a.b"', function () {
                var tokens = [];
                PropertyLanguage.tokenize('a.b', function (token) {
                    tokens.push(token);
                });
                expect(tokens).toEqual([
                    {type: 'literal', value: 'a'},
                    {type: 'literal', value: 'b'},
                ]);
            });

        });

        describe('parse', function () {
            describeParsing(function (input) {
                return expect(PropertyLanguage.parse(input));
            });
        });

        describe('evaluate', function () {
            describeEvaluation(function (expression, value) {
                return expect(PropertyLanguage.evaluate(expression, value));
            });
        });

    });

    describe('Selector.property', function () {

        describe('tokens', function () {

            it('merges property tokens with surrounding syntax', function () {
                expect(Selector.property('a.b').equals('c').tokens).toEqual([
                    {type: 'get'},
                    {type: 'literal', value: 'a'},
                    {type: 'get'},
                    {type: 'literal', value: 'b'},
                    {type: 'equals'},
                    {type: 'literal', value: 'c'},
                ]);
            });

            it('produces tokens of sorted()', function () {
                expect(Selector.property('sorted()').tokens).toEqual([
                    {type: 'begin'},
                    {type: 'sorted'},
                    {type: 'by'},
                    {type: 'end'}
                ]);
            });


        });

        describe('parse', function () {

            describeParsing(function (input) {
                return expect(Selector.property(input).syntax);
            });

            describe('errors', function () {

                it('should fail to parse "10a"', function () {
                    expect(function () {
                        Selector.property('10a');
                    }).toThrow();
                });

                it('should fail to parse ".*"', function () {
                    expect(function () {
                        console.log(Selector.property('.*').syntax);
                    }).toThrow();
                });

                it('should fail to parse "..."', function () {
                    expect(function () {
                        console.log(Selector.property('...').syntax);
                    }).toThrow();
                });

            });

        });

        describe('compile', function () {
            describeEvaluation(function (expression, value, parameters) {
                return expect(Selector.property(expression).compile()(value, parameters));
            });
        });

        describe('evaluate', function () {
            describeEvaluation(function (expression, value, parameters) {
                return expect(Selector.property(expression).evaluate(value, parameters));
            });
        });

    });

});

