var Montage = require("montage").Montage;

/**
 * @class PersonD
 * @extends Montage
 */
exports.PersonD = Montage.specialize({

    name: {
        value: undefined
    },

    birthday: {
        value: undefined
    },

    employer: {
        value: undefined
    },

    position: {
        value: undefined
    }

});
