var Montage = require("montage").Montage;

/**
 * @class Check
 * @extends Montage
 */
exports.Check = Montage.specialize({

    constructor: {
        value: function () {
            this.label = 'check';
            this.value = false;

            this.defineBindings({
                "description": {
                    "<-": "value ? 'ON' : 'OFF'"
                }
            });
        }
    },

    description: {
        value: null
    },

    label: {
        value: null
    },

    value: {
        value: null
    }

});
