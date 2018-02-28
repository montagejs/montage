var DataModel = require("./data-model").DataModel;

/**
 * @class Store
 * @extends Montage
 */
exports.Store = DataModel.specialize({

    constructor: {
        value: function (name, city) {
            this.name = name;
            this.city = city;
        }
    },

    name: {
        value: null
    },

    city: {
        value: null
    }

});
