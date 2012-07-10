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

var Parser = require("./parser").Parser;

exports.makeSelector = makeSelector;
function makeSelector(language) {

    var tokens = language.tokens;
    var tokenNames = language.tokenNames;
    var semantics = language.semantics;
    var tokenEmitterProperties;

    var Selector = function () {
        return makeTokenEmitter(
            Selector.newWithLanguage(language),
            tokenEmitterProperties
        ).apply(null, arguments);
    };

    Object.defineProperties(Selector, selectorProperties);

    Selector.language = language;

    tokenEmitterProperties = language.selectorExtras || {};
    var extraTokenEmitterNames = Object.keys(tokenEmitterProperties);

    // Proxied properties of the underlying selector
    ['tokens', 'evaluate', 'compile', 'parser', 'syntax']
    .forEach(function (name) {
        tokenEmitterProperties[name] = {get: function () {
            return this.selector[name];
        }};
    });

    tokenNames.forEach(function (name) {
        tokenEmitterProperties[name] = {
            get: function () {
                this.emit(tokens[name]);
                return this;
            }
        };
    });

    // TODO compute array from extras, move emit from extras
    tokenNames
    .concat(extraTokenEmitterNames)
    .forEach(function (name) {
        Object.defineProperty(Selector, name, {
            get: function () {
                var selector = this.newWithLanguage(language);
                var proxy = makeTokenEmitter(
                    selector,
                    tokenEmitterProperties
                )[name];
                Object.defineProperties(proxy, tokenEmitterProperties);
                proxy.selector = selector;
                return proxy;
            }
        });
    });

    Selector.__start = function (token) {
        return makeTokenEmitter(
            Selector.newWithLanguage(language),
            tokenEmitterProperties
        );
    };

    return Selector;
}

exports._makeTokenEmitter = makeTokenEmitter;
function makeTokenEmitter(selector, tokenEmitterProperties) {
    var tokenEmitter = function () {
        var lastIndex = arguments.length - 1;
        Array.prototype.forEach.call(arguments, function (argument, index) {
            if (argument != null && argument.tokens) {
                selector.emit(selector.language.tokens.begin);
                argument.tokens.forEach(function (token) {
                    selector.emit(token);
                });
                selector.emit(selector.language.tokens.end);
            } else {
                selector.emit({type: 'literal', value: argument});
            }
            if (index !== lastIndex) {
                selector.emit(selector.language.tokens.comma);
            }
        });
        return tokenEmitter;
    };
    Object.defineProperties(tokenEmitter, tokenEmitterProperties);
    tokenEmitter.emit = function (token) {
        tokenEmitter.selector.emit(token);
        return tokenEmitter;
    };
    tokenEmitter.selector = selector;
    tokenEmitter.language = selector.language;
    return tokenEmitter;
}

var selectorProperties = {

    newWithLanguage: {
        value: function (language) {
            var self = Object.create(this);
            self.language = language;
            self.parser = Parser.newWithLanguage(language, function (syntax) {
                self._syntax = syntax;
            });
            return self;
        }
    },

    fromSyntax: {
        value: function (syntax) {
            var self = Object.create(this);
            self._syntax = syntax;
            return self;
        }
    },

    tokens: {
        get: function () {
            if (!this.parser) {
                return [];
            } else {
                return this.parser.tokens;
            }
        }
    },

    emit: {
        value: function (token) {
            if (!this.parser) {
                return this.__start().emit(token);
            } else {
                this.parser.emit(token);
                return this;
            }
        }
    },

    syntax: {
        get: function () {
            if (!this.parser) {
                return this.language.tokens.value;
            } else {
                this.emit(this.language.tokens.eof);
                return this._syntax;
            }
        }
    },

    compile: {
        value: function (parameters) {
            if (!this.parser) {
                return function (value) {
                    return value;
                };
            } else {
                return this.language.semantics.compile(
                    this.syntax,
                    parameters
                );
            }
        }
    },

    evaluate: {
        value: function (value, parameters, visitor) {
            if (!this.parser) {
                return value;
            } else {
                return this.language.semantics.evaluate(
                    this.syntax,
                    value,
                    parameters,
                    visitor
                );
            }
        }
    }

};

