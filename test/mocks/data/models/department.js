var DataModel = require("./data-model").DataModel;

/**
 * @class Department
 * @extends DataModel
 */
exports.Department = DataModel.specialize({

    constructor: {
        value: function (name, thumbnail) {
            this.name = name;
            this.thumbnail = 'http://' + window.location.host +
                '/test/mocks/data/icons/svgs/' + thumbnail;
        }
    },

    name: {
        value: null
    },

    thumbnail: {
        value: null
    }

});
