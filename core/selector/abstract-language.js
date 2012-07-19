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

var makeSelector = require("./abstract-selector").makeSelector;

var AbstractLanguage = exports.AbstractLanguage = Montage.create(Montage, {

    create: {
        value: function (prototype, descriptor) {
            var self = Montage.create(prototype, descriptor);
            self.parsePrevious = null;
            self.tokens = {};
            self.tokenNames = [];
            self.constantSyntax = {};
            self.requireConstants(self.constants);

            // compute inverse of aliases so we can map tokens
            self.reverseAliases = {};
            self.aliases = self.aliases || {};
            Object.keys(self.aliases).forEach(function (to) {
                var from = self.aliases[to];
                self.reverseAliases[from] = self.reverseAliases[from] || [];
                self.reverseAliases[from].push(to);
            });

            self.requireTokens(['eof']);

            self.grammar();

            self.Selector = makeSelector(self);

            return self;
        }
    },

    // shared by all instances and heirs to reduce allocations
    tokenMemo: {
        value: {}
    },

    requireTokens: {
        value: function (names) {
            var self = this;
            return names.reduce(function (accumulated, name) {
                if (!self.tokens[name]) {
                    self.tokens[name] =
                        self.tokenMemo[name] =
                        self.tokenMemo[name] || {type: name};
                    self.tokenNames.push(name);
                    if (self.reverseAliases[name]) {
                        return accumulated
                            .concat([name])
                            .concat(
                                self.requireTokens(self.reverseAliases[name])
                            );
                    }
                }
                return accumulated.concat([name]);
            }, []);
        }
    },

    constantSyntax: {
        value: null
    },

    requireConstants: {
        value: function (constants) {
            var self = this;
            var names = Object.keys(constants || {});
            names.forEach(function (name) {
                if (!self.constantSyntax[name]) {
                    self.tokens[name] =
                    self.constantSyntax[name] = {
                        type: 'literal',
                        value: self.constants[name]
                    }
                    self.tokenNames.push(name);
                }
            });
        }
    },

    // parser utilities

    makeSyntax: {
        value: function (type, args, insensitive, negated) {
            var self = this;

            while (self.aliases.hasOwnProperty(type)) {
                type = self.aliases[type];
            }
            var syntax = {
                type: type,
                args: args,
                insensitive: insensitive || undefined
            };
            if (!insensitive) {
                delete syntax.insensitive;
            }
            if (negated) {
                return {
                    type: 'not',
                    args: [syntax]
                }
            }
            return syntax;
        }
    },

    parsePrevious: {
        value: null
    },

    precedence: {
        value: function (callback) {
            callback = callback || identity;
            this.parsePrevious = callback(this.parsePrevious);
            return this.parsePrevious;
        }
    },

    // parsers

    optional: {
        value: function (type, callback) {
            return function (token) {
                if (type === token.type) {
                    return callback(true, function rewind(state) {
                        return state(token);
                    });
                } else {
                    return callback(false, function rewind(state) {
                        return state;
                    })(token);
                }
            };
        }
    },

    expect: {
        value: function (type, callback) {
            return function (token) {
                if (token.type !== type) {
                    throw new SyntaxError(
                        'Expected token ' + JSON.stringify(type) +
                        ' got ' + JSON.stringify(token.type));
                } else {
                    return callback(token);
                }
            };
        }

    },

    parseEof: {
        value: function () {
            var self = this;
            return self.expect('eof', function () {
                return function () {
                    return self.parseEof();
                };
            })
        }
    },

    parseOperator: {
        value: function (types, consequent, alternate) {
            var self = this;
            self.requireTokens(['insensitive', 'not']);
            return self.optional('insensitive', function (
                insensitive,
                rewindInsensitive
            ) {
                return self.optional('not', function (
                    negated,
                    rewindNegation
                ) {
                    return function (token) {
                        if (types.indexOf(token.type) !== -1) {
                            return consequent(
                                token.type,
                                insensitive,
                                negated
                            );
                        } else {
                            return rewindInsensitive(
                                rewindNegation(
                                    alternate()
                                )
                            )(token);
                        }
                    };
                });
            });
        }
    },

    parseLeftToRight: {
        value: function (types) {
            var self = this;
            types = self.requireTokens(types);
            var parseSelf = self.precedence(function (parsePrevious) {
                return function (callback, left) {
                    if (left) {
                        return self.parseOperator(types, function (
                            type,
                            insensitive,
                            negated
                        ) {
                            return parsePrevious(function (right) {
                                var syntax = self.makeSyntax(
                                    type,
                                    [left, right],
                                    insensitive,
                                    negated
                                );
                                return parseSelf(callback, syntax);
                            });
                        }, function () {
                            return callback(left);
                        });
                    } else {
                        return parsePrevious(function (left) {
                            return parseSelf(callback, left);
                        })
                    }
                }
            });
            return parseSelf;
        }
    },

    parseRightToLeft: {
        value: function (types) {
            var self = this;
            types = self.requireTokens(types);
            var parseSelf = self.precedence(function (parsePrevious) {
                return function (callback) {
                    return parsePrevious(function (left) {
                        return self.parseOperator(types, function (
                            type,
                            insensitive,
                            negated
                        ) {
                            return parseSelf(function (right) {
                                var syntax = self.makeSyntax(
                                    type,
                                    [left, right],
                                    insensitive,
                                    negated
                                );
                                return callback(syntax);
                            });
                        }, function () {
                            return callback(left);
                        });
                    });
                };
            });
            return parseSelf;
        }
    },

    parseBinary: {
        value: function (types) {
            var self = this;
            types = self.requireTokens(types);
            return self.precedence(function (parsePrevious) {
                return function (callback) {
                    return parsePrevious(function (left) {
                        return self.parseOperator(types, function (
                            type,
                            insensitive,
                            negated
                        ) {
                            return parsePrevious(function (right) {
                                var syntax = self.makeSyntax(
                                    type,
                                    [left, right],
                                    insensitive,
                                    negated
                                );
                                return callback(syntax);
                            });
                        }, function () {
                            return callback(left);
                        });
                    });
                };
            });
        }
    }

});

function identity(x) {return x}

