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
                ),
                new Employee(
                    'Mamie',
                    'Henderson',
                    'Sales'
                ),
                new Employee(
                    'Shaun',
                    'Davidson',
                    'Accounting'
                ),
                new Employee(
                    'Adam',
                    'Owens',
                    'Logistics'
                ),
                new Employee(
                    'Jeffrey',
                    'Cross',
                    'Management'
                ),
                new Employee(
                    'Flora',
                    'Adkins',
                    'Accounting'
                ),
                new Employee(
                    'Rosemary',
                    'Adams',
                    'Logistics'
                ),
                new Employee(
                    'Henrietta',
                    'Silva',
                    'Management'
                ),
                new Employee(
                    'Alvin',
                    'Jennings',
                    'Management'
                ),
                new Employee(
                    'Casey',
                    'Norris',
                    'Accounting'
                ),
                new Employee(
                    'Santiago',
                    'Peters',
                    'Logistics'
                ),
                new Employee(
                    'Johnny',
                    'Bailey',
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
