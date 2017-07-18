var Montage = require("../../core").Montage,
    deprecate = require("../../deprecate");

var ValuesDeserializer = Montage.specialize( {
    _object: {value: null},
    _objectDescriptor: {value: null},
    _context: {value: null},

    initWithObjectAndObjectDescriptorAndContext: {
        value: function (object, objectDescriptor, context) {
            this._object = object;
            this._objectDescriptor = objectDescriptor;
            this._context = context;

            return this;
        }
    },

    get: {
        value: function (name) {
            if (this._objectDescriptor.values) {
                return this._objectDescriptor.values[name];
            } else if (this._objectDescriptor.properties) { // deprecated
                return this._objectDescriptor.properties[name];
            }
        }
    },

    deserializeProperties: {
        value: deprecate.deprecateMethod(void 0, function (propertyNames) {
            return this.deserializeValues(propertyNames);
        }, "deserializeProperties", "deserializeValues")
    },

    deserializeValues: {
        value: function (propertyNames) {
            var object = this._object,
                // .properties deprecated
                values = this._objectDescriptor.values || this._objectDescriptor.properties,
                propertyName;

            if (values) {
                if (!propertyNames) {
                    propertyNames = Montage.getSerializablePropertyNames(object);
                }

                for (var i = 0, ii = propertyNames.length; i < ii; i++) {
                    propertyName = propertyNames[i];
                    object[propertyName] = values[propertyName];
                }
            }
        }
    },

    getObjectByLabel: {
        value: function (label) {
            this._context.getObject(label);
        }
    }
});

exports.ValuesDeserializer = ValuesDeserializer;
