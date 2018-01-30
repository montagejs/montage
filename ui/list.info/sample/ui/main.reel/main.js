var Component = require("montage/ui/component").Component,
    Employee = require("../../core/model/employee").Employee;    

exports.Main = Component.specialize(/** @lends Main# */{

    constructor: {
        value: function () {
            var data = [
                    {
                        firstname: 'Annette',
                        lastname: 'Alarcon',
                        department: 'sales',
                        id: 1001
                    },
                    {
                        firstname: 'Fredricka',
                        lastname: 'Fuss',
                        department: 'accounting',
                        id: 1101
                    },
                    {
                        firstname: 'Bev',
                        lastname: 'Burney',
                        department: 'accounting',
                        id: 1102
                    },
                    {
                        firstname: 'Moriah',
                        lastname: 'Mcwhorter',
                        department: 'logistics',
                        id: 1201

                    },
                    {
                        firstname: 'Emanuel',
                        lastname: 'Sullivan',
                        department: 'management',
                        id: 1301
                    },
                    {
                        firstname: 'Gretchen',
                        lastname: 'Chapman',
                        department: 'accounting',
                        id: 1103
                    },
                    {
                        firstname: 'Courtney',
                        lastname: 'Simon',
                        department: 'logistics',
                        id: 1202

                    },
                    {
                        firstname: 'Brett',
                        lastname: 'Lucas',
                        department: 'management',
                        id: 1302
                    }
                ],
                employees = [],
                employee;

            for (var i = 0, length = data.length; i < length; i++) {
                employee = new Employee();
                employee.firstname = data[i].firstname;
                employee.lastname = data[i].lastname;
                employee.id = data[i].id;
                employee.department = data[i].department;
                employees.push(employee);
            }

            this.content = employees;
        }
    }
  
});
