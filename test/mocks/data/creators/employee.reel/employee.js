var Component = require("../../../../../ui/component").Component,
    MockService = require('../../services/mock-service').MockService;

exports.Employee = Component.specialize(/** @lends Employee# */{

    constructor: {
        value: function () {
            this.mockService = new MockService();
            this.departments = this.mockService.fetchDepartments(); 
        }
    }

});
