"use strict";
/**
 @module montage/core/blueprint
 @requires montage/core/core
 @requires core/exception
 @requires core/promise
 @requires core/logger
 */
var Montage = require("montage").Montage;
var PropertyBlueprint = require("core/meta/property-blueprint").PropertyBlueprint;

var logger = require("core/logger").logger("blueprint");

/**
 A derived is property blueprint is calculated using other property blueprints of the object.<br/>

 @class module:montage/core/blueprint.DerivedPropertyBlueprint
 */
exports.DerivedPropertyBlueprint = Montage.create(PropertyBlueprint, /** @lends module:montage/core/blueprint.DerivedPropertyBlueprint# */ {
    /**
     Description TODO
     @type {Property}
     @default {Boolean} true
     */
    isDerived: {
        get: function() {
            return true;
        },
        serializable: false
    },

    /**
     List of property blueprints this derived property blueprint depends on.
     @type {Property}
     @default {Array} []
     */
    dependencies: {
        value: [],
        serializable: true
    },
    /**
     Description TODO
     @type {Property}
     @default null
     */
    getterDefinition: {
        value: null,
        serializable: true
    },

    /**
     Description TODO
     @type {Property}
     @default null
     */
    setterDefinition: {
        value: null,
        serializable: true
    }

});
