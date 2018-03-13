var Component = require("montage/ui/component").Component,
    MockService = require('montage/test/mocks/data/services/mock-service').MockService;

exports.Main = Component.specialize(/** @lends Main# */{

    constructor: {
        value: function () {
            this.mockService = new MockService();
            this.employees = this.mockService.fetchEmployees();
            this.customers = this.mockService.fetchCustomers();
            this.departments = this.mockService.fetchDepartments();
            this.settings = this.mockService.fetchSettings();
        }
    },

    listItemWillUseDescriptionPositionForObjectAtRowIndex: {
        value: function (listItem, descriptionPosition, object, rowIndex, list) {
            if (object === this.employees[1]) {
                return 'bottom';
            }
        }
    },

    listItemShouldEnableNavigationForObjectAtRowIndex: {
        value: function (listItem, isNavigationEnabled, object, rowIndex, list) {
            if (object === this.departments[1] || object === this.settings[2]) {
                return true;
            }
        }
    },

    listItemWillUseUserInterfaceDescriptorModuleIdForObjectAtRowIndex: {
        value: function (listItem, UIDescriptor, object, rowIndex, list) {
            if (object === this.settings[1] || object === this.settings[2]) {
                return 'montage/test/mocks/data/models/settings-ui-descriptor.mjson';
            }
        }
    }
  
});
