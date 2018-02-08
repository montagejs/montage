var DataModel = require("./data-model").DataModel;

/**
 * @class Employee
 * @extends Montage
 */
exports.Employee = DataModel.specialize({

    constructor: {
        value: function (firstname, lastname, department) {
            this.firstname = firstname;
            this.lastname = lastname;
            this.department = department;
        }
    },

    firstname: {
        value: null
    },

    lastname: {
        value: null
    },

    department: {
        value: null
    }

});
