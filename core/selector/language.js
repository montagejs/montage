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

var Montage = require("montage").Montage;
var AbstractLanguage = require("./abstract-language").AbstractLanguage;
var Semantics = require("./semantics").Semantics;
var PropertyLanguage = require("./property-language").PropertyLanguage;

var Language = exports.Language = AbstractLanguage.create(AbstractLanguage, {

    semantics: {
        value: Semantics
    },

    grammar: {
        value: function () {
            var parseScalar, parseExpression;

            // precedence

            this.parsePrimary(function (callback) {
                return parseExpression(callback);
            });

            this.parseProperties();
            this.parseLeftToRight(['startsWith', 'endsWith']);
            this.parseLeftToRight(['pow']);
            this.parseLeftToRight(['mul', 'div', 'mod']);
            this.parseLeftToRight(['add', 'sub']);
            this.parseBinary(['lessThan', 'greaterThan', 'lessThanOrEquals', 'greaterThanOrEquals']);
            this.parseBinary(['equals', 'notEquals']);
            this.parseLeftToRight(['xor']);
            this.parseLeftToRight(['and']);
            this.parseLeftToRight(['or']);
            this.parseConditional();
            parseScalar = this.precedence();

            this.parseArray();
            this.parseRightToLeft(['has', 'contains', 'every', 'some', 'one', 'only', 'filter', 'map', 'it']);
            this.parseSorted(parseScalar);
            this.parseSlice(parseScalar);
            this.parseRightToLeft(['sum', 'count', 'average', 'unique', 'flatten']);
            parseExpression = this.precedence();

            // TODO median, mode, flatten, any, all

            // extra

            this.parseOperator(); // to collect the needed tokens

        }
    },

    aliases: {
        value: {
            lt: 'lessThan',
            gt: 'greaterThan',
            le: 'lessThanOrEquals',
            ge: 'greaterThanOrEquals',
            eq: 'equals',
            ne: 'notEquals'
        }
    },

    constants: {
        value: {
            'true': true,
            'false': false
        }
    },

    selectorExtras: {
        value: {

            // Shorthand for chained gets
            property: {
                value: function (path) {
                    try {
                        var self = this;
                        var syntax = PropertyLanguage.parse(path);
                        PropertyLanguage.reemit(syntax, function (token) {
                            self = self.emit(token);
                        })
                        return self;
                    } catch (exception) {
                        throw exception;
                        throw new SyntaxError(
                            "Can't parse property: " + JSON.stringify(path) + ": " +
                            exception.message
                        );
                    }
                }
            },

            // Shorthand using object literals
            matches: {
                value: function (object) {
                    var Selector = this.language.Selector;
                    var selector = this.it["true"];
                    var tokens = selector.language.tokens;
                    for (var property_operator in object) {
                        var value = object[property_operator];
                        property_operator = property_operator.split('_');
                        var property = property_operator.shift();
                        selector.emit(tokens.and);
                        Selector.property(property).tokens.forEach(function (token) {
                            selector.emit(token);
                        });
                        if (property_operator.length) {
                            property_operator.forEach(function (operator) {
                                selector.emit(tokens[operator]);
                            });
                        } else {
                            selector.emit(tokens.equals);
                        }
                        selector.emit({type: 'literal', value: value});
                    }
                    return selector;
                }
            }

        }
    },

    parseIdentifier: {
        value: function (callback) {
            var self = this;
            self.requireTokens(['literal']);
            return function (token) {
                if (token.type === 'literal' && typeof token.value === 'string') {
                    return callback(token.value);
                } else {
                    throw new SyntaxError('Expected identifier, got: ' + JSON.stringify(token.type));
                }
            };
        }
    },

    parseUrPrimary: {
        value: function (callback, parseExpression, negated, rewindNegation) {
            var self = this;
            return function (token) {
                if (token.type === 'begin') {
                    return parseExpression(function (expression) {
                        return self.expect('end', function () {
                            return callback(expression, negated);
                        });
                    });
                } else if (token.type === 'value') {
                    return callback(self.tokens.value, negated);
                } else if (token.type === 'parameter') {
                    return self.parseIdentifier(function (name) {
                        var syntax = name.split(".").reduce(function (previous, name) {
                            return {
                                type: 'get',
                                args: [previous, {
                                    type: 'literal',
                                    value: name
                                }]
                            }
                        }, {type: 'parameters'})
                        return callback(syntax, negated);
                    })
                } else if (token.type === 'literal') {
                    return callback(token, negated);
                } else if (self.constants[token.type]) {
                    return callback(self.constantSyntax[token.type], negated);
                } else {
                    return rewindNegation(
                        callback(
                            self.tokens.value,
                            false
                        )
                    )(token);
                }
            };
        }
    },

    parsePrimary: {
        value: function (parseExpression) {
            var self = this;
            self.requireTokens(['begin', 'end', 'value', 'literal', 'parameter', 'not']);
            return self.precedence(function () { // first level of precedence
                return function (callback) {
                    return self.optional('not', function (negated, rewindNegation) {
                        return self.parseUrPrimary(function (expression, stillNegated) {
                            if (stillNegated) {
                                expression = self.makeSyntax('not', [expression]);
                            }
                            return callback(expression);
                        }, parseExpression, negated, rewindNegation);
                    });
                }
            });
        }
    },

    parseProperties: {
        value: function () {
            var self = this;
            self.requireTokens(['get']);
            var parseSelf = self.precedence(function (parsePrevious) {
                return function (callback, previous) {
                    return function (token) {
                        if (token.type === 'get') {
                            return self.expect('literal', function (literal) {
                                previous = self.makeSyntax('get', [previous || self.tokens.value, literal]);
                                return parseSelf(callback, previous);
                            });
                        } else if (previous) {
                            return callback(previous)(token);
                        } else {
                            return parsePrevious(callback)(token);
                        }
                    }
                };
            });
            return parseSelf;
        }
    },

    parseConditional: {
        value: function () {
            var self = this;
            self.requireTokens(['if', 'then', 'else']);
            return self.precedence(function (parsePrevious) {
                return function (callback) {
                    return function (token) {
                        if (token.type === 'if') {
                            return parsePrevious(function (guard) {
                                return self.expect('then', function () {
                                    return parsePrevious(function (consequent) {
                                        return self.expect('else', function () {
                                            return parsePrevious(function (alternate) {
                                                return callback(self.makeSyntax('if', [
                                                    guard,
                                                    consequent,
                                                    alternate
                                                ]));
                                            });
                                        });
                                    });
                                });
                            });
                        } else {
                            return parsePrevious(callback)(token);
                        }
                    }
                };
            });
        }
    },

    parseArray: {
        value: function () {
            var self = this;
            self.requireTokens(['array', 'comma']);
            var parseSelf = self.precedence(function (parsePrevious) {
                return function (callback) {
                    return self.optional('array', function (array) {
                        if (array) {
                            return self.parseArrayTerms(function (terms) {
                                return callback({
                                    type: 'array',
                                    terms: terms
                                })
                            }, [], parsePrevious);
                        } else {
                            return parsePrevious(callback);
                        }
                    });
                };
            })
            return parseSelf;
        }
    },

    parseArrayTerms: {
        value: function (callback, previousTerms, parsePrevious) {
            var self = this;
            return self.optional('end', function (end, rewindEnd) {
                if (end) {
                    return callback(previousTerms);
                } else {
                    return parsePrevious(function (term) {
                        var terms = previousTerms.concat([term]);
                        return self.optional('comma', function (comma) {
                            if (comma) {
                                return self.parseArrayTerms(
                                    callback,
                                    terms,
                                    parsePrevious
                                );
                            } else {
                                return self.expect('end', function () {
                                    return callback(terms);
                                });
                            }
                        });
                    })
                }
            });
        }
    },

    parseSorted: {
        value: function (parseScalar) {
            var self = this;
            self.requireTokens(['sorted', 'by', 'descending']);
            return self.precedence(function (parsePrevious) {
                return function (callback) {
                    return parsePrevious(function (left) {
                        return function (token) {
                            if (token.type === 'sorted') {
                                var parseDescending = function (by) {
                                    return self.optional('descending', function (descending) {
                                        return callback(self.makeSyntax('sorted', [
                                            left,
                                            by || {type: 'value'},
                                            {type: 'literal', value: descending}
                                        ]));
                                    });
                                };
                                return self.optional('by', function (by) {
                                    if (by) {
                                        return parseScalar(parseDescending);
                                    } else {
                                        return parseDescending();
                                    }
                                });
                            } else {
                                return callback(left)(token);
                            }
                        }
                    });
                };
            });
        }
    },

    // TODO rewrite to support slice(length).after(value)
    parseSlice: {
        value: function (parseScalar) {
            var self = this;
            self.requireTokens(['slice', 'from', 'comma']);
            return self.precedence(function (parsePrevious) {
                return function (callback) {
                    return parsePrevious(function (left) {
                        return function (token) {
                            if (token.type === 'slice') {
                                return self.optional('from', function (from) {
                                    return parseScalar(function (start) {
                                        return self.expect('comma', function (comma, rewindComma) {
                                            return parseScalar(function (stop) {
                                                return callback(self.makeSyntax(
                                                    from ? 'sliceFrom' : 'slice',
                                                    [
                                                        left,
                                                        start,
                                                        stop
                                                    ]
                                                ));
                                            });
                                        });
                                    });
                                });
                            } else {
                                return callback(left)(token);
                            }
                        }
                    });
                }
            });
        }
    }

});

