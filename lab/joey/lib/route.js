/* <copyright>
Copyright (c) 2012, Motorola Mobility, Inc
All Rights Reserved.
BSD License.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

  - Redistributions of source code must retain the above copyright notice,
    this list of conditions and the following disclaimer.
  - Redistributions in binary form must reproduce the above copyright
    notice, this list of conditions and the following disclaimer in the
    documentation and/or other materials provided with the distribution.
  - Neither the name of Motorola Mobility nor the names of its contributors
    may be used to endorse or promote products derived from this software
    without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */

var JAQUE = require("jaque");
var methods = require("./methods");

exports.Setup = function (chain, prefix, setup) {
    if (!setup) {
        setup = prefix;
        prefix = "/";
    }
    var choices = [];
    var named = {};
    var positional = [];
    [null].concat(methods).forEach(function (method, i) {
        var create = function () {
            var _prefix = prefix;
            var choice = {
                predicate: function (request, response) {
                    return method === null || request.method === method;
                },
                chain: chain.constructor()
            };
            Array.prototype.forEach.call(arguments, function (arg) {
                if (typeof arg === "string") {
                    choice.predicate = union(
                        choice.predicate,
                        pathPredicate(_prefix, arg)
                    );
                    _prefix = "/"
                } else if (typeof arg === "function") {
                    choice.predicate = union(choice.predicate, arg);
                }
            });
            choices.push(choice);
            return choice.chain;
        };
        named[method] = create;
        if (i < 4)
            positional[i] = create;
    });
    setup.apply(named, positional);
    return function (next) {
        choices.forEach(function (choice) {
            choice.app = choice.chain.end(next);
        });
        return exports.Route(choices, next);
    };
};

var union = function (a, b) {
    if (!a)
        return b;
    return function () {
        return a.apply(this, arguments) && b.apply(this, arguments);
    };
};

var pathPredicate = function (prefix, path) {
    var keys = [];
    var regex = exports.makeRegExp(prefix + path, keys);
    return function (request, response) {
        var match = regex.exec(request.pathInfo)
        if (match) {
            request.scriptName += request.pathInfo;
            request.pathInfo = "";
            var params = request.params = request.params || {};
            keys.forEach(function (key, i) {
                if (key.prefix === "...") {
                    request.pathInfo = match[i + 1];
                } else {
                    if (key.name) {
                        params[key.name] = match[i + 1] || "";
                    }
                    params[key.i] = match[i + 1] || "";
                }
            });
            return true;
        }
    };
};

exports.Route = function (choices, notFound) {
    return choices.reduceRight(function (next, choice) {
        return function (request, response) {
            if (choice.predicate(request)) {
                return choice.app(request, response);
            } else {
                return next(request, response);
            }
        };
    }, notFound || JAQUE.notFound);
};

var expression = /(?:(::)|(\/?)(:|\*|\.\.\.)(\w*)(\??)|([-[\]{}()*+?.\\^$|,#\s]))/g;
exports.makeRegExp = function (path, keys, insensitive) {
    var i = 0;
    var re = path.replace(expression, function ($0, colon, slash, prefix, name, optional, esc) {
        if (prefix) { // name, slash, optional
            keys.push({ prefix: prefix, name: name, i: i++, optional: !!optional})
            if (prefix === "...") {
                return (
                    "(" +
                        (slash ? "/?" : "") +
                        ".*" +
                    ")"
                );
            } else {
                return (
                    "(?:" +
                        (slash || "") + // "/" or ""
                        (prefix === "*" ? "(.*)" : "([^/]*)") +
                    ")" +
                    (optional || "") // "?" or ""
                );
            }
        } else if (colon) {
            return ":";
        } else {
            return "\\" + $0;
        }
    })
    return new RegExp('^' + re + '$', !insensitive ? '' : 'i');
};

