var Montage = require("montage").Montage;

/**
 * @class Person
 * @extends Montage
 */
exports.PersonB = Montage.specialize({

    name: {
        value: undefined
    },

    birthday: {
        value: undefined
    }

});
