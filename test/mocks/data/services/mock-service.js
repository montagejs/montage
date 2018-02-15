var Montage = require("montage").Montage,
    Employee = require('../models/employee').Employee,
    Department = require('../models/department').Department;    

/**
 * @class Employee
 * @extends Montage
 */
exports.MockService = Montage.specialize({

    fetchEmployees: {
        value: function () {
            return [
                new Employee(
                    'Annette',
                    'Alarcon',
                    'Sales'
                ),
                new Employee(
                    'Fredricka',
                    'Fuss',
                    'Accounting'
                ),
                new Employee(
                    'Moriah',
                    'Mcwhorter',
                    'Logistics'
                ),
                new Employee(
                    'Emanuel',
                    'Sullivan',
                    'Management'
                ),
                new Employee(
                    'Gretchen',
                    'Chapman',
                    'Accounting'
                ),
                new Employee(
                    'Courtney',
                    'Simon',
                    'Logistics'
                ),
                new Employee(
                    'Brett',
                    'Lucas',
                    'Management'
                )
            ];
        }
    },

    fetchDepartments: {
        value: function () {
            return [
                new Department('Management'),
                new Department('Sales'),
                new Department('Accounting'),
                new Department('Logistics')
            ];
        }
    }

});
