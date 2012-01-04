/* <copyright>
Copyright (c) 2012, Motorola Mobility, Inc

All Rights Reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

  - Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
  - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
  - Neither the name of Motorola Mobility nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
</copyright> */
var Montage = require("montage").Montage;
var Selector = require("montage/data/selector").Selector;
var Promise = require("montage/core/promise").Promise;
var logger = require("montage/core/logger").logger("property-spec");

var Manager = exports.Manager = Montage.create(Montage, {

    name: {
        enumerable: true,
        serializable: true,
        value: null
    },

    reports: {
        enumerable: true,
        serializable: true,
        value: null
    }


});

var Employee = exports.Employee = Montage.create(Montage, {

    name: {
        enumerable: true,
        serializable: true,
        value: null
    },

    manager: {
        enumerable: true,
        serializable: true,
        value: null
    }


});

describe("data/selector/property-spec", function() {
    describe("Property creation", function() {
        it("Create a new property object.", function() {
            var keySelector = Selector.property("manager.name");

            expect(keySelector.propertyPath).toBe("manager.name");
        });

    });

    describe("Property Value", function() {
        it("Set value and evaluate.", function() {
            var manager = Manager.create();
            manager.name = "Gilles Drieu";
            var employee = Employee.create();
            employee.name = "Pierre Frisch";
            employee.manager = manager;

            var promise = Selector.property("manager.name").evaluate(employee).then(function(result) {
                return result;
            });
            waitsFor(function() {
                return promise.isFulfilled();
            }, "promise", 500);
            runs(function() {
                var result = promise.valueOf();
                expect(result).toBe("Gilles Drieu");
            });
        });

    });
    describe("Property Constants", function() {
        it("TRUE", function() {
            var promise = Selector.true().evaluate().then(function(result) {
                return result;
            });
            waitsFor(function() {
                return promise.isFulfilled();
            }, "promise", 500);
            runs(function() {
                var result = promise.valueOf();
                expect(result).toBe(true);
            });
        });
        it("FALSE", function() {
            var promise = Selector.false().evaluate().then(function(result) {
                return result;
            });
            waitsFor(function() {
                return promise.isFulfilled();
            }, "promise", 500);
            runs(function() {
                var result = promise.valueOf();
                expect(result).toBe(false);
            });
        });
    });

});
