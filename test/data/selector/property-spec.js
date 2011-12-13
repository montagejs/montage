/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
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
