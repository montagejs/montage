var Montage = require("montage").Montage;

/**
 * @class Person
 * @extends Montage
 */
exports.Person = Montage.specialize({

    name: {
        value: undefined
    },

    birthday: {
        value: undefined
    }

});
