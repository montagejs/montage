
exports.makeParser = makeParser;
function makeParser(production) {
    return function (text /*, ...args*/) {
        var syntax;
        var column = 0, line = 1;
        var state = production.apply(this, [function (_syntax) {
            syntax = _syntax;
            return expectEof();
        }].concat(Array.prototype.slice.call(arguments, 1)));
        try {
            for (var i = 0; i < text.length; i++) {
                state = state(text[i], {
                    index: i,
                    line: line,
                    column: column
                });
                if (text[i] === "\n") {
                    line++;
                    column = 0;
                } else {
                    column++;
                }
            }
            state = state("", {
                index: i,
                line: line,
                column: column
            });
        } catch (exception) {
            if (exception.loc) {
                var loc = exception.loc;
                if (text.length > 80) {
                    exception.message += " at line " + loc.line + ", column " + loc.column;
                } else {
                    exception.message += " in " + JSON.stringify(text) + " at index " + loc.index;
                }
            }
            throw exception;
        }
        return syntax;
    };
}

exports.expectEof = expectEof;
function expectEof() {
    return function (character, loc) {
        if (character !== "") {
            var error = new Error("Unexpected " + JSON.stringify(character));
            error.loc = loc;
            throw error;
        }
        return function noop() {
            return noop;
        };
    };
}

exports.makeExpect = makeExpect;
function makeExpect(expected) {
    return function (callback, loc) {
        return function (character, loc) {
            if (character === expected) {
                return callback(character, loc);
            } else {
                return callback(null, loc)(character, loc);
            }
        };
    };
}
