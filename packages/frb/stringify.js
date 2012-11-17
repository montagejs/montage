"use strict";

var Dict = require("collections/dict");
var parse = require("./parse");

var precedence = parse.semantics.precedence;
var tokenToType = Dict(parse.semantics.operatorTokens);
var typeToToken = Dict(tokenToType.map(function (type, token) {
    return [type, token];
}));

module.exports = stringify;
function stringify(syntax) {
    return stringify.semantics.stringify(syntax);
}

stringify.semantics = {

    stringify: function (syntax, parent) {
        var stringify = this.stringify.bind(this);
        var stringifiers = this.stringifiers;
        var string;
        if (stringifiers[syntax.type]) {
            // operators
            string = stringifiers[syntax.type](syntax, stringify);
        } else {
            // method invocations
            var chain;
            if (syntax.args.length === 1 && syntax.args[0].type === "mapBlock") {
                // map block function calls
                chain = syntax.type + "{" + stringify(syntax.args[0].args[1]) + "}";
                syntax = syntax.args[0];
            } else {
                // normal function calls
                chain = (
                    syntax.type + "(" +
                    syntax.args.slice(1).map(function (child) {
                        return stringify(child);
                    }).join(", ") + ")"
                );
            }
            // left-side if it exists
            if (syntax.args[0].type === "value") {
                string = chain;
            } else {
                string = stringify(syntax.args[0]) + "." + chain;
            }
        }
        // parenthesize if we're going backward in precedence
        if (!parent || precedence.get(parent.type).has(syntax.type)) {
            return string;
        } else {
            return "(" + string + ")";
        }
    },

    stringifiers: {

        value: function (syntax, stringify) {
            return '';
        },

        literal: function (syntax, stringify) {
            if (typeof syntax.value === 'string') {
                return "'" + syntax.value.replace("'", "\\'") + "'";
            } else {
                return "" + syntax.value;
            }
        },

        parameters: function (syntax, stringify) {
            return '$';
        },

        record: function (syntax, stringify) {
            return "{" + Object.map(syntax.args, function (value, key) {
                var string;
                if (value.type === "value") {
                    string = "()";
                } else {
                    string = stringify(value);
                }
                return key + ": " + string;
            }).join(", ") + "}";
        },

        tuple: function (syntax, stringify) {
            return "[" + Object.map(syntax.args, function (value) {
                if (value.type === "value") {
                    return "()";
                } else {
                    return stringify(value);
                }
            }).join(", ") + "]";
        },

        component: function (syntax) {
            return '@' + syntax.label;
        },

        element: function (syntax) {
            return '#' + syntax.id;
        },

        mapBlock: function (syntax, stringify) {
            var chain = 'map{' + stringify(syntax.args[1]) + '}';
            if (syntax.args[0].type === "value") {
                return chain;
            } else {
                return stringify(syntax.args[0]) + '.' + chain;
            }
        },

        filterBlock: function (syntax, stringify) {
            var chain = 'filter{' + stringify(syntax.args[1]) + '}';
            if (syntax.args[0].type === "value") {
                return chain;
            } else {
                return stringify(syntax.args[0]) + '.' + chain;
            }
        },

        sortedBlock: function (syntax, stringify) {
            var chain = 'sorted{' + stringify(syntax.args[1]) + '}';
            if (syntax.args[0].type === "value") {
                return chain;
            } else {
                return stringify(syntax.args[0]) + '.' + chain;
            }
        },

        property: function (syntax, stringify) {
            if (syntax.args[0].type === "value") {
                return syntax.args[1].value;
            } else if (syntax.args[0].type === "parameters") {
                return "$" + syntax.args[1].value;
            } else {
                return stringify(syntax.args[0]) + '.' + syntax.args[1].value;
            }
        },

        get: function (syntax, stringify) {
            var left;
            if (syntax.args[0].type === "value") {
                left = "()";
            } else {
                left = stringify(syntax.args[0])
            }
            return left + "[" + stringify(syntax.args[1]) + "]";
        },

        rangeContent: function (syntax, stringify) {
            var left;
            if (syntax.args[0].type === "value") {
                left = "";
            } else {
                left = stringify(syntax.args[0]) + ".";
            }
            return left + "*";
        },

        mapContent: function (syntax, stringify) {
            var left;
            if (syntax.args[0].type === "value") {
                left = "()";
            } else {
                left = stringify(syntax.args[0])
            }
            return left + "[*]";
        },

        not: function (syntax, stringify) {
            if (syntax.args[0].type === "equals") {
                return (
                    stringify(syntax.args[0].args[0], {type: "equals"}) +
                    " != " +
                    stringify(syntax.args[0].args[1], {type: "equals"})
                );
            } else {
                return '!' + stringify(syntax.args[0], syntax)
            }
        },

        neg: function (syntax, stringify) {
            return '-' + stringify(syntax.args[0], syntax)
        },

        number: function (syntax, stringify) {
            return '+' + stringify(syntax.args[0], syntax)
        }

    }

};

// book a stringifier for all the defined symbolic operators
typeToToken.forEach(function (token, type) {
    stringify.semantics.stringifiers[type] = function (syntax, stringify) {
        return syntax.args.map(function (child) {
            return stringify(child, syntax);
        }).join(" " + token + " ").trim();
    }
});

