/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
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

        describe("with a visitor callback", function() {

            var visitor;

            beforeEach(function() {
                visitor = {
                    visit: function(context, key, value) {
                    }
               }
            });

            it ("should call a specified visitor callback on each component of the property path, providing the context, key, and value", function() {
                spyOn(visitor, "visit");

                var managerName = motorola["bigBoss"]["managerName"];

                expect(motorola.getProperty("bigBoss.managerName", false, false, visitor.visit)).toBe(managerName);

                expect(visitor.visit).toHaveBeenCalledWith(motorola, "bigBoss", motorola["bigBoss"]);
                expect(visitor.visit).toHaveBeenCalledWith(motorola["bigBoss"], "managerName", managerName);
            });

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

        it("should return the property of object at index", function() {
            expect(motorola.getProperty("departments.2.employees")[0]).toBe(employee21);
        });

        it("should support doing a sum of a single-level path", function() {
            var result = motorola.getProperty("departments.employees.sum(employeeSalary)", false, true);
            expect(result[0]).toBe(employee01.employeeSalary + employee02.employeeSalary + employee03.employeeSalary);
        });

        it("should be equivalent to not preserving the structure", function() {
            var result = motorola.getProperty("departments.employees.sum(employeeSalary)", false, false);
            expect(result).toEqual([ 3, 18, 34, 36 ]);
        });

        it("should support doing a sum of a multi-level path", function() {
            var result = motorola.getProperty("departments.sum(employees.employeeSalary)", false, true);
            expect(result).toBe(allEmployees.getProperty("sum(employeeSalary)"));
        });

        it ("should return the length of the array members if length is on the propertyPath", function() {

            var result = [0, 1, 2, "hello"].getProperty("length");
            expect(result.length).toBe(4);

            expect(result[0]).toBeUndefined();
            expect(result[1]).toBeUndefined();
            expect(result[2]).toBeUndefined();
            expect(result[3]).toBe(5);
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

        describe("with a visitor callback", function() {

            var visitor, expectedVisitorArguments, visitIndex;

            beforeEach(function() {

                visitIndex = 0;

                visitor = {
                    visit: function(context, key, value, index) {

                        expect(context).toBe(expectedVisitorArguments[visitIndex].context);
                        expect(key).toBe(expectedVisitorArguments[visitIndex].key);
                        expect(value).toBe(expectedVisitorArguments[visitIndex].value);
                        expect(index).toBe(expectedVisitorArguments[visitIndex].index);

                        visitIndex++;
                    }
               }
            });

            it("should call a specified visitor callback on each component of the property path, providing the context, key, and value", function() {
                spyOn(visitor, "visit");

                var department = motorola["departments"][0];

                expect(motorola.getProperty("departments.0", false, false, visitor.visit)).toBe(department);

                expect(visitor.visit).toHaveBeenCalledWith(motorola, "departments", motorola["departments"]);
                expect(visitor.visit).toHaveBeenCalledWith(motorola["departments"], "0", department);
            });

            it("should call a specified visitor callback on each component of the property path with an operator, providing the context, key, and value", function() {
                spyOn(visitor, "visit");

                var data = [{a: {b: 0}}, {a: {b: 1}}, {a: {b: 2}}, {a: {b: 3}}, {a: {b: 4}}];
                expect(data.getProperty("sum(a.b)", false, false, visitor.visit)).toBe(10);

                expect(visitor.visit).toHaveBeenCalledWith(data, "sum()");
                expect(visitor.visit).toHaveBeenCalledWith(data[0], "a", data[0]["a"]);
                expect(visitor.visit).toHaveBeenCalledWith(data[0]["a"], "b", data[0]["a"]["b"]);
                expect(visitor.visit).toHaveBeenCalledWith(data[1], "a", data[1]["a"]);
                expect(visitor.visit).toHaveBeenCalledWith(data[1]["a"], "b", data[1]["a"]["b"]);
                expect(visitor.visit).toHaveBeenCalledWith(data[2], "a", data[2]["a"]);
                expect(visitor.visit).toHaveBeenCalledWith(data[2]["a"], "b", data[2]["a"]["b"]);
                expect(visitor.visit).toHaveBeenCalledWith(data[3], "a", data[3]["a"]);
                expect(visitor.visit).toHaveBeenCalledWith(data[3]["a"], "b", data[3]["a"]["b"]);
                expect(visitor.visit).toHaveBeenCalledWith(data[4], "a", data[4]["a"]);
                expect(visitor.visit).toHaveBeenCalledWith(data[4]["a"], "b", data[4]["a"]["b"]);
            });

            it("should call a specified visitor callback on each component of the property path with nested operators, providing the context, key, and value", function() {
                spyOn(visitor, "visit");

                var data = [{a: {b: [0,1,2,3,4]}}, {a: {b: [0,1,2,3,4]}}, {a: {b: [0,1,2,3,4]}}, {a: {b: [0,1,2,3,4]}}, {a: {b: [0,1,2,3,4]}}];
                expect(data.getProperty("sum(a.b.sum())", false, false, visitor.visit)).toBe(50);

                expect(visitor.visit).toHaveBeenCalledWith(data, "sum()");
                expect(visitor.visit).toHaveBeenCalledWith(data[0], "a", data[0]["a"]);
                expect(visitor.visit).toHaveBeenCalledWith(data[0]["a"], "b", data[0]["a"]["b"]);
                expect(visitor.visit).toHaveBeenCalledWith(data[0]["a"]["b"], "sum()");
                expect(visitor.visit).toHaveBeenCalledWith(data[1], "a", data[1]["a"]);
                expect(visitor.visit).toHaveBeenCalledWith(data[1]["a"], "b", data[1]["a"]["b"]);
                expect(visitor.visit).toHaveBeenCalledWith(data[1]["a"]["b"], "sum()");
                expect(visitor.visit).toHaveBeenCalledWith(data[2], "a", data[2]["a"]);
                expect(visitor.visit).toHaveBeenCalledWith(data[2]["a"], "b", data[2]["a"]["b"]);
                expect(visitor.visit).toHaveBeenCalledWith(data[2]["a"]["b"], "sum()");
                expect(visitor.visit).toHaveBeenCalledWith(data[3], "a", data[3]["a"]);
                expect(visitor.visit).toHaveBeenCalledWith(data[3]["a"], "b", data[3]["a"]["b"]);
                expect(visitor.visit).toHaveBeenCalledWith(data[3]["a"]["b"], "sum()");
                expect(visitor.visit).toHaveBeenCalledWith(data[4], "a", data[4]["a"]);
                expect(visitor.visit).toHaveBeenCalledWith(data[4]["a"], "b", data[4]["a"]["b"]);
                expect(visitor.visit).toHaveBeenCalledWith(data[4]["a"]["b"], "sum()");
            });

            it("should call a specified visitor callback correctly for each member of an array encountered in the specified property path", function() {

                spyOn(visitor, "visit").andCallThrough();

                var first = {foo: "first here"};
                var second = {foo: "second here"};
                var third = {foo: "third here"};
                var myArray = [first, second];
                var owner = {array : myArray};

                expectedVisitorArguments = [
                    {context: owner, key: "array", value: myArray},
                    // When encountering the array, we want to make sure we indicate we did so, but we're not
                    // accessing any key on this array, so we explicitly pass null along as an indication
                    {context: myArray, key: null},
                    {context: first, key: "foo", value: "first here", index: 0},
                    {context: second, key: "foo", value: "second here", index: 1}
                ];

                owner.getProperty("array.foo", false, false, visitor.visit);

                expect(visitor.visit).toHaveBeenCalled();
                expect(visitIndex).toBe(4);
            });

        });

    });

    describe("setProperty() on an Array", function() {

        it ("should set the specified value at the specified index using an index only property path", function() {
            var array = ["a", "b", "c"];
            array.setProperty("1", "foo");
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
