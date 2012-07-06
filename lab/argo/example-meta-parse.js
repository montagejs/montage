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

