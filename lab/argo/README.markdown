
ARGO
----

A streaming JSON parser.

```
ARGO.makeWritableStream({
    push(value, index),
    pop(index, lastIndex),
    emit(value, index, lastIndex),
    set(key, index, lastIndex),
    key(key, index, lastIndex),
    advance(character, index),
    newLine(index),
    error(error, index)
}) -> {
    write(string),
    end(string?)
}
```

The returned value is a stream to which you may write the text of a JSON
file in chunks.

-   *write*: sends a chunk of text to the parser.
-   *end*: signals that the end of input has been reached.  Optionally
    receives the last chunk.

Calling *write* or *end* stimulates the following events.  The events
occur on the stack during the *write* or *end* call.  All of the methods
on a handlers object are optional.

-   *push*: called when the beginning of an object or array is
    encoutered.  Receives an empty object or array, respectively, as
    well as the index at which the construct begins.
-   *pop*: called when the end of an object or array is encountered.
    Receives the start and end indicies spanning the construct.
-   *emit*: called when a terminal value is encountered: a string,
    number, or constant.  This will occur both for keys and terminal
    values in object items.
-   *set*: called when an item in an object is finished or a value in an
    array.  Receives the key as an argument.  The corresponding value is
    not implicitly constructed.  If the previous event was an "emit",
    then the value would be the emitted value.  If the previous event
    was a "pop", the value is whatever object or array was previously
    finished.
-   *key*: called when the key for an item in an object is known.  If
    the following event is a "push", the corresponding value is either
    an object or array.  If the following event is an "emit", the
    corresponding value is the emitted value.  Also receives the initial
    and final index of the key.
-   *advance*: called when the read head reaches a character at a
    particular index of the source.
-   *newLine*: called when a new line is encoutered, with the index
    in the source of the beginning of the new line (one more than the
    index of the new line character itself)
-   *error*: called if there is an error in the input stream at the
    given index.  The error is an exception object.  If *error* is
    omitted, exceptions are thrown by *write* or *end*.

## Example, ARGO.parse

`ARGO.parse(string, reviver_opt)` is identical by design to
`JSON.parse(string, reviver_opt)`.  However, it uses a writable JSON
stream internally, with a set of handlers that produces the object
graph.

```javascript
var ARGO = require("./argo");

ARGO.parse = function (string, reviver) {
    var stack = [];
    var at;
    var lineNumber = 1;
    var lineIndex = 0;
    var handlers = {
        push: function (object) {
            stack.push(object);
            at = object;
        },
        pop: function () {
            value = stack.pop();
            at = stack[stack.length - 1];
        },
        set: function (key) {
            if (reviver) {
                value = reviver.call(at, key, value);
            }
            at[key] = value;
        },
        emit: function (_value, index, lastIndex) {
            value = _value;
        },
        newLine: function (index) {
            lineNumber++;
            lineIndex = index;
        },
        error: function (error, index) {
            error.index = index;
            error.lineNumber = lineNumber;
            error.columnNumber = index - lineIndex;
            throw error;
        }
    };
    var stream = ARGO.makeWritableStream(handlers);
    stream.end(string);
    return value;
};

console.log(ARGO.parse('{"a": 10}'));
```

## Example: ARGO.metaParse

This example alternately constructs a syntax tree, noting the
locations and source ranges for every construct.

```javascript
var ARGO = require("./argo");

ARGO.metaParse = function (string, source) {
    var stack = [];
    var at;
    var value;
    var lineNumber = 1;
    var lineIndex = 0;
    var handlers = {
        push: function (object, index) {
            var meta = {
                children: object,
                loc: {
                    start: {
                        line: lineNumber,
                        column: index - lineIndex + 1
                    }
                },
                range: null,
            };
            stack.push(meta);
            at = meta;
        },
        pop: function (index, lastIndex) {
            value = stack.pop();
            value.loc.end = {
                line: lineNumber,
                column: lastIndex - lineIndex
            };
            value.range = [index, lastIndex];
            at = stack[stack.length - 1];
        },
        set: function (key, index) {
            at.children[key] = value;
        },
        emit: function (_value, index, lastIndex) {
            value = {
                loc: {
                    start: {
                        line: lineNumber,
                        column: index - lineIndex + 1
                    },
                    end: {
                        line: lineNumber,
                        column: lastIndex - lineIndex
                    }
                },
                range: [index, lastIndex],
                value: _value
            };
        },
        newLine: function (index) {
            lineNumber++;
            lineIndex = index;
        },
        error: function (error, index) {
            error.index = index;
            error.lineNumber = lineNumber;
            error.columnNumber = index - lineIndex;
            throw error;
        }
    };
    var stream = ARGO.makeWritableStream(handlers);
    stream.end(string);
    return value;
};

console.log(JSON.stringify(
    ARGO.metaParse('{\n\t"a": 10,\n\t"b": [1, 2, 3]\n}'),
    null,
    4
));
```

Output:

```json
{
    "children": {
        "a": {
            "loc": {
                "start": {
                    "line": 2,
                    "column": 7
                },
                "end": {
                    "line": 2,
                    "column": 8
                }
            },
            "range": [
                8,
                10
            ],
            "value": 10
        },
        "b": {
            "children": [
                {
                    "loc": {
                        "start": {
                            "line": 3,
                            "column": 8
                        },
                        "end": {
                            "line": 3,
                            "column": 8
                        }
                    },
                    "range": [
                        19,
                        20
                    ],
                    "value": 1
                },
                {
                    "loc": {
                        "start": {
                            "line": 3,
                            "column": 11
                        },
                        "end": {
                            "line": 3,
                            "column": 11
                        }
                    },
                    "range": [
                        22,
                        23
                    ],
                    "value": 2
                },
                {
                    "loc": {
                        "start": {
                            "line": 3,
                            "column": 14
                        },
                        "end": {
                            "line": 3,
                            "column": 14
                        }
                    },
                    "range": [
                        25,
                        26
                    ],
                    "value": 3
                }
            ],
            "loc": {
                "start": {
                    "line": 3,
                    "column": 7
                },
                "end": {
                    "line": 3,
                    "column": 15
                }
            },
            "range": [
                18,
                27
            ]
        }
    },
    "loc": {
        "start": {
            "line": 1,
            "column": 1
        },
        "end": {
            "line": 4,
            "column": 1
        }
    },
    "range": [
        0,
        29
    ]
}
```

