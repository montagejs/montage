"use strict";
/**
 * @module montage/core/meta/association-reference
 * @requires core/logger
 */
var BlueprintReference = require("./blueprint-reference").BlueprintReference;
var PropertyBlueprint = require("./property-blueprint").PropertyBlueprint;

var logger = require("../logger").logger("blueprint");

/**
 * @class AssociationBlueprint
 */
exports.AssociationBlueprint = PropertyBlueprint.specialize( /** @lends AssociationBlueprint# */ {

    constructor: {
        value: function AssociationBlueprint() {
            this.superForValue("constructor")();
        }
    },

    serializeSelf: {
        value: function (serializer) {
            serializer.setProperty("targetBlueprint", this._targetBlueprintReference);
            PropertyBlueprint.serializeSelf.call(this, serializer);
        }
    },

    deserializeSelf: {
        value: function (deserializer) {
            PropertyBlueprint.deserializeSelf.call(this, deserializer);
            this._targetBlueprintReference = deserializer.getProperty("targetBlueprint");
        }
    },

    _targetBlueprintReference: {
        value: null
    },

    /**
     * Promise for the blueprint targeted by this association.
     *
     * **Note**: The setter expects an actual blueprint but the getter will
     * return a promise.
     *
     * @type {?Blueprint}
     * @default null
     */
    targetBlueprint: {
        serializable: false,
        get: function () {
            return this._targetBlueprintReference.promise(this.require);
        },
        set: function (blueprint) {
            this._targetBlueprintReference = new BlueprintReference().initWithValue(blueprint);
        }
    },

    /**
     * @type {boolean}
     * @default false
     */
    isAssociationBlueprint: {
        get: function () {
            return true;
        }
    }

});

