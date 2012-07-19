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

var AbstractSemantics = exports.AbstractSemantics = Montage.create(Montage, {

    create: {
        value: function (prototype, descriptor) {
            var self = Montage.create(prototype, descriptor);

            var operators = self.operators;
            self.evaluatorArgumentLengths = {};

            // convert the declared operators into evaluators
            Object.keys(operators).forEach(function (name) {
                var operate = operators[name];
                self.evaluators[name] = function () { // ...args
                    var args = Array.prototype.slice.call(
                        arguments,
                        0,
                        operate.length
                    );
                    return function (value, parameters, visitor) {
                        return operate.apply(
                            operators,
                            args.map(function (argument) {
                                return argument(value, parameters, visitor);
                            })
                        );
                    };
                };
                self.evaluatorArgumentLengths[name] = operate.length;
            });

            return self;
        }
    },

    evaluatorArgumentLengths: {
        value: null
    },

    compile: {
        value: function (syntax, parents) {
            var self = this;
            parents = {
                syntax: syntax,
                parents: parents
            };
            if (syntax.type === 'value') {
                return function (value) {
                    return value;
                };
            } else if (syntax.type === 'parameters') {
                return function (value, parameters) {
                    return parameters;
                };
            } else if (syntax.type === 'literal') {
                return function () {
                    return syntax.value;
                };
            } else if (self.evaluators[syntax.type]) {
                var evaluator = self.evaluators[syntax.type];
                var length =
                    self.evaluatorArgumentLengths[syntax.type] ||
                        evaluator.length;
                var args = syntax.args.map(function (child) {
                    return self.compile(child, parents);
                });
                if (syntax.insensitive) {
                    args = args.map(function (evaluate) {
                        return function (value, parameters, visitor) {
                            return evaluate.call(
                                self,
                                value,
                                parameters,
                                visitor
                            ).toLowerCase();
                        };
                    })
                }
                return evaluator.apply(self, args.concat([parents]));
            } else {
                throw new Error("Unknown evaluator " + syntax.type);
            }
        }
    },

    evaluate: {
        value: function (syntax, value, parameters, visitor) {
            return this.compile(syntax)(value, parameters, visitor);
        }
    }

});

