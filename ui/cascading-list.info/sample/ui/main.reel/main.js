var Component = require("montage/ui/component").Component,
    Employee = require('../../core/model/employee').Employee,
    Department = require('../../core/model/department').Department;

exports.Main = Component.specialize(/** @lends Main# */{

    constructor: {
        value: function () {
            this.root = [
                [
                    new Employee(
                        'Annette',
                        'Alarcon',
                        'sales'
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
                ],
                [
                    new Department('Management'),
                    new Department('Sales'),
                    new Department('Accounting'),
                    new Department('Logistics')
                ]
            ];
        }
    },

    cascadingListWillUseObjectDescriptorModuleIdForObjectAtColumnIndex: {
        value: function (cascadingList, moduleId, object, columnIndex) {
            if (!moduleId) {
                if (object === this.root) {
                    return 'core/model/organisation.mjson';
                } else if (object === this.root[0]) {
                    return 'core/model/employee.mjson';
                } else if (object === this.root[1]) {
                    return 'core/model/department.mjson';
                }
            }
        }
    },

    listItemNeedsLabelForObject: {
        value: function (listItem, object, rowIndex, list) {
            if (object === this.root[0]) {
                return 'Employees';
            } else if (object === this.root[1]) {
                return 'Departments';
            }
        }
    }

});
