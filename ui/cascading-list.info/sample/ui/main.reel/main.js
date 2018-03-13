var Component = require("montage/ui/component").Component,
    MockService = require('montage/test/mocks/data/services/mock-service').MockService,
    Employee = require('montage/test/mocks/data/models/employee').Employee;

exports.Main = Component.specialize(/** @lends Main# */{

    constructor: {
        value: function () {
            this.mockService = new MockService();

            this.root = [
                this.mockService.fetchEmployees(),
                this.mockService.fetchDepartments(),
                this.mockService.fetchStores(),
                this.mockService.fetchCustomers(),               
                this.mockService.fetchSettings(),   
            ];

            this.addEventListener('cascadingListPop', this, false);
            this.addEventListener('cascadingListPush', this, false);
        }
    },

    shouldListEnableNavigation: {
        value: function (list, isNavigationEnabled, content) {
            return content !== this.root[2] && content !== this.root[4] &&
                content !== this.root[3];
        }
    },

    cascadingListWillUseObjectDescriptorModuleIdForObjectAtColumnIndex: {
        value: function (cascadingList, moduleId, object, columnIndex) {
            if (!moduleId) {
                 if (object === this.root[0]) {
                    return 'montage/test/mocks/data/models/employee.mjson';
                } else if (object === this.root[1]) {
                    return 'montage/test/mocks/data/models/department.mjson';
                 } else if (object === this.root[2]) {
                     return 'montage/test/mocks/data/models/store.mjson';
                 }
            }
        }
    },

    cascadingListWillUseUserInterfaceDescriptorIdForObjectAtColumnIndex: {
        value: function (cascadingList, userInterfaceDescriptorModuleId, object, columnIndex) {
            if (object === this.root && !userInterfaceDescriptorModuleId) {
                return 'montage/test/mocks/data/models/organisation-ui-descriptor.mjson';
            } else if (object === this.root[4]) {
                return 'montage/test/mocks/data/models/settings-ui-descriptor.mjson';
            } else if (object === this.root[3]) {
                return 'montage/test/mocks/data/models/customer-ui-descriptor.mjson';
            }
        }
    },

    cascadingListWillUseInspectorComponentModuleForObjectAtColumnIndex: {
        value: function (cascadingList, componentModule, object, columnIndex, context) {
            if (object instanceof Employee && (!object.firstname || context.isEditing)) {
                return context.userInterfaceDescriptor.creatorInspectorComponentModule;
            }
        }
    },

    listItemWillUseLabelForObjectAtRowIndex: {
        value: function (listItem, label, object, rowIndex, list) {
            if (object === this.root[0]) {
                return 'Employees';
            } else if (object === this.root[1]) {
                return 'Departments';
            } else if (object === this.root[2]) {
                return 'Stores';
            } else if (object === this.root[3]) {
                return 'Customers';
            } else if (object === this.root[4]) {
                return 'Settings';
            }
        }
    },
   
    listItemWillUseIconNameForObjectAtRowIndex: {
        value: function (listItem, moduleId, object, rowIndex, list) {
            if (object === this.root[0]) {
                return 'people';
            }
        }
    },

    listItemWillUseIconComponentModuleIdForObjectAtRowIndex: {
        value: function (listItem, moduleId, object, rowIndex, list) {
            if (object === this.root[1]) {
                return 'montage/test/mocks/data/icons/department.reel';
            }
        }
    },

    listItemWillUseIconSrcForObjectAtRowIndex: {
        value: function (listItem, moduleId, object, rowIndex, list) {
            if (object === this.root[2]) {
                return 'http://' + window.location.host +
                    '/test/mocks/data/icons/svgs/stores.svg';
            }
        }
    },

    handleCascadingListPush: {
        value: function (event) {
            console.log('CascadingListPush', event.detail);
        }
    },

    handleCascadingListPop: {
        value: function (event) {
            console.log('CascadingListPop', event.detail);
        }
    },

    handleHeaderRightAction: {
        value: function (event) {
            var cascadingListContext = event.detail.get('context');

            if (cascadingListContext) {
                if (cascadingListContext && cascadingListContext.object === this.root[0]) {
                    this.cascadingList.expand(
                        new Employee(),
                        cascadingListContext.columnIndex + 1
                    );
                } else if (cascadingListContext.object instanceof Employee) {
                    this.cascadingList.expand(
                        cascadingListContext.object,
                        cascadingListContext.columnIndex,
                        true
                    );
                }
            }
        }
    },

    handleSaveAction: {
        value: function (event) {
            var cascadingListContext = event.detail.get('data');

            if (cascadingListContext &&
                cascadingListContext.object instanceof Employee &&
                cascadingListContext.object.firstname &&
                cascadingListContext.object.lastname &&
                cascadingListContext.object.department
            ) {
                if (this.root[0].indexOf(cascadingListContext.object) === -1) {
                    this.root[0].push(cascadingListContext.object);
                    this.cascadingList.pop();
                } else {
                    this.cascadingList.expand(
                        cascadingListContext.object,
                        cascadingListContext.columnIndex
                    );
                }
            }
        }
    },

    handleCancelAction: {
        value: function (event) {
            var cascadingListContext = event.detail.get('data');

            if (cascadingListContext &&
                cascadingListContext.object instanceof Employee
            ) {
                if (this.root[0].indexOf(cascadingListContext.object) === -1) {
                    this.cascadingList.pop();
                } else {
                    this.cascadingList.expand(
                        cascadingListContext.object,
                        cascadingListContext.columnIndex
                    );
                }
            }
        }
    }

});
