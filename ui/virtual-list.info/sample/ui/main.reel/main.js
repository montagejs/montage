var Component = require("montage/ui/component").Component,
    MockService = require('montage/test/mocks/data/services/mock-service').MockService,
    customerUIDescriptor = require('montage/test/mocks/data/models/customer-ui-descriptor.mjson').montageObject;

exports.Main = Component.specialize(/** @lends Main# */{

    constructor: {
        value: function () {
            this.mockService = new MockService();
            var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
                length,    
                strings = [],    
                text;


            for (var i = 0; i < 50; i++) {
                text = "";
                length = Math.floor(Math.random() * (7 - 3 + 1) + 3);

                for (var ii = 0; ii < length; ii++) {
                    text += chars.charAt(Math.floor(Math.random() * chars.length));
                }

                strings.push(text);
            }

            this.strings = strings;
            this.employees = this.mockService.fetchEmployees();
            this.customers = this.mockService.fetchCustomers();
            this.customerUIDescriptor = customerUIDescriptor;
        }
    }
  
});
