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

    myListProperty: {
        value: [{
            "quote": "If music be the food of love, play on.",
            "important": false
        }, {
            "quote": "O Romeo, Romeo! wherefore art thou Romeo?",
            "important": true
        }, {
            "quote": "All that glitters is not gold.",
            "important": false
        }, {
            "quote": "I am amazed and know not what to say.",
            "important": false
        }]
    },

    templateDidLoad: {
        value: function () {
            this.templateObjects.cases.selection = [this.configuration.cases[0]];
        }
    }

});
