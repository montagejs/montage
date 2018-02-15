var Component = require("montage/ui/component").Component,
    MockService = require('montage/test/mocks/data/services/mock-service').MockService,
    Employee = require('montage/test/mocks/data/models/employee').Employee;

exports.Main = Component.specialize(/** @lends Main# */{

    constructor: {
        value: function () {
            this.mockService = new MockService();

            this.root = [
                this.mockService.fetchEmployees(),
                this.mockService.fetchDepartments()                
            ];
        }
    },

    cascadingListWillUseObjectDescriptorModuleIdForObjectAtColumnIndex: {
        value: function (cascadingList, moduleId, object, columnIndex) {
            if (!moduleId) {
                 if (object === this.root[0]) {
                    return 'montage/test/mocks/data/models/employee.mjson';
                } else if (object === this.root[1]) {
                    return 'montage/test/mocks/data/models/department.mjson';
                }
            }
        }
    },

    cascadingListNeedsUserInterfaceDescriptorForObjectAtColumnIndex: {
        value: function (cascadingList, object, columnIndex) {
            if (object === this.root) {
                return 'montage/test/mocks/data/models/organisation-ui-descriptor.mjson';
            }
        }
    },

    cascadingListWillUseComponentModuleForObjectAtColumnIndex: {
        value: function (cascadingList, componentModule, object, columnIndex, UIDescriptor) {
            if (object instanceof Employee && !object.firstname) {
                return UIDescriptor.creatorInspectorComponentModule;
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
    },

    handleEditAction: {
        value: function (event) {
            var cascadingListContext = event.detail.get('context');

            if (cascadingListContext && cascadingListContext.object === this.root[0]) {
                this.cascadingList.expand(
                    new Employee(),
                    cascadingListContext.columnIndex + 1
                );
            }
        }
    },

    handleSaveAction: {
        value: function (event) {
            var cascadingListContext = event.detail.get('context');

            if (cascadingListContext &&
                cascadingListContext.object instanceof Employee &&
                cascadingListContext.object.firstname &&
                cascadingListContext.object.lastname &&
                cascadingListContext.object.department
            ) {
                this.root[0].push(cascadingListContext.object);
                this.cascadingList.pop();
            }
        }
    }

});