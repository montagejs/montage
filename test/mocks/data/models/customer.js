var DataModel = require("./data-model").DataModel;

/**
 * @class Customer
 * @extends Montage
 */
exports.Customer = DataModel.specialize({

    constructor: {
        value: function (firstname, lastname, city, premium) {
            this.firstname = firstname;
            this.lastname = lastname;
            this.city = city;
            this.premium = !!premium;
        }
    },

    firstname: {
        value: null
    },

    lastname: {
        value: null
    },

    city: {
        value: null
    },

    premium: {
        value: false
    }

});
