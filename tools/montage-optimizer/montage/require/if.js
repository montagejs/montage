/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/*global bootstrap */

(function (definition) {
    // loaded as a <script> during bootstrapping
    if (typeof bootstrap !== "undefined") {
        bootstrap("require/if", function (require, exports, module) {
            definition(require("require/require"));
        });
    // NodeJS, CommonJS
    } else if (typeof require !== "undefined") {
        // augment and export the require module
        module.exports = require("./require");
        definition(module.exports);
    }
})(function (Require) {

var array_slice = Array.prototype.slice;
var object_owns = Object.prototype.hasOwnProperty;

// tokenizer

var tokens = {
    "\\(": "(",
    "\\)": ")",
    "\\bin\\b": "in", // contextual keyword, also serves as a value
    "[\\w\\d]+": "value",
    "\\.": ".",
    ",": ",",
    "=": "=",
    " +": "whiteSpace", // newlines are illegal
    ".": "error"
};

var tokenNames = [];
var tokenRe = new RegExp(Object.keys(tokens).map(function (token, index) {
    tokenNames[index] = tokens[token];
    return "(" + token + ")";
}).join("|"), "g");

var tokenize = function (string, emit, fileName) {
    string.replace(tokenRe, function () {
        var position = arguments[arguments.length - 2];
        var patterns = array_slice.call(arguments, 1, arguments.length - 2);
        for (var i = 0; i < tokenNames.length; i++) {
            if (patterns[i] !== void 0) {
                var tokenName = tokenNames[i];
                if (tokenName === "whiteSpace") {
                    // ignored
                } else if (tokenName === "error") {
                    throw new Error(
                        "Unrecognized token " +
                        JSON.stringify(patterns[i]) +
                        " at position " + position +
                        " of " + JSON.stringify(string) +
                        " in " + fileName
                    );
                } else {
                    emit({
                        type: tokenName,
                        value: patterns[i],
                        position: position,
                        fileName: fileName,
                        string: string
                    });
                }
                return;
            }
        }
    });
    emit({
        type: "eof",
        value: "eof",
        position: string.length,
        fileName: fileName,
        string: string
    });
};

// parser makers

var makeOptionalParser = function (optionalTypes) {
    return function (callback) {
        return function (token) {
            if (optionalTypes.indexOf(token.type) !== -1) {
                return callback(true, function rewind(parse) {
                    return parse(token);
                }, token);
            } else {
                return callback(false, function rewind(parse) {
                    return parse;
                }, token)(token);
            }
        }
    };
};

var makeExpectedParser = function (expectedTypes) {
    return function (callback) {
        return function (token) {
            if (expectedTypes.indexOf(token.type) === -1) {
                throw new Error(
                    "Expected one of " + JSON.stringify(expectedTypes) +
                    " at position " + token.position +
                    " of " + JSON.stringify(token.string) +
                    " in " + JSON.stringify(token.fileName) + "." +
                    " Got " + JSON.stringify(token.type) +
                    ": " + JSON.stringify(token.value)
                );
            } else {
                return callback(token);
            }
        };
    };
};

var makeLeftToRightParser = function (types, parsePrevious) {
    var parseOperator = makeOptionalParser(types);
    var parseSelf = function (callback, left) {
        if (left) {
            return parseOperator(function (found, rewind, token) {
                if (found) {
                    return parsePrevious(function (right) {
                        return parseSelf(callback, {
                            type: token.type,
                            args: [left, right]
                        });
                    });
                } else {
                    return rewind(callback(left));
                }
            });
        } else {
            return parsePrevious(function (left) {
                return parseSelf(callback, left);
            });
        }
    };
    return parseSelf;
};

// primary parsers

var expectValue = makeExpectedParser(["value", "in"]);
var optionalBegin = makeOptionalParser(["("]);
var expectedEnd = makeExpectedParser([")"]);
var optionalComma = makeOptionalParser([","]);

var parsePrimaryValue = function (callback) {
    return expectValue(function (token) {
        if (token.type === "value") {
            return callback({
                type: "value",
                value: token.value
            });
        } else { // contextual keywords in identifier position
            return callback({
                type: "value",
                value: token.type
            });
        }
    });
};

var parseArray = function (callback, array) {
    array = array || [];
    return parsePrimaryValue(function (value) { // non-recursive
        array.push(value);
        return optionalComma(function (found, rewind) {
            if (found) {
                return parseArray(callback, array);
            } else {
                return rewind(callback({
                    type: "array",
                    value: array
                }));
            }
        });
    });
};

var parseValue = function (callback) {
    return optionalBegin(function (found, rewind) {
        if (found) {
            return parseArray(function (array) {
                return expectedEnd(function () {
                    return callback(array);
                });
            });
        } else {
            return rewind(parsePrimaryValue(callback));
        }
    });
};

var parseIdentifier = makeLeftToRightParser(["."], parseValue);

var parseEof = makeExpectedParser(["eof"]);

// begin table of precedence

var precedence = function (makeParser) {
    parsePrevious = makeParser(parsePrevious);
};

var parsePrevious;

precedence(function () {
    var expectOperator = makeExpectedParser(["=", "in"]);
    return function (callback) {
        return parseIdentifier(function (identifier) {
            return expectOperator(function (token) {
                return parseValue(function (value) {
                    return callback({
                        type: token.type,
                        args: [identifier, value]
                    });
                });
            });
        });
    };
});

// parenthetical expressions
precedence(function (parsePrevious) {
    return function (callback) {
        return optionalBegin(function (found, rewind) {
            if (found) {
                return parseLanguage(function (term) {
                    return expectedEnd(function () {
                        return callback(term);
                    });
                });
            } else {
                return rewind(parsePrevious(callback));
            }
        });
    };
});

// adjacency means &&
precedence(function (parsePrevious) {
    var parseSelf = function (callback, left) {
        if (left) {
            // lookahead for identifier
            return function (token) {
                if (token.type === "value" || token.type === "or") {
                    return parsePrevious(function (right) {
                        return callback({
                            type: "",
                            args: [left, right]
                        })
                    })(token);
                } else {
                    return callback(left)(token);
                }
            };
        } else {
            return parsePrevious(function (left) {
                return parseSelf(callback, left);
            });
        }
    };
    return parseSelf;
});

// delimited by commas means ||
precedence(function (parsePrevious) {
    return makeLeftToRightParser([","], parsePrevious);
});

// the initial state of the parser, and the re-entry state of paranthetical
// expressions
var parseLanguage = parsePrevious;

// parser

var parse = function (string, fileName) {
    var _syntax;
    // capture the completion value
    var parse = parseLanguage(function (syntax) {
        _syntax = syntax;
        return parseEof;
    });
    // functional state machine
    tokenize(string, function (token) {
        parse = parse(token);
    });
    return _syntax;
};

Require.parsePackageCondition = parse;

// javascript codegen

var generateJavascriptIdentifierTerm = function (syntax, from) {
    if (syntax.type === "value") {
        return from + "[" + JSON.stringify(syntax.value) + "]";
    } else if (syntax.type === ".") {
        return generateJavascriptIdentifierTerm(
            syntax.args[1],
            generateJavascriptIdentifierTerm(syntax.args[0], from)
        );
    }
};

var generateJavascriptIdentifier = function (syntax) {
    return generateJavascriptIdentifierTerm(syntax, "\"\"+config");
};

var generateJavascriptValue = function (syntax) {
    if (syntax.type === "value") {
        return JSON.stringify(syntax.value);
    } else if (syntax.type === "array") {
        return (
            "[" +
            syntax.value.map(generateJavascriptValue).join(", ") +
            "]"
        );
    } else {
        throw new Error("Assertion error");
    }
};

var javascriptOperators = {
    "=": "==="
};

var javascriptConjunctions = {
    "": "&&",
    ",": "||"
};

var javascriptGenerators = {
    "in": function (left, right) {
        return (
            generateJavascriptValue(right) +
            ".indexOf(" +
            generateJavascriptIdentifier(left) +
            ") !== -1"
        );
    }
};

var generateJavascript = function (syntax) {
    if (object_owns.call(javascriptGenerators, syntax.type)) {
        return javascriptGenerators[syntax.type].apply(null, syntax.args);
    } else if (object_owns.call(javascriptOperators, syntax.type)) {
        return generateJavascriptIdentifier(syntax.args[0]) + " " + javascriptOperators[syntax.type] + " " + generateJavascriptValue(syntax.args[1]);
    } else if (object_owns.call(javascriptConjunctions, syntax.type)) {
        return "(" + generateJavascript(syntax.args[0]) + " " + javascriptConjunctions[syntax.type] + " " + generateJavascript(syntax.args[1]) + ")";
    } else {
        throw new Error("Assertion error: " + syntax.type);
    }
};

Require.generatePackageCondition = generateJavascript;

// compiler

var compile = function (string, fileName) {
    var syntax = parse(string, fileName);
    return generateJavascript(syntax);
};

Require.compilePackageCondition = compile;

// generate package.json.load.js

var compilePackageDescriptionFunctionBody = function (description, fileName, prefix) {
    prefix = prefix || "";
    var parts = [];
    if (description["if"]) {
        var program = description["if"];
        delete description["if"];
        Object.keys(program).forEach(function (condition) {
            var patch = program[condition];
            var code = compile(condition, fileName);
            parts.push(
                prefix + 'if (' + code + ') {\n' +
                compilePackageDescriptionFunctionBody(patch, fileName, prefix + "    ") +
                prefix + '}\n'
            );
        });
    }
    parts.unshift(
        prefix + 'patches.push(' + JSON.stringify(description) + ')\n'
    );
    return parts.join('');
};

var preamble = [
    'var patches = []\n'
];
var prolog = [
    'var description = patches.shift();\n',
    'patches.forEach(function (patch) {\n',
    '    merge(description, patch);\n',
    '});\n',
];

var compilePackageDescriptionFunction = function (description, fileName, prefix) {
    prefix = prefix || "";
    var body = compilePackageDescriptionFunctionBody(description, fileName, prefix);
    return preamble.map(function (line) {
        return prefix + line;
    }).join("") + body + prolog.map(function (line) {
        return prefix + line;
    }).join("");
};

Require.compilePackageDescriptionFunction = compilePackageDescriptionFunction;

// run-time

var collapsePackageDescription = function (description, config, fileName) {
    var code = compilePackageDescriptionFunction(description, fileName);
    return new Function("config", "merge", code + ";return description")(config, Require.merge);
};

Require.collapsePackageDescription = collapsePackageDescription;

});
