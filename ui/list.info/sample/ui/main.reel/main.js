var Component = require("montage/ui/component").Component,
    Employee = require("../../core/model/employee").Employee;    
EmployeeUIDescriptor = require("../../core/model/employee-ui-descriptor.mjson").montageObject;    

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
                        firstname: 'Leo',
                        lastname: 'Luna',
                        department: 'management',
                        id: 1301
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
            Employee.descriptor = EmployeeUIDescriptor;

            Employee.objectDescriptor.then(function (objectDescriptor) {
                Employee.objectDescriptor.userInterfaceDescriptor;
            })

            this.content = employees;
        }
    }
  
});
