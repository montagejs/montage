var Montage = require("montage").Montage,
    Employee = require('../models/employee').Employee,
    Store = require('../models/store').Store,
    Settings = require('../models/settings').Settings,
    Check = require('../models/check').Check,
    Customer = require('../models/customer').Customer,
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
                ),
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
                new Department('Management', 'management.svg'),
                new Department('Sales', 'sales.svg'),
                new Department('Accounting', 'accounting.svg'),
                new Department('Logistics', 'logistics.svg')
            ];
        }
    },

    fetchStores: {
        value: function () {
            return [
                new Store('store 1', 'San Francisco'),
                new Store('store 2', 'Paris'),
                new Store('store 3', 'Montreal'),
                new Store('store 4', 'New York'),
                new Store('store 4', 'London'),
                new Store('store 4', 'Tokyo'),
                new Store('store 4', 'Shanghai')
            ];
        }
    },

    fetchSettings: {
        value: function () {
            return [
                new Settings('Data', '345 GB'),
                new Settings('Restrictions', null, true),
                new Settings('Allow holidays', null, false),
            ];
        }
    },

    fetchCustomers: {
        value: function () {
            return [
                new Customer('Marcus', 'Osborne', 'New York'),
                new Customer('Howard', 'Morrison', 'San Francisco', true),
                new Customer('Shane', 'Byrd', 'Montreal', true),
                new Customer('Marcus', 'Walters', 'Shanghai')
            ];
        }
    },

    fetchCheck: {
        value: function () {
            return new Check();
        }
    }

});
