var Component = require("montage/ui/component").Component,
    ListItem = require("montage/ui/list-item.reel").ListItem,
    MockService = require('montage/test/mocks/data/services/mock-service').MockService;

exports.Main = Component.specialize(/** @lends Main# */{

    constructor: {
        value: function () {
            this.mockService = new MockService();
            this.employees = this.mockService.fetchEmployees();
            this.customers = this.mockService.fetchCustomers();
            this.departments = this.mockService.fetchDepartments();
            this.settings = this.mockService.fetchSettings();
            this.stores = this.mockService.fetchStores();
            this.check = this.mockService.fetchCheck();
        }
    },

    listItemWillUseDescriptionPositionForObjectAtRowIndex: {
        value: function (listItem, descriptionPosition, object, rowIndex, list) {
            if (object === this.employees[1]) {
                return 'bottom';
            }
        }
    },

    listItemShouldBeExpandableForObjectAtRowIndex: {
        value: function (listItem, isNavigationEnabled, object, rowIndex, list) {
            if (object === this.departments[1] || object === this.settings[2]) {
                return true;
            }
        }
    },

    componentWillUseUserInterfaceDescriptorModuleIdForObject: {
        value: function (component, UIDescriptor, object) {
            if (component instanceof ListItem) {
                if (object === this.settings[1] || object === this.settings[2]) {
                    return 'montage/test/mocks/data/models/settings-ui-descriptor.mjson';
                } else if (object === this.check) {
                    return 'montage/test/mocks/data/models/check-ui-descriptor.mjson';
                }
            }
        }
    },

    listItemWillUseLabelForObjectAtRowIndex: {
        value: function (listItem, label, object, rowIndex, list) {
            if (object === this.employees[2]) {
                return 'label overridden';
            }
        }
    },

    listItemWillUseDescriptionForObjectAtRowIndex: {
        value: function (listItem, description, object, rowIndex, list) {
            if (object === this.employees[2]) {
                return 'description + icon module overridden';
            } else if (object === this.employees[3]) {
                return 'description + icon src overridden';
            } else if (object === this.employees[4]) {
                return 'description + icon name overridden';
            }
        }
    },

    listItemWillUseIconComponentModuleIdForObjectAtRowIndex: {
        value: function (listItem, iconComponentModuleId, object, rowIndex, list) {
            if (object === this.employees[2]) {
                return 'montage/test/mocks/data/icons/department.reel';
            }
        }
    },

    listItemWillUseIconSrcForObjectAtRowIndex: {
        value: function (listItem, iconSrc, object, rowIndex, list) {
            if (object === this.employees[3]) {
                return 'http://' + window.location.host +
                    '/test/mocks/data/icons/svgs/stores.svg';
            }
        }
    },

    listItemWillUseToggleComponentModuleIdForObjectAtRowIndex: {
        value: function (listItem, toogleComponentModuleId, object, rowIndex, list) {
            if (object === this.settings[1] && listItem === this.listItem38) {
                return "montage/test/mocks/data/icons/check.reel";
            }
        }
    }
  
});
