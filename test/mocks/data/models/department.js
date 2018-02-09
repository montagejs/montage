var DataModel = require("./data-model").DataModel;

/**
 * @class Department
 * @extends DataModel
 */
exports.Department = DataModel.specialize({

    constructor: {
        value: function (name) {
            this.name = name;
        }
    },

    name: {
        value: null
    }

});
