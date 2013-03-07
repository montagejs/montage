var Montage = require("core/core").Montage;
var Promise = require("core/promise").Promise;

var UnitDeserializer = Montage.create(Montage, {
    _context: {value: null},

    create: {
        value: function() {
            return Montage.create(this);
        }
    },

    initWithContext: {
        value: function(context) {
            this._context = context;

            return this;
        }
    },

    getObjectByLabel: {
        value: function(label) {
            return this._context.getObject(label);
        }
    }
});

exports.UnitDeserializer = UnitDeserializer;