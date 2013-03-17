
var Montage = require("montage").Montage;

var parse = require("frb/parse");
var stringify = require("frb/stringify");
var evaluate = require("frb/evaluate");

var Selector = exports.Selector = Montage.create(Montage, {

    syntax: {
        value: null
    },

    initWithSyntax: {
        value: function (syntax) {
            this.syntax = syntax;
            return this;
        }
    },

    initWithPath: {
        value: function (path) {
            this.syntax = parse(path);
            return this;
        }
    },

    stringify: {
        value: function () {
            return stringify(this.syntax);
        }
    },

    serializeSelf: {
        value: function (serializer) {
            serializer.setProperty("path", stringify(this.syntax));
        }
    },

    deserializeSelf: {
        value: function (deserializer) {
            this.syntax = parse(deserializer.getProperty("path"));
        }
    },

    evaluate: {
        value: function (value, parameters) {
            return evaluate(this.syntax, value, parameters);
        }
    }

});

// generate methods on Selector for each of the tokens of the language.
// support invocation both as class and instance methods like
// Selector.and("a", "b") and aSelector.and("b")
parse.semantics.precedence.keys().forEach(function (type) {
    Montage.defineProperty(Selector, type, {
        value: function () {
            var args = Array.prototype.map.call(arguments, function (argument) {
                if (typeof argument === "string") {
                    return parse(argument);
                } else if (argument.syntax) {
                    return argument.syntax;
                } else if (typeof argument === "object") {
                    return argument;
                }
            });
            if (this.syntax === null) {
                // invoked as class method
                return this.create().initWithSyntax({
                    type: type,
                    args: args
                });
            } else {
                // invoked as instance method
                return Object.getPrototypeOf(this).create().initWithSyntax({
                    type: type,
                    args: [this.syntax].concat(args)
                });
            }
        }
    });
});

