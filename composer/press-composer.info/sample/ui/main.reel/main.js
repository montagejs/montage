var Component = require("montage/ui/component").Component;

exports.Main = Component.specialize({


    _configuration: {
        value: null
    },

    configuration: {
        get: function () {
            if (!this._configuration) {
                this._configuration = require("./config.json");
            }

            return this._configuration;
        }
    },

    numbers: {
        value: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]
    }

});
