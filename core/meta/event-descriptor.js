var Montage = require("../core").Montage,
    logger = require("../logger").logger("objectDescriptor"),
    deprecate = require("../deprecate"),
    Defaults = {
        name: "default",
        detailKeys: [],
        detailValueTypes: [],
        helpKey: ""
    };

/**
 * @class EventDescriptor
 */
exports.EventDescriptor = Montage.specialize( /** @lends EventDescriptor# */ {

    constructor: {
        value: function EventDescriptor() {
            this._detailKeys = [];
        }
    },

    /**
     * Initialize a newly allocated event descriptor.
     * @function
     * @param {string} name name of the event descriptor to create
     * @param {ObjectDescriptor} objectDescriptor
     * @returns itself
     */
    initWithNameAndObjectDescriptor: {
        value:function (name, objectDescriptor) {
            this._name = (name !== null ? name : Defaults.name);
            this._owner = objectDescriptor;
            return this;
        }
    },

    /**
     * Initialize a newly allocated event descriptor.
     * @deprecated
     * @function
     * @param {string} name name of the event descriptor to create
     * @param {ObjectDescriptor} objectDescriptor
     * @returns itself
     */
    initWithNameAndBlueprint: {
        value: deprecate.deprecateMethod(void 0, function (name, blueprint) {
            return this.initWithNameAndObjectDescriptor(name, blueprint);
        }, "new EventBlueprint().initWithNameAndBlueprint", "new EventDescriptor().initWithNameAndObjectDescriptor")
    },

    serializeSelf: {
        value:function (serializer) {
            serializer.setProperty("name", this.name);
            serializer.setProperty("objectDescriptor", this._owner, "reference");
            if (this.detailKeys.length > 0) {
                this._setPropertyWithDefaults(serializer, "detailKeys", this.detailKeys);
            }
            this._setPropertyWithDefaults(serializer, "helpKey", this.helpKey);
        }
    },

    deserializeSelf: {
        value:function (deserializer) {
            this._name = deserializer.getProperty("name");
            this._owner = deserializer.getProperty("objectDescriptor") || deserializer.getProperty("blueprint");
            this.detailKeys = this._getPropertyWithDefaults(deserializer, "detailKeys");
            this.helpKey = this._getPropertyWithDefaults(deserializer, "helpKey");
        }
    },

    _setPropertyWithDefaults: {
        value:function (serializer, propertyName, value) {
            if (value != Defaults[propertyName]) {
                serializer.setProperty(propertyName, value);
            }
        }
    },

    _getPropertyWithDefaults: {
        value:function (deserializer, propertyName) {
            var value = deserializer.getProperty(propertyName);
            return value ? value : Defaults[propertyName];
        }
    },

    _owner: {
        value:null
    },

    /**
     * Component description attached to this event descriptor.
     * @type {Component}
     */
    owner: {
        get:function () {
            return this._owner;
        }
    },

    _name: {
        value:null
    },

    /**
     * Name of the object. The name is used to define the property on the
     * object.
     * @readonly
     * @type {string}
     */
    name: {
        serializable:false,
        get:function () {
            return this._name;
        }
    },

    /**
     * The identifier is the name of the event descriptor, dot, the name of the event
     * descriptor, and is used to make the serialization of property descriptors
     * more readable.
     * @type {string}
     * @default `this.name`
     */
    identifier: {
        get:function () {
            return [
                this.owner.identifier,
                this.name
            ].join("_");
        }
    },

    _detailKeys: {
        value:null
    },

    /**
     * List of key for the details dictionary
     * @type {Array.<string>}
     * @default []
     */
    detailKeys: {
        get:function () {
            return this._detailKeys;
        },
        set:function (value) {
            if (Array.isArray(value)) {
                this._detailKeys = value;
            }
        }
    },

    helpKey: {
        value: Defaults["helpKey"]
    },

    objectDescriptorModuleId: require("../core")._objectDescriptorModuleIdDescriptor,
    objectDescriptor: require("../core")._objectDescriptorDescriptor,

    /******************************************************************************
     * Deprecated Methods
     */

    blueprintModuleId: require("../core")._blueprintModuleIdDescriptor,
    blueprint: require("../core")._blueprintDescriptor

});
