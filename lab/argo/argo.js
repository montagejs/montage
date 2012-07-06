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
(function () {

// parses JSON, producing an event stream consisting of "advance", "push",
// "pop", "set", and "emit" messages on a handlers object.
// internally, the state of the parser is modeled as a function that will
// accept the next character from the stream and return the new state.
var makeWritableStream = function (handlers) {
    var index = 0;
    handlers.error = handlers.error || function (error) {
        throw error;
    };
    var advance = parseLanguage(function () {
        return skipWhitespace(function () {
            return expectedEof(handlers);
        }, handlers);
    }, handlers);
    return {
        write: function (string) {
            for (var i = 0; i < string.length; i++, index++) {
                handlers.advance && handlers.advance(string[i], index);
                advance = advance(string[i], index);
            }
            return this;
        },
        end: function (string) {
            if (string) {
                this.write(string);
            }
            handlers.advance && handlers.advance("", index);
            advance("", index);
            return this;
        }
    }
};

var expectedEof = function (handlers) {
    return function (character, index) {
        if (character !== "") {
            handlers.error(new Error(
                "Expected end of input at " + index + ".  " +
                "Got " + JSON.stringify(character)
            ), index);
        }
        return expectedEof(handlers);
    };
};

var WHITE_SPACE = " \r\n\t";
var skipWhitespace = function (callback, handlers) {
    return function (character, index) {
        // EOF
        if (character === "") {
            return callback()(character, index);
        } else if (character === "\n") {
            handlers.newLine && handlers.newLine(index + 1);
            return skipWhitespace(callback, handlers);
        } else if (WHITE_SPACE.indexOf(character) !== -1) {
            return skipWhitespace(callback, handlers);
        } else {
            return callback()(character, index);
        }
    };
};

// expect the given character
var expected = function (expectedCharacter, callback, handlers) {
    return skipWhitespace(function () {
        return function (character, index) {
            if (character !== expectedCharacter) {
                handlers.error(new Error(
                    "Expected " + JSON.stringify(expectedCharacter) +
                    " at " + index + ".  " +
                    "Got " + JSON.stringify(character) + "."
                ), index);
            } else {
                return callback(index);
            }
        };
    }, handlers);
};

// expect a word break between word tokens like
var expectedBreak = function (callback, handlers) {
    return function (character, index) {
        if (/\w/.test(character)) {
            handlers.error(new Error(
                "Expected word break at " +
                index + ". " +
                "Got " + JSON.stringify(character)
            ), index);
        } else {
            return callback(index)(character, index);
        }
    };
};

// strings

// parses [0-9a-fA-F]
var HEX_DIGITS = "0123456789abcdefABCDEF";
var parseHexDigit = function (callback, handlers) {
    return function (character, index) {
        character = character.toLowerCase();
        if (character === "" || HEX_DIGITS.indexOf(character) === -1) {
            handlers.error(new Error(
                "Expected hex digit at " + index + ".  " +
                "Got " + JSON.stringify(character) + "."
            ), index);
        } else {
            return callback(character, index);
        }
    };
};

// parses \\([\\/bfnrtc]|u\d{4})
var parseStringEscape = function (callback, handlers, characters) {
    return function (character, index) {
        if (character === "\"") {
            characters.push("\"");
            return parseStringBody(callback, handlers, characters);
        } else if (character === "\\") {
            characters.push("\\");
            return parseStringBody(callback, handlers, characters);
        } else if (character === "\/") {
            characters.push("\/");
            return parseStringBody(callback, handlers, characters);
        } else if (character === "b") {
            characters.push("\b");
            return parseStringBody(callback, handlers, characters);
        } else if (character === "f") {
            characters.push("\f");
            return parseStringBody(callback, handlers, characters);
        } else if (character === "n") {
            characters.push("\n");
            return parseStringBody(callback, handlers, characters);
        } else if (character === "r") {
            characters.push("\r");
            return parseStringBody(callback, handlers, characters);
        } else if (character === "t") {
            characters.push("\t");
            return parseStringBody(callback, handlers, characters);
        } else if (character === "u") {
            return parseHexDigit(function (a) {
                return parseHexDigit(function (b) {
                    return parseHexDigit(function (c) {
                        return parseHexDigit(function (d) {
                            characters.push(String.fromCharCode(parseInt(
                                a + b + c + d,
                                16
                            )));
                            return parseStringBody(
                                callback,
                                handlers,
                                characters
                            );
                        }, handlers);
                    }, handlers);
                }, handlers);
            }, handlers);
        } else {
            handlers.error(new Error(
                "Expected string escape code at " + index + ".  " +
                "Got " + JSON.stringify(character) + "."
            ));
        }
    };
};

// parses string excluding quotes
var parseStringBody = function (callback, handlers, characters) {
    characters = characters || [];
    return function (character, index) {
        var code = character.charCodeAt();
        if (code < 32) {
            handlers.error(new Error(
                "Strings cannot contain control codes at " + index + ".  " +
                "Got char code " + code + "."
            ), index);
        } else if (character === "\\") {
            return parseStringEscape(callback, handlers, characters);
        } else if (character === "\"") {
            return callback(characters.join(""))(character, index);
        } else {
            characters.push(character);
            return parseStringBody(callback, handlers, characters);
        }
    };
};

// parses string including quotes
var parseString = function (callback, handlers) {
    return expected("\"", function (index) {
        return parseStringBody(function (string) {
            return expected("\"", function (lastIndex) {
                handlers.emit && handlers.emit(string, index, lastIndex + 1);
                return callback(string, index, lastIndex + 1);
            });
        });
    }, handlers);
};

// numbers

var DIGITS = "0123456789";

// parses \d*
var accumulateDigits = function (callback, digits) {
    return function (character, index) {
        if (character === "" || DIGITS.indexOf(character) === -1) {
            return callback(digits, index, index)(character, index);
        } else {
            digits.push(character);
            return accumulateDigits(function (digits, ignore, lastIndex) {
                return callback(digits, index, lastIndex);
            }, digits);
        }
    }
};

// parses \d+
var parseDigits = function (callback) {
    return function (character, index) {
        if (character === "" || DIGITS.indexOf(character) === -1) {
            handlers.error(new Error(
                "Expected digits at " + index + ".  " +
                "Got " + JSON.stringify(character) + "."
            ), index);
        } else {
            return accumulateDigits(function (digits, ignore, lastIndex) {
                return callback(digits.join(""), index, lastIndex);
            }, [character]);
        }
    }
};

// parses (e[+-]?\d+)?
var parseExponent = function (callback, handlers) {
    return function (character, firstIndex) {
        if (character.toLowerCase() === "e") {
            return function (character, index) {
                if (character === "+") {
                    return parseDigits(function (digits, ignore, lastIndex) {
                        return callback("e+" + digits, firstIndex, lastIndex);
                    }, handlers);
                } else if (character === "-") {
                    return parseDigits(function (digits, ignore, lastIndex) {
                        return callback("e-" + digits, firstIndex, lastIndex);
                    }, handlers);
                } else {
                    return parseDigits(function (digits, ignore, lastIndex) {
                        return callback("e" + digits, firstIndex, lastIndex);
                    }, handlers)(character, index);
                }
            };
        } else {
            return callback("", firstIndex, firstIndex)(character, firstIndex);
        }
    }
};

// parses (\.\d+)? <exponent>?
var parseFractionExponent = function (callback, handlers) {
    return function (character, index) {
        if (character === ".") {
            return parseDigits(function (fraction) {
                return parseExponent(function (exponent, ignore, lastIndex) {
                    return callback("." + fraction + exponent, index, lastIndex);
                }, handlers);
            }, handlers);
        } else {
            return parseExponent(function (exponent, ignore, lastIndex) {
                return callback(exponent, index, lastIndex);
            }, handlers)(character, index);
        }
    };
};

// parses [1-9][0-9]+ <fraction>? <exponent>?
var parsePositiveNumber = function (callback, handlers) {
    return function (character, index) {
        if (character === "0") {
            return parseFractionExponent(function (
                fractionExponent,
                ignore,
                lastIndex
            ) {
                // look-ahead for a better error message if necessary
                return function (character, aheadIndex) {
                    if (/\d/.test(character)) {
                        handlers.error(new Error(
                            "Numbers cannot be prefixed with 0 in JSON " +
                            "at " + aheadIndex
                        ), aheadIndex);
                    } else {
                        return callback(
                            +("0" + fractionExponent),
                            index,
                            lastIndex
                        )(character, index);
                    }
                };
            }, handlers);
        } else {
            return parseDigits(function (digits) {
                return parseFractionExponent(function (
                    fractionExponent,
                    ignore,
                    lastIndex
                ) {
                    return callback(
                        +(digits + fractionExponent),
                        index,
                        lastIndex
                    );
                }, handlers);
            }, handlers)(character, index);
        }
    };
};

// parses [-]? <positive-number>
var parseNumber = function (callback, handlers) {
    return function (character, index) {
        if (character === "-") {
            return parsePositiveNumber(function (number, ignore, lastIndex) {
                handlers.emit && handlers.emit(-number, index, lastIndex);
                return callback(index, lastIndex);
            }, handlers);
        } else {
            return parsePositiveNumber(function (number, ignore, lastIndex) {
                handlers.emit && handlers.emit(number, index, lastIndex);
                return callback(index, lastIndex);
            }, handlers)(character, index);
        }
    };
};

// arrays

// parses: <value> ( "," <value> )*
var parseArrayBody = function (callback, handlers, arrayIndex) {
    return parseValue(function (index, lastIndex) {
        handlers.set && handlers.set(arrayIndex, index, lastIndex);
        return skipWhitespace(function () {
            return function (character, index) {
                if (character === "]") {
                    return callback()(character, index);
                } else if (character === ",") {
                    return parseArrayBody(
                        callback,
                        handlers,
                        arrayIndex + 1
                    );
                } else {
                    handlers.error(new Error(
                        "Expected \"]\" or \",\" at " + index + ".  " +
                        "Got " + JSON.stringify(character) + "."
                    ), index);
                }
            };
        }, handlers);
    }, handlers);
};

// parses: "[" <value>* "]"
var parseArray = function (callback, handlers) {
    return expected("[", function (index) {
        handlers.push && handlers.push([], index);
        return skipWhitespace(function () {
            return function (character, lastIndex) {
                if (character === "]") {
                    handlers.pop && handlers.pop(index, lastIndex + 1);
                    return callback();
                } else {
                    return parseArrayBody(function () {
                        return expected("]", function (lastIndex) {
                            handlers.pop && handlers.pop(index, lastIndex + 1);
                            return callback();
                        });
                    }, handlers, 0)(character, lastIndex);
                }
            };
        }, handlers);
    }, handlers);
};

// objects

// parses: <key> : <value>
var parsePair = function (callback, handlers) {
    return parseString(function (key, index, lastIndex) {
        handlers.key && handlers.key(key, index, lastIndex);
        return expected(":", function () {
            return parseValue(function (ignore, lastIndex) {
                handlers.set && handlers.set(key, index, lastIndex);
                return callback();
            }, handlers);
        }, handlers);
    }, handlers);
};

// parses: <pair> ( "," <pair> ) *
var parseObjectBody = function (callback, handlers) {
    return parsePair(function (pair) {
        return skipWhitespace(function () {
            return function (character, index) {
                if (character === "}") {
                    return callback()(character, index);
                } else if (character === ",") {
                    return parseObjectBody(callback, handlers);
                } else {
                    handlers.error(new Error(
                        "Expected \"}\" or \",\" at " + index + ".  " +
                        "Got " + JSON.stringify(character) + "."
                    ), index);
                }
            };
        }, handlers);
    }, handlers);
};

// parses: "{" [ <pair> ( "," <pair> )* ] "}"
var parseObject = function (callback, handlers) {
    return expected("{", function (index) {
        handlers.push && handlers.push({}, index);
        return skipWhitespace(function () {
            return function (character, lastIndex) {
                if (character === "}") {
                    handlers.pop && handlers.pop(index, lastIndex + 1);
                    return callback(index, lastIndex + 1);
                } else {
                    return parseObjectBody(function () {
                        return expected("}", function (lastIndex) {
                            handlers.pop && handlers.pop(index, lastIndex + 1);
                            return callback(index, lastIndex + 1);
                        });
                    }, handlers)(character, lastIndex);
                }
            };
        }, handlers);
    }, handlers);
};

// parses: <object> | <array> | <number> | "true" | "false" | "null"
var parseValue = function (callback, handlers) {
    return skipWhitespace(function () {
        return function (character, index) {
            if (character === "{") {
                return parseObject(callback, handlers)(character, index);
            } else if (character === "[") {
                return parseArray(callback, handlers)(character, index);
            // numbers
            // constants
            } else if (character === "\"") {
                return parseString(callback, handlers)(character, index);
            } else if (character !== "" && "-0123456789".indexOf(character) !== -1 ){
                return parseNumber(callback, handlers)(character, index);
            } else if (character === "t") {
                return expected("r", function () {
                    return expected("u", function () {
                        return expected("e", function () {
                            return expectedBreak(function () {
                                handlers.emit && handlers.emit(true, index, index + 4);
                                return callback(index, index + 4);
                            }, handlers);
                        }, handlers);
                    }, handlers);
                }, handlers);
            } else if (character === "f") {
                return expected("a", function () {
                    return expected("l", function () {
                        return expected("s", function () {
                            return expected("e", function () {
                                return expectedBreak(function () {
                                    handlers.emit && handlers.emit(false, index, index + 5);
                                    return callback(index, index + 5);
                                }, handlers);
                            }, handlers);
                        }, handlers);
                    }, handlers);
                }, handlers);
            } else if (character === "n") {
                return expected("u", function () {
                    return expected("l", function () {
                        return expected("l", function () {
                            return expectedBreak(function () {
                                handlers.emit && handlers.emit(null, index, index + 4);
                                return callback(index, index + 4);
                            }, handlers);
                        }, handlers);
                    }, handlers);
                }, handlers);
            } else {
                handlers.error(new Error(
                    "Expected value at " + index + ".  " +
                    "Got " + JSON.stringify(character) + "."
                ), index);
            }
        };
    }, handlers);
    return accumulate;
};

// language

var parseLanguage = parseValue;

// returns a stream object that handles all handlers events by making a
// JavaScript value
var makeMaker = function (reviver) {
    return {
        stack: [],
        at: null,
        lineNumber: 1,
        lineIndex: 0,
        push: function (object) {
            this.stack.push(object);
            this.at = object;
            this.log && this.log("PUSH", this.stack, this.at, this.value);
        },
        pop: function () {
            this.value = this.stack.pop();
            this.at = this.stack[this.stack.length - 1];
            this.log && this.log("POP", this.stack, this.at, this.value);
        },
        set: function (key) {
            var value = this.value;
            if (reviver) {
                value = reviver.call(this.at, key, value);
            }
            this.at[key] = value;
            this.log && this.log("SET", this.stack, this.at, this.value);
        },
        emit: function (value, index, lastIndex) {
            this.value = value;
            this.log && this.log("EMIT", JSON.stringify(value), index + '-' + lastIndex);
        },
        newLine: function (index) {
            this.lineNumber++;
            this.lineIndex = index;
            this.log && this.log("NEW LINE", this.lineNumber, index);
        },
        error: function (error, index) {
            error.index = index;
            error.lineNumber = this.lineNumber;
            error.columnNumber = index - this.lineIndex;
            throw error;
        }
    };
};

// parses JSON and returns the corresponding value
var parse = function (string, reviver) {
    var maker = makeMaker(reviver);
    var stream = makeWritableStream(maker);
    stream.end(string);
    return maker.value;
};

var interface;
if (typeof exports !== "undefined") {
    interface = exports;
} else {
    interface = ARGO = {};
}

interface.parse = parse;
interface.makeWritableStream = makeWritableStream;

})();
