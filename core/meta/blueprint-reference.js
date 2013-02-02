"use strict";
/**
 @module montage/core/blueprint
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

exports.BlueprintReference = RemoteReference.create(RemoteReference, {

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
                this._reference.blueprintName.toLowerCase(),
                "reference"
            ].join("_");
        }
    },

    valueFromReference: {
        value: function(references, require) {
            var blueprintName = references.blueprintName;
            var blueprintModuleId = references.blueprintModuleId;
            var prototypeName = references.prototypeName;
            var moduleId = references.moduleId;

            var binderReference = references.binderReference;
            var binderPromise = Promise.resolve(BinderModule.Binder.manager.defaultBinder);
            if (binderReference) {
                binderPromise = BinderReference.valueFromReference(binderReference, require);
            }

            var deferredBlueprint = Promise.defer();
            binderPromise.then(function(binder) {
                if (binder) {
                    var blueprint = binder.blueprintForPrototype(prototypeName, moduleId);
                    if (blueprint) {
                        deferredBlueprint.resolve(blueprint);
                    } else {
                        try {
                            BlueprintModule.Blueprint.getBlueprintWithModuleId(blueprintModuleId, require).then(function(blueprint) {
                                if (blueprint) {
                                    binder.addBlueprint(blueprint);
                                    deferredBlueprint.resolve(blueprint);
                                } else {
                                    deferredBlueprint.reject("Error cannot find Blueprint " + blueprintModuleId);
                                }
                            }, deferredBlueprint.reject);
                        } catch (exception) {
                            deferredBlueprint.reject("Error cannot find Blueprint " + blueprintModuleId);
                        }
                    }

                } else {
                    try {
                        deferredBlueprint = BlueprintModule.Blueprint.getBlueprintWithModuleId(blueprintModuleId, require);
                    } catch (exception) {
                        deferredBlueprint.reject("Error cannot find Blueprint " + blueprintModuleId);
                    }
                }
            });
            return deferredBlueprint.promise;
        }
    },

    referenceFromValue: {
        value: function(value) {
            // the value is a blueprint we need to serialize the binder and the blueprint reference
            var references = {};
            references.blueprintName = value.name;
            references.blueprintModuleId = value.blueprintModuleId;
            references.prototypeName = value.prototypeName;
            references.moduleId = value.moduleId;
            if ((value.binder) && (! value.binder.isDefault)) {
                references.binderReference = BinderReference.referenceFromValue(value.binder);
            }
            return references;
        }
    }

});
