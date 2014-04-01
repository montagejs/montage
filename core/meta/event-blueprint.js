"use strict";
/**
 * @module montage/core/meta/property-blueprint
 * @requires montage/core/core
 * @requires core/exception
 * @requires core/promise
 * @requires core/logger
 */
var Montage = require("../core").Montage;

var logger = require("../logger").logger("blueprint");

var Defaults = {
    name:"default",
    detailKeys:[],
    detailValueTypes:[],
    helpKey:""
};

/**
 * @class EventBlueprint
 */
exports.EventBlueprint = Montage.specialize( /** @lends EventBlueprint# */ {

    constructor: {
        value: function EventBlueprint() {
            this.superForValue("constructor")();
            this._detailKeys = [];
        }
    },

    /**
     * Initialize a newly allocated property blueprint.
     * @function
     * @param {string} name name of the property blueprint to create
     * @param {Blueprint} blueprint
     * @returns itself
     */
    initWithNameAndBlueprint: {
        value:function (name, blueprint) {
            this._name = (name !== null ? name : Defaults.name);
            this._owner = blueprint;
            return this;
        }
    },

    serializeSelf: {
        value:function (serializer) {
            serializer.setProperty("name", this.name);
            serializer.setProperty("blueprint", this._owner, "reference");
            if (this.detailKeys.length > 0) {
                this._setPropertyWithDefaults(serializer, "detailKeys", this.detailKeys);
            }
            this._setPropertyWithDefaults(serializer, "helpKey", this.helpKey);
        }
    },

    deserializeSelf: {
        value:function (deserializer) {
            this._name = deserializer.getProperty("name");
            this._owner = deserializer.getProperty("blueprint");
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
     * Component description attached to this property blueprint.
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
     * The identifier is the name of the blueprint, dot, the name of the event
     * blueprint, and is used to make the serialization of property blueprints
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

    blueprintModuleId: require("../core")._blueprintModuleIdDescriptor,

    blueprint: require("../core")._blueprintDescriptor

});

