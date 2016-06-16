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
    }

});
