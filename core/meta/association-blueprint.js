"use strict";
/**
 @module montage/core/remote-reference
 @requires montage/core/core
 @requires core/promise
 @requires core/logger
 */
var Montage = require("montage").Montage;
var BlueprintReference = require("core/meta/blueprint-reference").BlueprintReference;
var PropertyBlueprint = require("core/meta/property-blueprint").PropertyBlueprint;

var logger = require("core/logger").logger("blueprint");

/**
 @class module:montage/core/blueprint.AssociationBlueprint
 */
var AssociationBlueprint = exports.AssociationBlueprint = Montage.create(PropertyBlueprint, /** @lends module:montage/core/blueprint.AssociationBlueprint# */ {

    serializeSelf: {
        value: function(serializer) {
            serializer.setProperty("targetBlueprint", this._targetBlueprintReference);
            var parentCall = Object.getPrototypeOf(AssociationBlueprint).serializeSelf;
            parentCall.call(this, serializer);
        }
    },

    deserializeSelf: {
        value: function(deserializer) {
            var parentCall = Object.getPrototypeOf(AssociationBlueprint).deserializeSelf;
            parentCall.call(this, deserializer);
            this._targetBlueprintReference = deserializer.getProperty("targetBlueprint");
        }
    },

    /*
     @private
     */
    _targetBlueprintReference: {
        value: null
    },

    /**
     Promise for the blueprint targeted by this association<br/>
     <b>Note</b> The setter expects an actual blueprint but the getter will return a promise
     @type {Property}
     @default {Object} null
     */
    targetBlueprint: {
        serializable: false,
        get: function() {
            return this._targetBlueprintReference.promise(this.require);
        },
        set: function(blueprint) {
            this._targetBlueprintReference = BlueprintReference.create().initWithValue(blueprint);
        }
    },

    /**
     Description TODO
     @type {Property}
     @default {Boolean} false
     */
    isAssociationBlueprint: {
        get: function() {
            return true;
        }
    }

});
