var Montage = require("../../core").Montage;
var Promise = require("../../promise").Promise;

var PropertiesDeserializer = Montage.specialize( {
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
            if (this._objectDescriptor.properties) {
                return this._objectDescriptor.properties[name];
            }
        }
    },

    deserializeProperties: {
        value: function (propertyNames) {
            var object = this._object,
                properties = this._objectDescriptor.properties,
                propertyName;

            if (properties) {
                if (!propertyNames) {
                    propertyNames = Montage.getSerializablePropertyNames(object);
                }

                for (var i = 0, ii = propertyNames.length; i < ii; i++) {
                    propertyName = propertyNames[i];
                    object[propertyName] = properties[propertyName];
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

exports.PropertiesDeserializer = PropertiesDeserializer;
