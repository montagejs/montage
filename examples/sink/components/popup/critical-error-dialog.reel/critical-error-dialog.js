var Montage = require("montage").Montage;
var Component = require("montage/ui/component").Component;

var CriticalErrorDialog = exports.CriticalErrorDialog = Montage.create(Component, {

    msg: {
        value: ''
    },

    details: {
        value: ''
    },

    draw: {
        value: function() {
        }
    },

    _popup: {
        value: null
    },
    popup: {
        set: function(value) {
            this._popup = value;
        },
        get: function() {
            return this._popup;
        }
    },

    handleRestartAction: {
        value: function(value) {
            var anEvent = document.createEvent("CustomEvent");
            anEvent.initCustomEvent("message_restart", true, true, 'Restart Device');
            this.dispatchEvent(anEvent);
        }
    },
    handleRestartLaterAction: {
        value: function(value) {
            if(this.popup) {
                this.popup.hide();
            }
        }
    },
    prepareForDraw: {
        value: function() {
            // Invoke Google pretty printer on source code samples
            prettyPrint();
        }
    }

});
