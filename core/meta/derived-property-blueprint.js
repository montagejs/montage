"use strict";
/**
 * @module montage/core/blueprint
 * @requires montage/core/core
 * @requires core/exception
 * @requires core/promise
 * @requires core/logger
 */
var Montage = require("../core").Montage;
var PropertyBlueprint = require("./property-blueprint").PropertyBlueprint;

var logger = require("../logger").logger("blueprint");

var Defaults = {
    dependencies:[],
    getterDefinition:"",
    setterDefinition:""
};

/**
 * A derived is property blueprint is calculated using other property blueprints of the object.
 * @class DerivedPropertyBlueprint
 */
exports.DerivedPropertyBlueprint = PropertyBlueprint.specialize( /** @lends DerivedPropertyBlueprint# */ {

    constructor: {
        value: function DerivedPropertyBlueprint() {
            this.superForValue("constructor")();
        }
    },

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
     * List of property blueprints this derived property blueprint depends on.
     * @type {Array.<PropertyBlueprint>}
     * @default []
     */
    dependencies: {
        value: [],
        distinct:true
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

