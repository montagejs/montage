var Montage = require("montage").Montage;

/**
 * @class Person
 * @extends Montage
 */
exports.PersonC = Montage.specialize({

    name: {
        value: undefined
    },

    birthday: {
        value: undefined
    }

});
