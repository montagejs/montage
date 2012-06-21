/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;

var Manager = exports.Manager = Montage.create(Montage,{
    managerId: {set:function(value){this._managerId = value;},get: function() {return this._managerId;}},
    managerName: {set:function(value){this._managerName = value;},get: function() {return this._managerName;}},
    managerSalary : {set:function(value){this._managerSalary = value;},get: function() {return this._managerSalary;}},
    _managerId : { value: null },
    _managerName : { value: null },
    _managerSalary : { value: null }
});

var Employee = exports.Employee = Montage.create(Montage,{
    employeeId: {set:function(value){this._employeeId = value;},get: function() {return this._employeeId;}},
    employeeName: {set:function(value){this._employeeName = value;},get: function() {return this._employeeName;}},
    employeeSalary : {set:function(value){this._employeeSalary = value;},get: function() {return this._employeeSalary;}},
    _employeeId : { value: null },
    _employeeName : { value: null },
    _employeeSalary : { value: null }
});


var Department = exports.Department = Montage.create(Montage,{
    employees : { value: null, inverseProperty:"department"}
});


var manager0 = exports.manager0 = Montage.create(Manager);
var manager1 = exports.manager1 = Montage.create(Manager);
var manager2 = exports.manager2 = Montage.create(Manager);
var manager3 = exports.manager3 = Montage.create(Manager);

manager0.managerName = "MANAGER0";
manager1.managerName = "MANAGER1";
manager2.managerName = "MANAGER2";
manager3.managerName = "MANAGER3";

var employee01 = exports.employee01 = Montage.create(Employee);
var employee02 = exports.employee02 = Montage.create(Employee);
var employee03 = exports.employee03 = Montage.create(Employee);
var employee11 = exports.employee11 = Montage.create(Employee);
var employee12 = exports.employee12 = Montage.create(Employee);
var employee13 = exports.employee13 = Montage.create(Employee);
var employee14 = exports.employee14 = Montage.create(Employee);
var employee21 = exports.employee21 = Montage.create(Employee);
var employee22 = exports.employee22 = Montage.create(Employee);
var employee23 = exports.employee23 = Montage.create(Employee);
var employee24 = exports.employee24 = Montage.create(Employee);
var employee31 = exports.employee31 = Montage.create(Employee);
var employee32 = exports.employee32 = Montage.create(Employee);
var employee33 = exports.employee33 = Montage.create(Employee);

employee01.employeeName = "EMPLOYEE01";
employee02.employeeName = "EMPLOYEE02";
employee03.employeeName = "EMPLOYEE03";
employee11.employeeName = "EMPLOYEE11";
employee12.employeeName = "EMPLOYEE12";
employee13.employeeName = "EMPLOYEE13";
employee14.employeeName = "EMPLOYEE14";
employee21.employeeName = "EMPLOYEE21";
employee22.employeeName = "EMPLOYEE22";
employee23.employeeName = "EMPLOYEE23";
employee24.employeeName = "EMPLOYEE24";
employee31.employeeName = "EMPLOYEE31";
employee32.employeeName = "EMPLOYEE32";
employee33.employeeName = "EMPLOYEE33";
employee01.employeeSalary = 0;
employee02.employeeSalary = 1;
employee03.employeeSalary = 2;
employee11.employeeSalary = 3;
employee12.employeeSalary = 4;
employee13.employeeSalary = 5;
employee14.employeeSalary = 6;
employee21.employeeSalary = 7;
employee22.employeeSalary = 8;
employee23.employeeSalary = 9;
employee24.employeeSalary = 10;
employee31.employeeSalary = 11;
employee32.employeeSalary = 12;
employee33.employeeSalary = 13;

var allEmployees = exports.allEmployees = [
    employee01,
    employee02,
    employee03,
    employee11,
    employee12,
    employee13,
    employee14,
    employee21,
    employee22,
    employee23,
    employee24,
    employee31,
    employee32,
    employee33];

var department0 = exports.department0 = Montage.create(Department);
var department1 = exports.department1 = Montage.create(Department);
var department2 = exports.department2 = Montage.create(Department);
var department3 = exports.department3 = Montage.create(Department);

var departments = exports.departments = [department0, department1, department2, department3];

department0.employees = [employee01,employee02,employee03];
department1.employees = [employee11,employee12,employee13,employee14];
department2.employees = [employee21,employee22,employee23,employee24];
department3.employees = [employee31,employee32,employee33];

Montage.defineProperty(department0, "manager", {
    value: manager0
});
Montage.defineProperty(department1, "manager", {
    value: manager1
});
Montage.defineProperty(department2, "manager", {
    value: manager2
});
Montage.defineProperty(department3, "manager", {
    value: manager3
});

var motorola = exports.motorola = Montage.create(Montage,{
    departments: { value: departments },
    bigBoss: { value: manager0}
});

manager0.toString = function(){return "manager0";};
manager1.toString = function(){return "manager1";};
manager2.toString = function(){return "manager2";};
manager3.toString = function(){return "manager3";};

employee01.toString = function(){return "employee01";};
employee02.toString = function(){return "employee02";};
employee03.toString = function(){return "employee03";};
employee11.toString = function(){return "employee11";};
employee12.toString = function(){return "employee12";};
employee13.toString = function(){return "employee13";};
employee14.toString = function(){return "employee14";};
employee21.toString = function(){return "employee21";};
employee22.toString = function(){return "employee22";};
employee23.toString = function(){return "employee23";};
employee24.toString = function(){return "employee24";};
employee31.toString = function(){return "employee31";};
employee32.toString = function(){return "employee32";};
employee33.toString = function(){return "employee33";};

department0.toString = function(){return "department1";};
department1.toString = function(){return "department2";};
department2.toString = function(){return "department3";};
department3.toString = function(){return "department4";};

