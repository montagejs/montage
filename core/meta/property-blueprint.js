"use strict";
/**
 @module montage/core/blueprint
 @requires montage/core/core
 @requires core/exception
 @requires core/promise
 @requires core/logger
 */
var Montage = require("montage").Montage;

var logger = require("core/logger").logger("blueprint");

/**
 @class module:montage/core/blueprint.PropertyBlueprint
 */
exports.PropertyBlueprint = Montage.create(Montage, /** @lends module:montage/core/blueprint.PropertyBlueprint# */ {

    /**
     Initialize a newly allocated property blueprint.
     @function
     @param {String} name name of the property blueprint to create
     @param {Blueprint} blueprint
     @param {Number} cardinality name of the property blueprint to create
     @returns itself
     */
    initWithNameBlueprintAndCardinality: {
        value: function(name, blueprint, cardinality) {
            this._name = (name !== null ? name : "default");
            this._blueprint = blueprint;
            this._cardinality = (cardinality > 0 ? cardinality : 1);
            return this;
        }
    },

    serializeSelf: {
        value: function(serializer) {
            serializer.setProperty("name", this.name);
            serializer.setProperty("blueprint", this.blueprint, "reference");
            if (this.cardinality === Infinity) {
                serializer.setProperty("cardinality", -1);
            } else {
                serializer.setProperty("cardinality", this.cardinality);
            }
            serializer.setProperties();
        }
    },

    deserializeSelf: {
        value: function(deserializer) {
            this._name = deserializer.getProperty("name");
            this._blueprint = deserializer.getProperty("blueprint");
            var cardinality = deserializer.getProperty("cardinality");
            if (cardinality === -1) {
                this._cardinality = Infinity;
            } else {
                this._cardinality = cardinality;
            }
            // FIXME [PJYF Jan 8 2013] There is an API issue in the deserialization
            // We should be able to write deserializer.getProperties sight!!!
            var propertyNames = Montage.getSerializablePropertyNames(this);
            for (var i = 0, l = propertyNames.length; i < l; i++) {
                var propertyName = propertyNames[i];
                this[propertyName] = deserializer.getProperty(propertyName);
            }
        }
    },

    /*
     * @private
     */
    _blueprint: {
        value: null
    },

    /*
     * Component description attached to this property blueprint.
     */
    blueprint: {
        get: function() {
            return this._blueprint;
        }
    },

    /**
     @private
     */
    _name: {
        value: null
    },

    /**
     Name of the object. The name is used to define the property on the object.
     @function
     @returns {String} this._name
     */
    name: {
        serializable: false,
        get: function() {
            return this._name;
        }
    },

    /**
     The identifier is the name of the blueprint, dot, the name of the
     property blueprint, and is used to make the serialization of property blueprints more
     readable.
     @type {Property}
     @default {String} this.name
     */
    identifier: {
        get: function() {
            return [
                this.blueprint.identifier,
                this.name
            ].join("_");
        }
    },

    /**
     Description TODO
     @private
     */
    _cardinality: {
        value: 1
    },

    /**
     Cardinality of the property blueprint.<br/>
     The Cardinality of an property blueprint is the number of values that can be stored.
     A cardinality of one means that only one object can be stored. Only positive values are legal. A value of infinity means that any number of values can be stored.
     @type {Property}
     @default {Number} 1
     */
    cardinality: {
        get: function() {
            return this._cardinality;
        }
    },

    /**
     Description TODO
     @type {Property}
     @default {Boolean} false
     */
    mandatory: {
        value: false
    },

    /**
     Description TODO
     @type {Property}
     @default {Boolean} false
     */
    denyDelete: {
        value: false
    },

    /**
     Description TODO
     @type {Property}
     @default {Boolean} false
     */
    readOnly: {
        value: false
    },

    /**
     Description TODO
     @type {Property}
     @default {Boolean} false
     */
    isAssociationBlueprint: {
        get: function() {
            return false;
        }
    },

    /**
     Description TODO
     @type {Property}
     @default {Boolean} false
     */
    isToMany: {
        get: function() {
            return this.cardinality > 1;
        }
    },

    /**
     Description TODO
     @type {Property}
     @default {Boolean} false
     */
    isDerived: {
        get: function() {
            return false;
        }
    },

    /**
     Description TODO
     @type {Property}
     @default {String} "string"
     */
    valueType: {
        value: "string"
    },

    /**
     Description TODO
     @type {Property}
     @default {Object} null
     */
    valueObjectPrototypeName: {
        value: null
    },

    /**
     Description TODO
     @type {Property}
     @default {Object} null
     */
    valueObjectModuleId: {
        value: null
    },

    _enumValues: {
        value: null
    },

    /**
     * List of values for enumerated value types
     * @type {Property}
     * @default {Object} null
     */
    enumValues: {
        get: function() {
            if (!this._enumValues) {
                return [];
            }
            return this._enumValues_enumValues;
        },
        set: function(value) {
            if (Array.isArray(value)) {
                this._enumValues = value;
            }
        }
    },

    helpKey: {
        value: ""
    }

});