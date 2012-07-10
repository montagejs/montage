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

var AbstractLanguage = require('./abstract-language').AbstractLanguage;
var Parser = require('./parser').Parser;
var Semantics = require('./semantics').Semantics;
var LANGUAGE = require('./language'); // late bound for dependency cycle

var VALUE = 'value';
var LITERAL = 'literal';
var GET = 'get';
var BEGIN = 'begin';
var END = 'end';
var MAP = 'map';
var COMMA = 'comma';
var IT = 'it';
var DOT = '.';
var ARRAY = 'array';
var SORTED = 'sorted';

var PropertyLanguage = exports.PropertyLanguage = AbstractLanguage.create(AbstractLanguage, {

    semantics: {
        value: Semantics
    },

    stringToToken: {
        value: {
            '(': {type: BEGIN},
            ')': {type: END},
            '*': {type: MAP},
            ',': {type: COMMA}
        }
    },

    tokenRe: {
        value: /\(|\)|\d+|\w[\w\d]*|,|\*|\.|./g
    },

    termStartRe: {
        value: /[\(\w\d\*]/
    },

    separatorsRe: {
        value: /[\(\)\.,]/
    },

    tokenize: {
        value: function (string, emit) {
            var tokens;
            if (!emit) {
                tokens = [];
                emit = function (token) {
                    tokens.push(token);
                }
            }
            var self = this;
            var expectSeparator = false;
            var expectTermStart = true;
            var soFar = '';
            string.replace(self.tokenRe, function (token) {
                if (expectSeparator) {
                    if (!self.separatorsRe.test(token)) {
                        throw new Error(
                            'Expected punctuation after: ' +
                            JSON.stringify(soFar) + ", got: " +
                            JSON.stringify(string.slice(soFar.length))
                        );
                    }
                    expectSeparator = false;
                }
                if (expectTermStart) {
                    if (!self.termStartRe.test(token)) {
                        throw new Error(
                            'Expected term after: ' + JSON.stringify(soFar) + ", got: " +
                            JSON.stringify(string.slice(soFar.length))
                        );
                    }
                }
                if (token === DOT) {
                    // ignore, used only for delimiting tokens, like a space
                    expectTermStart = true;
                } else if (self.stringToToken[token]) {
                    emit(self.stringToToken[token]);
                    expectTermStart = false;
                } else if (/^\d+$/.test(token)) {
                    emit({
                        type: LITERAL,
                        value: +token
                    });
                    expectSeparator = true;
                    expectTermStart = false;
                } else if (/^\w[\w\d]*$/.test(token)) {
                    emit({
                        type: LITERAL,
                        value: token
                    });
                    expectSeparator = true;
                    expectTermStart = false;
                } else {
                    throw new Error('Unexpected character: ' + JSON.stringify(token));
                }
                soFar += token;
            })
            return tokens;
        }
    },

    parse: {
        value: function (string) {
            var self = this;
            var syntax;
            var parser = Parser.newWithLanguage(self, function (_syntax) {
                syntax = _syntax;
            });
            self.tokenize(string, function (token) {
                parser.emit(token);
            })
            parser.emit(LANGUAGE.Language.tokens.eof);
            return syntax;
        }
    },

    grammar: {
        value: function () {
            var self = this;

            self.primary = self.parsePrimary(function (callback) {
                return self.parseExpression(callback);
            });

            var parseTuple = self.parseTuple();

            self.parseExpression = self.precedence();

        }
    },

    parseTerm: {
        value: function (consequent, alternate) {
            var self = this;
            return function (token) {
                if (token.type === LITERAL) {
                    return self.optional(BEGIN, function (begin) {
                        if (begin) {
                            return self.primary(function (expression) {
                                return self.expect(END, function () {
                                    return consequent({
                                        call: true,
                                        type: token.value,
                                        arg: expression
                                    });
                                });
                            });
                        } else {
                            return consequent({
                                type: GET,
                                arg: token
                            });
                        }
                    });
                } else if (token.type === MAP) {
                    return self.parseTerm(function (map) {
                        return consequent({
                            type: MAP,
                            arg: {
                                type: map.type,
                                args: [
                                    {type: VALUE},
                                    map.arg
                                ]
                            }
                        })
                    }, function () {
                        return consequent({
                            type: IT,
                            arg: {type: VALUE}
                        })
                    });
                } else if (token.type === BEGIN) {
                    return self.parseExpression(function (expression) {
                        return self.expect(END, function () {
                            return consequent({
                                type: IT,
                                arg: expression
                            });
                        });
                    });
                } else {
                    return alternate()(token);
                }
            };
        }
    },

    parsePrimary: {
        value: function (parseExpression) {
            var self = this;
            var parseSelf = self.precedence(function (parsePrevious) {
                return function (callback, previous) {
                    previous = previous || {type: VALUE};
                    return self.parseTerm(function (term) {
                        var syntax;
                        if (term.call) {
                            if (term.arg.type !== VALUE) {
                                previous = {
                                    type: MAP,
                                    args: [
                                        previous,
                                        term.arg
                                    ]
                                };
                            }
                            syntax = {
                                type: term.type,
                                args: [
                                    previous,
                                    {type: 'value'}
                                ]
                            }
                        } else {
                            syntax = {
                                type: term.type,
                                args: [
                                    previous,
                                    term.arg
                                ]
                            }
                        }
                        if (syntax.type === SORTED) {
                            // ascending
                            // TODO(kriskowal) support descending
                            syntax.args.push({
                                type: 'literal',
                                value: false
                            })
                        }
                        if (
                            syntax.type === IT &&
                            syntax.args[0].type === VALUE
                        ) {
                            syntax = syntax.args[1];
                        }
                        return parseSelf(callback, syntax);
                    }, function () {
                        return callback(previous || LANGUAGE.Language.tokens.value);
                    });
                };
            });
            return parseSelf;
        }
    },

    parseTuple: {
        value: function () {
            var self = this;
            self.requireTokens([COMMA]);
            var parseSelf = self.precedence(function (parsePrevious) {
                return function (callback, terms) {
                    return self.optional(END, function (isEnd, rewindEnd) {
                        if (isEnd) {
                            return rewindEnd(callback({
                                type: ARRAY,
                                terms: terms || []
                            }))
                        } else {
                            return parsePrevious(function (term) {
                                return self.optional(COMMA, function (isComma, rewindComma) {
                                    if (isComma) {
                                        return parseSelf(callback, (terms || []).concat([term]));
                                    } else if (terms) {
                                        return callback({
                                            type: ARRAY,
                                            terms: terms.concat([term])
                                        });
                                    } else {
                                        return callback(term);
                                    }
                                });
                            })
                        }
                    });
                };
            })
            return parseSelf;
        }
    },

    reemit: {
        value: function (syntax, emit, tokens) {
            tokens = tokens || LANGUAGE.Language.tokens;
            if (syntax.type === VALUE) {
            } else if (syntax.type === GET) {
                this.reemit(syntax.args[0], emit);
                emit(tokens.get)
                emit(syntax.args[1]);
            } else if (syntax.type === ARRAY) {
                emit(tokens.array);
                var terms = syntax.terms;
                var lastIndex = terms.length - 1;
                terms.forEach(function (term, index) {
                    this.reemit(term, emit);
                    if (index !== lastIndex || index === 0) {
                        emit(tokens.comma);
                    }
                }, this);
                emit(tokens.end);
            } else if (syntax.type === SORTED) {
                emit(tokens.begin);
                this.reemit(syntax.args[0], emit);
                emit(tokens.sorted);
                emit(tokens.by);
                this.reemit(syntax.args[1], emit);
                emit(tokens.end);
            } else {
                emit(tokens.begin);
                this.reemit(syntax.args[0], emit);
                emit(tokens[syntax.type]);
                this.reemit(syntax.args[1], emit);
                emit(tokens.end);
            }
            // TODO(kriskowal) Complete and factor, perhaps infer from
            // structure of declared forms.
            // This retokenizer is not exhaustive of the Language grammar, just
            // the PropertyLanguage subset of the Language grammar.
        }
    },

    compile: {
        value: function (string) {
            var syntax = this.parse(string);
            return this.semantics.compile(syntax);
        }
    },

    evaluate: {
        value: function (string, value) {
            return this.compile(string)(value);
        }
    }

});

