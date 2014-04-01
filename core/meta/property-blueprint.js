"use strict";
/**
 * @module montage/core/meta/property-blueprint
 * @requires montage/core/core
 * @requires core/exception
 * @requires core/promise
 * @requires core/logger
 */

var Montage = require("../core").Montage;
var Enum = require("../enum").Enum;

var logger = require("../logger").logger("blueprint");

var ValueType = new Enum().initWithMembers("string", "number", "boolean", "date", "enum", "url", "object");
var CollectionValueType = new Enum().initWithMembers("list", "set", "map");

// TODO change Defaults[*] to Defaults.* throughout. Needless performance
// degredation.
var Defaults = {
    name:"default",
    cardinality:1,
    mandatory:false,
    readOnly:false,
    denyDelete:false,
    valueType:"string",
    collectionValueType:"list",
    valueObjectPrototypeName:"",
    valueObjectModuleId:"",
    enumValues:[],
    helpKey:""
};

/**
 * @class PropertyBlueprint
 */
exports.PropertyBlueprint = Montage.specialize( /** @lends PropertyBlueprint# */ {

    constructor: {
        value: function PropertyBlueprint() {
            this.superForValue("constructor")();
        }
    },

    /**
     * Initialize a newly allocated property blueprint.
     * @method
     * @param {string} name name of the property blueprint to create
     * @param {Blueprint} blueprint
     * @param {number} cardinality name of the property blueprint to create
     * @returns itself
     */
    initWithNameBlueprintAndCardinality:{
        value:function (name, blueprint, cardinality) {
            this._name = (name !== null ? name : Defaults["name"]);
            this._owner = blueprint;
            this.cardinality = (cardinality > 0 ? cardinality : Defaults["cardinality"]);
            return this;
        }
    },

    serializeSelf:{
        value:function (serializer) {
            serializer.setProperty("name", this.name);
            serializer.setProperty("blueprint", this._owner, "reference");
            if (this.cardinality === Infinity) {
                serializer.setProperty("cardinality", -1);
            } else {
                this._setPropertyWithDefaults(serializer, "cardinality", this.cardinality);
            }
            this._setPropertyWithDefaults(serializer, "mandatory", this.mandatory);
            this._setPropertyWithDefaults(serializer, "readOnly", this.readOnly);
            this._setPropertyWithDefaults(serializer, "denyDelete", this.denyDelete);
            this._setPropertyWithDefaults(serializer, "valueType", this.valueType);
            this._setPropertyWithDefaults(serializer, "collectionValueType", this.collectionValueType);
            this._setPropertyWithDefaults(serializer, "valueObjectPrototypeName", this.valueObjectPrototypeName);
            this._setPropertyWithDefaults(serializer, "valueObjectModuleId", this.valueObjectModuleId);
            if (this.enumValues.length > 0) {
                this._setPropertyWithDefaults(serializer, "enumValues", this.enumValues);
            }
            this._setPropertyWithDefaults(serializer, "helpKey", this.helpKey);
        }
    },

    deserializeSelf:{
        value:function (deserializer) {
            this._name = deserializer.getProperty("name");
            this._owner = deserializer.getProperty("blueprint");
            this.cardinality = this._getPropertyWithDefaults(deserializer, "cardinality");
            if (this.cardinality === -1) {
                this.cardinality = Infinity;
            }
            this.mandatory = this._getPropertyWithDefaults(deserializer, "mandatory");
            this.readOnly = this._getPropertyWithDefaults(deserializer, "readOnly");
            this.denyDelete = this._getPropertyWithDefaults(deserializer, "denyDelete");
            this.valueType = this._getPropertyWithDefaults(deserializer, "valueType");
            this.collectionValueType = this._getPropertyWithDefaults(deserializer, "collectionValueType");
            this.valueObjectPrototypeName = this._getPropertyWithDefaults(deserializer, "valueObjectPrototypeName");
            this.valueObjectModuleId = this._getPropertyWithDefaults(deserializer, "valueObjectModuleId");
            this.enumValues = this._getPropertyWithDefaults(deserializer, "enumValues");
            this.helpKey = this._getPropertyWithDefaults(deserializer, "helpKey");
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

    _owner:{
        value:null
    },

    /**
     * Component description attached to this property blueprint.
     */
    owner:{
        get:function () {
            return this._owner;
        }
    },

    _name:{
        value:null
    },

    /**
     * Name of the object. The name is used to define the property on the
     * object.
     * @readonly
     * @type {string}
     */
    name:{
        serializable:false,
        get:function () {
            return this._name;
        }
    },

    /**
     * The identifier is the name of the blueprint, dot, the name of the
     * property blueprint, and is used to make the serialization of property
     * blueprints more readable.
     * @readonly
     * @type {string}
     */
    identifier:{
        get:function () {
            return [
                this.owner.identifier,
                this.name
            ].join("_");
        }
    },

    /**
     * Cardinality of the property blueprint.
     *
     * The Cardinality of an property blueprint is the number of values that
     * can be stored. A cardinality of one means that only one object can be
     * stored. Only positive values are legal. A value of infinity means that
     * any number of values can be stored.
     *
     * @type {number}
     * @default 1
     */
    cardinality:{
        value: Defaults["cardinality"]
    },

    /**
     * @type {boolean}
     * @default false
     */
    mandatory:{
        value: Defaults["mandatory"]
    },

    /**
     * @type {boolean}
     * @default false
     */
    denyDelete:{
        value: Defaults["denyDelete"]
    },

    /**
     * @type {boolean}
     * @default false
     */
    readOnly:{
        value: Defaults["readOnly"]
    },

    /**
     * @readonly
     * @type {boolean}
     * @default false
     */
    isAssociationBlueprint:{
        get:function () {
            return false;
        }
    },

    /**
     * Returns true if the cardinality is more than one.
     * @readonly
     * @type {boolean}
     * @default false
     */
    isToMany:{
        get:function () {
            return this.cardinality === Infinity || this.cardinality > 1;
        }
    },

    /**
     * @type {boolean}
     * @default false
     */
    isDerived:{
        get:function () {
            return false;
        }
    },

    /**
     * @type {string}
     */
    valueType:{
        value: Defaults["valueType"]
    },

    /**
     * @type {string}
     */
    collectionValueType:{
        value: Defaults["collectionValueType"]
    },

    /**
     * @type {string}
     */
    valueObjectPrototypeName:{
        value: Defaults["valueObjectPrototypeName"]
    },

    /**
     * @type {string}
     */
    valueObjectModuleId:{
        value: Defaults["valueObjectModuleId"]
    },

    _enumValues:{
        value:null
    },

    /**
     * List of values for enumerated value types
     * @type {Array}
     */
    enumValues:{
        get:function () {
            if (!this._enumValues) {
                return [];
            }
            return this._enumValues;
        },
        set:function (value) {
            if (Array.isArray(value)) {
                this._enumValues = value;
            }
        }
    },

    helpKey:{
        value: Defaults["helpKey"]
    },

    blueprintModuleId:require("../core")._blueprintModuleIdDescriptor,

    blueprint:require("../core")._blueprintDescriptor

});

