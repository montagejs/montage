/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

var Parser = require("./parser").Parser;

exports.makeSelector = makeSelector;
function makeSelector(language) {

    var tokens = language.tokens;
    var tokenNames = language.tokenNames;
    var semantics = language.semantics;

    var Selector = function () {
        return makeTokenEmitter(
            Selector.newWithLanguage(language),
            tokenEmitterProperties
        ).apply(null, arguments);
    };

    Object.defineProperties(Selector, selectorProperties);

    Selector.language = language;

    var tokenEmitterProperties = language.selectorExtras || {};
    var extraTokenEmitterNames = Object.keys(tokenEmitterProperties);

    // Proxied properties of the underlying selector
    [
        'tokens',
        'evaluate',
        'compile',
        'observe',
        'compileObserver',
        'parser',
        'syntax',
        'representation'
    ]
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

    representation: {
        value: function () {
            if (!this.parser) {
                return 'Selector.value';
            } else {
                return this.parser.representation();
            }
        }
    },

    compile: {
        value: function () {
            if (!this.parser) {
                return function (value) {
                    return value;
                };
            } else {
                return this.language.semantics.compile(this.syntax);
            }
        }
    },

    evaluate: {
        value: function (value, parameters) {
            return this.compile()(value, parameters);
        }
    },

    compileObserver: {
        value: function () {
            if (!this.parser) {
                return function (value, parameters, callback) {
                    callback(value);
                    return function () {};
                };
            } else {
                return this.language.observerSemantics.compile(this.syntax);
            }
        }
    },

    observe: {
        value: function (value, parameters, callback, errback) {
            return this.compileObserver()(value, parameters, callback, errback);
        }
    }

};

