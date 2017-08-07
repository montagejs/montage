var PropertyDescriptor = require("./property-descriptor").PropertyDescriptor,
    logger = require("../logger").logger("objectDescriptor"),
    Defaults = {
        dependencies:[],
        getterDefinition:"",
        setterDefinition:""
    };

/**
 * A derived descriptor is calculated by using other property descriptors of the object.
 * @class DerivedDescriptor
 */
exports.DerivedDescriptor = PropertyDescriptor.specialize( /** @lends DerivedDescriptor# */ {

    serializeSelf: {
        value: function (serializer) {
            if (this.dependencies.length > 0) {
                this._setPropertyWithDefaults(serializer, "dependencies", this.dependencies);
            }
            this._setPropertyWithDefaults(serializer, "getterDefinition", this.getterDefinition);
            this._setPropertyWithDefaults(serializer, "setterDefinition", this.setterDefinition);
        }
    },

    deserializeSelf: {
        value: function (deserializer) {
            this.dependencies = this._getPropertyWithDefaults(deserializer, "dependencies");
            this.getterDefinition = this._getPropertyWithDefaults(deserializer, "getterDefinition");
            this.setterDefinition = this._getPropertyWithDefaults(deserializer, "setterDefinition");
        }
    },

    _setPropertyWithDefaults:{
        value:function (serializer, propertyName, value) {
            if (value != Defaults[propertyName]) {
                serializer.setProperty(propertyName, value);
            }
        }
    },

    _getPropertyWithDefaults:{
        value:function (deserializer, propertyName) {
            var value = deserializer.getProperty(propertyName);
            return value ? value : Defaults[propertyName];
        }
    },

    /**
     * @type {boolean}
     * @default true
     */
    isDerived: {
        get: function () {
            return true;
        },
        serializable: false
    },

    /**
     * List of property descriptors this derived property descriptor depends on.
     * @private
     * @type {Array.<PropertyDescriptor>}
     * @default []
     */
    _dependencies: {
        value: null
    },

    /**
     * List of property descriptors this derived property descriptor depends on.
     * @type {Array.<PropertyDescriptor>}
     * @default []
     */
    dependencies: {
        get: function() {
            return this._dependencies || (this._dependencies = []);
        }
    },

    /**
     * @type {string}
     */
    getterDefinition: {
        value: Defaults["getterDefinition"]
    },

    /**
     * @type {string}
     */
    setterDefinition: {
        value: Defaults["setterDefinition"]
    }

});
