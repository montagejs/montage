/* <copyright>
Copyright (c) 2012, Motorola Mobility LLC.
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of Motorola Mobility LLC nor the names of its
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */
var Montage = require("montage").Montage;

var Parser = exports.Parser = Montage.create(Montage, {

    newWithLanguage: {
        value: function (language, callback) {
            var self = Montage.create(this);
            self.tokens = [];
            self.state = language.parsePrevious(function (syntax) {
                callback && callback(syntax);
                return language.parseEof();
            });
            return self;
        }
    },

    state: {
        value: null,
        writable: true
    },

    emit: {
        value: function (token) {
            try {
                this.tokens.push(token);
                this.state = this.state(token);
                return this;
            } catch (exception) {
                if (exception instanceof SyntaxError) {
                    throw new SyntaxError(exception.message + ' at ' + this.format());
                } else {
                    throw exception;
                }
            }
        }
    },

    state: {
        value: null,
        writable: true
    },

    syntax: {
        value: null,
        writable: true
    },

    format: {
        value: function () {
            return this.tokens.reduce(function (hither, token) {
                if (token.type === 'literal') {
                    return hither + '(' + JSON.stringify(token.value) + ')';
                } else {
                    return hither + '.' + token.type;
                }
            }, 'Selector');
        }
    }

});
