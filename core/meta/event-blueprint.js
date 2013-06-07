"use strict";
/**
 @module montage/core/meta/property-blueprint
 @requires montage/core/core
 @requires core/exception
 @requires core/promise
 @requires core/logger
 */
var Montage = require("montage").Montage;

var logger = require("core/logger").logger("blueprint");

var Defaults = {
    name:"default",
    detailKeys:[],
    detailValueTypes:[],
    helpKey:""
};

/**
 @class EventBlueprint
 */
exports.EventBlueprint = Montage.specialize( /** @lends EventBlueprint# */ {

    constructor: {
        value: function EventBlueprint() {
            this.super();
        }
    },
    
    /**
     Initialize a newly allocated property blueprint.
     @function
     @param {String} name name of the property blueprint to create
     @param {Blueprint} blueprint
     @param {Number} cardinality name of the property blueprint to create
     @returns itself
     */
    initWithNameAndBlueprint:{
        value:function (name, blueprint, cardinality) {
            this._name = (name !== null ? name : Defaults["name"]);
            this._owner = blueprint;
            return this;
        }
    },

    serializeSelf:{
        value:function (serializer) {
            serializer.setProperty("name", this.name);
            serializer.setProperty("blueprint", this._owner, "reference");
            if (this.detailKeys.length > 0) {
                this._setPropertyWithDefaults(serializer, "detailKeys", this.detailKeys);
            }
            this._setPropertyWithDefaults(serializer, "helpKey", this.helpKey);
        }
    },

    deserializeSelf:{
        value:function (deserializer) {
            this._name = deserializer.getProperty("name");
            this._owner = deserializer.getProperty("blueprint");
            this.detailKeys = this._getPropertyWithDefaults(deserializer, "detailKeys");
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

    /*
     * @private
     */
    _owner:{
        value:null
    },

    /*
     * Component description attached to this property blueprint.
     */
    owner:{
        get:function () {
            return this._owner;
        }
    },

    /**
     @private
     */
    _name:{
        value:null
    },

    /**
     Name of the object. The name is used to define the property on the object.
     @function
     @returns {String} this._name
     */
    name:{
        serializable:false,
        get:function () {
            return this._name;
        }
    },

    /**
     The identifier is the name of the blueprint, dot, the name of the
     event blueprint, and is used to make the serialization of property blueprints more
     readable.
     @type {Property}
     @default {String} this.name
     */
    identifier:{
        get:function () {
            return [
                this.owner.identifier,
                this.name
            ].join("_");
        }
    },

    _detailKeys:{
        value:null
    },

    /**
     * List of key for the details dictionary
     * @type {Property}
     * @default {Object} empty array
     */
    detailKeys:{
        get:function () {
            if (!this._detailKeys) {
                return [];
            }
            return this._detailKeys;
        },
        set:function (value) {
            if (Array.isArray(value)) {
                this._detailKeys = value;
            }
        }
    },


    helpKey:{
        value:Defaults["helpKey"]
    },

    blueprintModuleId:require("montage")._blueprintModuleIdDescriptor,

    blueprint:require("montage")._blueprintDescriptor

});
