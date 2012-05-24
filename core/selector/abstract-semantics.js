/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
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
            // TODO put a weak map memo of syntax to evaluator here to speed up common property compilation
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

