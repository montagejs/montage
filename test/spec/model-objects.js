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

var Manager = exports.Manager = Montage.specialize({
    managerId: {set:function (value){this._managerId = value;},get: function () {return this._managerId;}},
    managerName: {set:function (value){this._managerName = value;},get: function () {return this._managerName;}},
    managerSalary : {set:function (value){this._managerSalary = value;},get: function () {return this._managerSalary;}},
    _managerId : { value: null },
    _managerName : { value: null },
    _managerSalary : { value: null }
});

var Employee = exports.Employee = Montage.specialize({
    employeeId: {set:function (value){this._employeeId = value;},get: function () {return this._employeeId;}},
    employeeName: {set:function (value){this._employeeName = value;},get: function () {return this._employeeName;}},
    employeeSalary : {set:function (value){this._employeeSalary = value;},get: function () {return this._employeeSalary;}},
    _employeeId : { value: null },
    _employeeName : { value: null },
    _employeeSalary : { value: null }
});


var Department = exports.Department = Montage.specialize({
    employees : { value: null, inverseProperty:"department"}
});


var manager0 = exports.manager0 = new Manager();
var manager1 = exports.manager1 = new Manager();
var manager2 = exports.manager2 = new Manager();
var manager3 = exports.manager3 = new Manager();

manager0.managerName = "MANAGER0";
manager1.managerName = "MANAGER1";
manager2.managerName = "MANAGER2";
manager3.managerName = "MANAGER3";

var employee01 = exports.employee01 = new Employee();
var employee02 = exports.employee02 = new Employee();
var employee03 = exports.employee03 = new Employee();
var employee11 = exports.employee11 = new Employee();
var employee12 = exports.employee12 = new Employee();
var employee13 = exports.employee13 = new Employee();
var employee14 = exports.employee14 = new Employee();
var employee21 = exports.employee21 = new Employee();
var employee22 = exports.employee22 = new Employee();
var employee23 = exports.employee23 = new Employee();
var employee24 = exports.employee24 = new Employee();
var employee31 = exports.employee31 = new Employee();
var employee32 = exports.employee32 = new Employee();
var employee33 = exports.employee33 = new Employee();

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

var department0 = exports.department0 = new Department();
var department1 = exports.department1 = new Department();
var department2 = exports.department2 = new Department();
var department3 = exports.department3 = new Department();

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

var motorola = exports.motorola = Montage.specialize({
    departments: { value: departments },
    bigBoss: { value: manager0}
});

manager0.toString = function (){return "manager0";};
manager1.toString = function (){return "manager1";};
manager2.toString = function (){return "manager2";};
manager3.toString = function (){return "manager3";};

employee01.toString = function (){return "employee01";};
employee02.toString = function (){return "employee02";};
employee03.toString = function (){return "employee03";};
employee11.toString = function (){return "employee11";};
employee12.toString = function (){return "employee12";};
employee13.toString = function (){return "employee13";};
employee14.toString = function (){return "employee14";};
employee21.toString = function (){return "employee21";};
employee22.toString = function (){return "employee22";};
employee23.toString = function (){return "employee23";};
employee24.toString = function (){return "employee24";};
employee31.toString = function (){return "employee31";};
employee32.toString = function (){return "employee32";};
employee33.toString = function (){return "employee33";};

department0.toString = function (){return "department1";};
department1.toString = function (){return "department2";};
department2.toString = function (){return "department3";};
department3.toString = function (){return "department4";};

