"use strict";
/**
 @module montage/core/meta/blueprint-reference
 @requires montage/core/core
 @requires core/exception
 @requires core/promise
 @requires core/logger
 */
var Montage = require("montage").Montage;
var Promise = require("core/promise").Promise;
var BlueprintModule = require("core/meta/blueprint");
var BinderModule = require("core/meta/binder");
var RemoteReference = require("core/meta/remote-reference").RemoteReference;
var BinderReference = require("core/meta/binder-reference").BinderReference;

var logger = require("core/logger").logger("blueprint");

exports.BlueprintReference = RemoteReference.specialize( {

    constructor: {
        value: function BlueprintReference() {
            this.super();
        }
    },

    /**
     The identifier is the name of the binder and is used to make the serialization of binders more
     readable.
     @type {Property}
     @default {String} this.name
     */
    identifier: {
        get: function() {
            if (!this._reference) {
                this._reference = this.referenceFromValue(this._value);
            }
            return [
                "blueprint",
                (this._reference.blueprintName || "unnamed").toLowerCase(),
                "reference"
            ].join("_");
        }
    },

    valueFromReference: {
        value: function(references, targetRequire) {
            var blueprintName = references.blueprintName;
            var blueprintModule = references.blueprintModule;
            var prototypeName = references.prototypeName;
            var moduleId = references.moduleId;

            var binderReference = references.binderReference;
            var binderPromise = Promise.resolve(BinderModule.Binder.manager.defaultBinder);
            if (binderReference) {
                binderPromise = BinderReference.valueFromReference(binderReference, require);
            }

            return binderPromise.then(function(binder) {
                if (binder) {
                    return BlueprintModule.Blueprint.getBlueprintWithModuleId(blueprintModule.id, blueprintModule.require).then(function (blueprint) {
                        if (blueprint) {
                            binder.addBlueprint(blueprint);
                            return blueprint;
                        } else {
                            throw new Error("Error cannot find Blueprint " + blueprintModule);
                        }
                    });
                } else {
                    return BlueprintModule.Blueprint.getBlueprintWithModuleId(blueprintModule, require);
                }
            });
        }
    },

    referenceFromValue: {
        value: function(value) {
            // the value is a blueprint we need to serialize the binder and the blueprint reference
            var references = {};
            references.blueprintName = value.name;
            references.blueprintModule = value.blueprintInstanceModule;
            if ((value.binder) && (! value.binder.isDefault)) {
                references.binderReference = BinderReference.referenceFromValue(value.binder);
            }
            return references;
        }
    }

});
