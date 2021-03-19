"use strict";

var parse = require("./parse");
var precedence = require("./language").precedence;
var typeToToken = require("./language").operatorTypes;
var tokenToType = require("./language").operatorTokens;

module.exports = stringify;
function stringify(syntax, scope) {
    return stringify.semantics.stringify(syntax, scope);
}

function makeBlockStringifier(type) {
    return function (syntax, scope, stringifier) {
        var chain = type + '{' + stringifier.stringify(syntax.args[1], scope) + '}';
        if (syntax.args[0].type === "value") {
            return chain;
        } else {
            return stringifier.stringify(syntax.args[0], scope) + '.' + chain;
        }
    };
}

stringify.semantics = {

    makeBlockStringifier: makeBlockStringifier,

    stringifyChild: function stringifyChild(child, scope) {
        var arg = this.stringify(child, scope);
        if (!arg) return "this";
        return arg;
    },

    stringify: function (syntax, scope, parent) {
        var stringifiers = this.stringifiers,
            string,
            i, countI, args;

        if (stringifiers[syntax.type]) {
            // operators
            string = stringifiers[syntax.type](syntax, scope, this);
        } else if (syntax.inline) {
            // inline invocations
            string = "&";
            string += syntax.type;
            string += "(";

            args = syntax.args;
            for(i=0, countI = args.length;i<countI;i++) {
                string += i > 0 ? ", " : "";
                string += this.stringifyChild(args[i],scope);
            }
            string += ")";

        } else {
            // method invocations
            var chain;
            if (syntax.args.length === 1 && syntax.args[0].type === "mapBlock") {
                // map block function calls
                chain = syntax.type + "{" + this.stringify(syntax.args[0].args[1], scope) + "}";
                syntax = syntax.args[0];
            } else {
                // normal function calls
                chain = syntax.type;
                chain += "(";

                args = syntax.args;
                for(i=1, countI = args.length;i<countI;i++) {
                    chain += i > 1 ? ", " : "";
                    chain += this.stringifyChild(args[i],scope);
                }
                chain += ")";
            }
            // left-side if it exists
            if (syntax.args[0].type === "value") {
                string = chain;
            } else {
                string = this.stringify(syntax.args[0], scope) + "." + chain;
            }
        }
        // parenthesize if we're going backward in precedence
        if (
            !parent ||
            (parent.type === syntax.type && parent.type !== "if") ||
            // TODO check on weirdness of "if"
            precedence.get(parent.type).has(syntax.type)
        ) {
            return string;
        } else {
            return "(" + string + ")";
        }
    },

    stringifiers: {

        value: function (syntax, scope, stringifier) {
            return '';
        },

        literal: function (syntax, scope, stringify) {
            if (typeof syntax.value === 'string') {
                return "'" + syntax.value.replace("'", "\\'") + "'";
            } else {
                return "" + syntax.value;
            }
        },

        parameters: function (syntax, scope, stringifier) {
            return '$';
        },

        record: function (syntax, scope, stringifier) {
            return "{" + Object.map(syntax.args, function (value, key) {
                var string;
                if (value.type === "value") {
                    string = "this";
                } else {
                    string = stringifier.stringify(value, scope);
                }
                return key + ": " + string;
            }).join(", ") + "}";
        },

        tuple: function (syntax, scope, stringifier) {
            return "[" + Object.map(syntax.args, function (value) {
                if (value.type === "value") {
                    return "this";
                } else {
                    return stringifier.stringify(value);
                }
            }).join(", ") + "]";
        },

        component: function (syntax, scope) {
            var label;
            if (scope && scope.components && syntax.component) {
                if (scope.components.getObjectLabel) {
                    label = scope.components.getObjectLabel(syntax.component);
                } else if (scope.components.getLabelForObject) {
                    // I am hoping that we will change Montage to use this API
                    // for consistency with document.getElementById,
                    // components.getObjectByLabel, & al
                    label = scope.components.getLabelForObject(syntax.component);
                }
            } else {
                label = syntax.label;
            }
            return '@' + label;
        },

        element: function (syntax) {
            return '#' + syntax.id;
        },

        mapBlock: makeBlockStringifier("map"),
        filterBlock: makeBlockStringifier("filter"),
        someBlock: makeBlockStringifier("some"),
        everyBlock: makeBlockStringifier("every"),
        sortedBlock: makeBlockStringifier("sorted"),
        sortedSetBlock: makeBlockStringifier("sortedSet"),
        groupBlock: makeBlockStringifier("group"),
        groupMapBlock: makeBlockStringifier("groupMap"),
        minBlock: makeBlockStringifier("min"),
        maxBlock: makeBlockStringifier("max"),

        property: function (syntax, scope, stringifier) {
            if (syntax.args[0].type === "value") {
                if (typeof syntax.args[1].value === "string") {
                    return syntax.args[1].value;
                } else if (syntax.args[1].type === "literal") {
                    return "." + syntax.args[1].value;
                } else {
                    return "this[" + stringifier.stringify(syntax.args[1], scope) + "]";
                }
            } else if (syntax.args[0].type === "parameters") {
                return "$" + syntax.args[1].value;
            } else if (
                syntax.args[1].type === "literal" &&
                /^[\w\d_]+$/.test(syntax.args[1].value)
            ) {
                return stringifier.stringify(syntax.args[0], scope, {
                    type: "scope"
                }) + '.' + syntax.args[1].value;
            } else {
                return stringifier.stringify(syntax.args[0], {
                    type: "scope"
                }, scope) + '[' + stringifier.stringify(syntax.args[1], scope) + ']';
            }
        },

        "with": function (syntax, scope, stringifier) {
            var right = stringifier.stringify(syntax.args[1], scope, syntax);
            return stringifier.stringify(syntax.args[0], scope) + "." + right;
        },

        not: function (syntax, scope, stringifier) {
            if (syntax.args[0].type === "equals") {
                return (
                    stringifier.stringify(syntax.args[0].args[0], scope, {type: "equals"}) +
                    " != " +
                    stringifier.stringify(syntax.args[0].args[1], scope, {type: "equals"})
                );
            } else {
                return '!' + stringifier.stringify(syntax.args[0], scope, syntax)
            }
        },

        neg: function (syntax, scope, stringifier) {
            return '-' + stringifier.stringify(syntax.args[0], scope, syntax)
        },

        toNumber: function (syntax, scope, stringifier) {
            return '+' + stringifier.stringify(syntax.args[0], scope, syntax)
        },

        parent: function (syntax, scope, stringifier) {
            return '^' + stringifier.stringify(syntax.args[0], scope, syntax)
        },

        if: function (syntax, scope, stringifier) {
            return (
                stringifier.stringify(syntax.args[0], scope, syntax) + " ? " +
                stringifier.stringify(syntax.args[1], scope) + " : " +
                stringifier.stringify(syntax.args[2], scope)
            );
        },

        event: function (syntax, scope, stringifier) {
            return syntax.when + " " + syntax.event + " -> " + stringifier.stringify(syntax.listener, scope);
        },

        binding: function (arrow, syntax, scope, stringifier) {

            var header = stringifier.stringify(syntax.args[0], scope) + " " + arrow + " " + stringifier.stringify(syntax.args[1], scope);
            var trailer = "";

            var descriptor = syntax.descriptor;
            if (descriptor) {
                for (var name in descriptor) {
                    trailer += ", " + name + ": " + stringifier.stringify(descriptor[name], scope);
                }
            }

            return header + trailer;
        },

        bind: function (syntax, scope, stringifier) {
            return this.binding("<-", syntax, scope, stringifier);
        },

        bind2: function (syntax, scope, stringifier) {
            return this.binding("<->", syntax, scope, stringifier);
        },

        assign: function (syntax, scope, stringifier) {
            return stringifier.stringify(syntax.args[0], scope) + ": " + stringifier.stringify(syntax.args[1], scope);
        },

        block: function (syntax, scope, stringifier) {
            var header = "@" + syntax.label;
            if (syntax.connection) {
                if (syntax.connection === "prototype") {
                    header += " < ";
                } else if (syntax.connection === "object") {
                    header += " : ";
                }
                header += stringifier.stringify({type: 'literal', value: syntax.module});
                if (syntax.exports && syntax.exports.type !== "value") {
                    header += " " + stringifier.stringify(syntax.exports, scope);
                }
            }
            return header + " {\n" + syntax.statements.map(function (statement) {
                return "    " + stringifier.stringify(statement, scope) + ";\n";
            }).join("") + "}\n";
        },

        sheet: function (syntax, scope, stringifier) {
            return "\n" + syntax.blocks.map(function (block) {
                return stringifier.stringify(block, scope);
            }).join("\n") + "\n";
        }

    }

};

// book a stringifier for all the defined symbolic operators
typeToToken.forEach(function (token, type) {
    stringify.semantics.stringifiers[type] = function (syntax, scope, stringifier) {

        var args = syntax.args,
            i, countI, result = "";
        for(i = 0, countI = args.length;i<countI;i++) {
            if(i > 0) {
                result += " ";
                result += token;
                result += " ";
            }
            result += stringifier.stringify(args[i],scope, syntax);
        }

        return result.trim();
    }
});

