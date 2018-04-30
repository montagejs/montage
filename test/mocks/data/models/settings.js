var Montage = require("montage").Montage;

/**
 * @class Settings
 * @extends Montage
 */
exports.Settings = Montage.specialize({

    constructor: {
        value: function (label, description, value) {
            this.label = label;
            this.description = description;
            this.value = value;

            if (label === 'Restrictions') {
                this.defineBindings({
                    "description": {
                        "<-": "value ? 'ON' : 'OFF'"
                    }
                });
            }
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
