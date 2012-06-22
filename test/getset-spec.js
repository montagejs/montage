/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;
var model = require("model-objects");

// TODO not crazy about this as we're using the same data from one spec execution to the next,
// preserving test side effects
var Manager = model.Manager;
var Employee = model.Employee;
var Department = model.Department;

var manager0 = model.manager0;
var manager1 = model.manager1;
var manager2 = model.manager2;
var manager3 = model.manager3;

var employee01 = model.employee01;
var employee02 = model.employee02;
var employee03 = model.employee03;
var employee11 = model.employee11;
var employee12 = model.employee12;
var employee13 = model.employee13;
var employee14 = model.employee14;
var employee21 = model.employee21;
var employee22 = model.employee22;
var employee23 = model.employee23;
var employee24 = model.employee24;
var employee31 = model.employee31;
var employee32 = model.employee32;
var employee33 = model.employee33;

var allEmployees = model.allEmployees;

var department0 = model.department0;
var department1 = model.department1;
var department2 = model.department2;
var department3 = model.department3;

var departments = model.departments;


var motorola = model.motorola;

describe("getset-spec", function() {

    describe("getProperty() on Object", function() {

        it("should return a property one level down", function() {
            expect(motorola.getProperty("departments")).toEqual(departments);
        });

        it("should return a property two levels down", function() {
            expect(motorola.getProperty("bigBoss.managerName")).toEqual("MANAGER0");
        });

    });

    describe("setProperty() on an Object", function() {

        it("should set a property two levels down", function() {
            var object = Montage.create();
            var object2 = Montage.create();
            object2.foo = null;
            object.object2 = object2;

            object.setProperty("object2.foo", "foo");
            expect(object2.foo).toBe("foo");
        });

        it("should set the specified property to the new value if that property is a primitive value", function() {
            var object = Montage.create();
            object.primitive = 42;
            object.setProperty("primitive", 22);

            expect(object.primitive).toBe(22);
        });

        it("should set the specified property to the new value if that property is an array", function() {
            var object = Montage.create();
            object.array = ["a", "b", "c"];
            object.setProperty("array", ["x", "y", "z"]);

            expect(object.array.length).toBe(3);
            expect(object.array[0]).toBe("x");
            expect(object.array[1]).toBe("y");
            expect(object.array[2]).toBe("z");
        });

        it("should set an imediate property that was not previously defined", function() {
            motorola.setProperty("blah", "foo");
            expect(motorola.getProperty("blah")).toBe("foo")
        });

        it("should stop if the propertyPath specified is a dead-end", function() {
            motorola.setProperty("biff.pow", "foo");
            expect(motorola.getProperty("biff")).toBeUndefined();
            expect(motorola.getProperty("biff.pow")).toBeUndefined();
        })

    });

    describe("getProperty() on Array", function() {

        it("should return the item at index for a numeric path", function() {
            expect(motorola.getProperty("departments.0")).toBe(department0);
        });

        it("should return the item at index for a numeric index", function() {
            expect(motorola.departments.getProperty("0")).toBe(department0);
        });

        it("should return the property of object at index", function() {
            expect(motorola.getProperty("departments.2.employees")[0]).toBe(employee21);
        });

        it("should support doing a sum of a single-level path", function() {
            var result = motorola.getProperty("departments.map(employees.sum(employeeSalary))");
            expect(result[0]).toBe(employee01.employeeSalary + employee02.employeeSalary + employee03.employeeSalary);
        });


        it ("should return the length of the array members if length is on the propertyPath", function() {
            var result = [0, 1, 2, "hello"].getProperty("map(length)", false, true);
            expect(result.length).toBe(4);

            expect(result[0]).toBeUndefined();
            expect(result[1]).toBeUndefined();
            expect(result[2]).toBeUndefined();
            expect(result[3]).toBe(5);
        });

        describe("while not preserving the structure of the arrays encountered", function() {

            it ("the result should be flattened when only a single value is found", function() {
                var result = [{x: [{y: 1}]}].getProperty("flatten(x).map(y)");
                expect(result).toEqual([1]);
            });

            it ("the result should be flattened when multiple value are found", function() {
                var result = [{x: [{y: 1}, {y: 2}]}].getProperty("flatten(x).map(y)");
                expect(result).toEqual([1, 2]);
            });

            it("should perform a function on the preserved structure", function() {
                var result = motorola.getProperty("departments.map(employees.sum(employeeSalary))");
                expect(result).toEqual([ 3, 18, 34, 36 ]);
            });

            it("should perform a function on the flattened structure", function() {
                var result;

                result = motorola.getProperty("departments.map(employees.map(employeeSalary)).sum()");
                expect(result).toBe(91);

                result = motorola.getProperty("departments.flatten(employees.map(employeeSalary)).sum()");
                expect(result).toEqual(91);

                result =  motorola.getProperty("departments.map(employees).flatten().sum(employeeSalary)");
                expect(result).toEqual(91);

                result = motorola.getProperty("departments.map(employees).flatten().map(employeeSalary).sum()");
                expect(result).toEqual(91);
            });

            it("should remove duplicates when unique is true", function() {
                // TODO build this on top of the usual data
                var alice = {"name": "Alice", "salary": 100};
                var bob = {"name": "Bob", "salary": 200};
                var carol = {"name": "Carol", "salary": 200};
                var david = {"name": "David", "salary": 200};
                var eve = {"name": "Eve", "salary": 200};
                var frank = {"name": "Frank", "salary": 600};

                var engineering = {"name": "Engineering", "employees": [alice, bob, carol]};

                var marketing = {"name": "Marketing", "employees": [david, eve, frank]};

                var departments = [engineering, marketing];
                var company = {"departments": departments};

                var georgia = {"name": "Georgia"};
                    engineering.employees.push(georgia);
                    marketing.employees.push(georgia);

                result = company.getProperty("departments.flatten(employees).unique(name)");
                expect(result).toEqual(['Alice', 'Bob', 'Carol', 'Georgia', 'David', 'Eve', 'Frank']);
            });

        });

        describe("while preserving the structure of the arrays encountered", function() {

            it ("the result should not be flattened when only a single value is found", function() {
                var result = [{x: [{y: 1}]}].getProperty("map(x.map(y))");
                expect(result).toEqual([[1]]);
            });

            it ("the result should be flattened when multiple value are found", function() {
                var result = [{x: [{y: 1}, {y: 2}]}].getProperty("map(x.map(y))");
                expect(result).toEqual([[1, 2]]);
            });

            it("should perform a function on the preserved structure", function() {
                var result = motorola.getProperty("departments.map(employees.sum(employeeSalary))");
                expect(result).toEqual([ 3, 18, 34, 36 ]);
            });

            it("should perform a function on the flattened structure", function() {
                var result = motorola.getProperty("departments.sum(employees.map(employeeSalary))");
                expect(result).toBe(allEmployees.getProperty("sum(employeeSalary)"));
                expect(result).toBe(91);
            });
        });

        describe("using the 'sum' function", function() {

            it("should sum the values in an array when no propertyPath is provided", function() {
                expect([0,1,2,3,4].getProperty("sum()")).toBe(10);
            });

            it("should sum the values at the propertyPaths within an array when a propertyPath is provided", function() {
                expect([{a: {b: 0}}, {a: {b: 1}}, {a: {b: 2}}, {a: {b: 3}}, {a: {b: 4}}].getProperty("sum(a.b)")).toBe(10);
            });

            it("should correctly sum nested sum functions in a provided property path", function() {
                expect([{a: {b: [0,1,2,3,4]}}, {a: {b: [0,1,2,3,4]}}, {a: {b: [0,1,2,3,4]}}, {a: {b: [0,1,2,3,4]}}, {a: {b: [0,1,2,3,4]}}].getProperty("sum(a.b.sum())")).toBe(50);
            });

        });

        describe("using the 'count' function", function() {

            it("should return the length of an empty array", function() {
                expect([].getProperty("count()")).toBe(0);
            });

            it("should return the length of an array with one member", function() {
                expect([0].getProperty("count()")).toBe(1);
            });

            it("should return the length of an array with many members", function() {
                var array = [];
                array[10000] = 42;
                expect(array.getProperty("count()")).toBe(10001);
            });
        });

    });

    describe("setProperty() on an Array", function() {

        it ("should set the specified value at the specified index using an index only property path", function() {
            var array = ["a", "b", "c"];
            array.setProperty("1", "foo");
            expect(array[1]).toBe("foo");
        });

        it ("should set the specified value at the specified index using a numeric index property path", function() {
            var array = ["a", "b", "c"];
            array.setProperty(1, "foo");
            expect(array[1]).toBe("foo");
        });

        it ("should set the specified value at the specified index, even if the array is part of a deeper propertyPath", function() {
            var object = Montage.create();
            var object2 = Montage.create();
            object2.array = ["a", "b", "c"];
            object.object2 = object2;

            object.setProperty("object2.array.1", "foo");
            expect(object2.array[1]).toBe("foo");
        })

    });

    describe("when concerned with functions", function() {

        var funcOwner, myFunc, funcProperty;

        beforeEach(function() {

            funcProperty = 42;

            myFunc = function() {
                throw "this function should not get called via the getProperty"
            };

            myFunc.prop = funcProperty;

            funcOwner = {func: myFunc};
        });

        describe("using getProperty()", function() {

            it("should return a function found at the end of a property path", function() {
                expect(funcOwner.getProperty("func")).toBe(myFunc);
            });

            it("should not execute the function found at the end of a property path", function() {
                // this should not trigger the exception thrown from inside "func"
                // I just wanted this explicitly specced this way
                funcOwner.getProperty("func");
            });

            it("should return a property found on a function encountered along a property path", function() {
                expect(funcOwner.getProperty("func.prop")).toBe(funcProperty);
            });

            it("should return a property found on a function object", function() {
                expect(myFunc.getProperty("prop")).toBe(funcProperty);
            });

        })

    });
});
