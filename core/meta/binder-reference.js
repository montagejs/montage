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
var RemoteReference = require("core/meta/remote-reference").RemoteReference;
var BinderModule = require("core/meta/binder");

var logger = require("core/logger").logger("blueprint");

exports.BinderReference = RemoteReference.create(RemoteReference, {

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
                "binder",
                this._reference.binderName.toLowerCase(),
                "reference"
            ].join("_");
        }
    },

    valueFromReference: {
        value: function(references, require) {
            var binderName = references.binderName;
            var binderModuleId = references.binderModuleId;

            var deferredBinder = Promise.defer();
            var binder = BinderModule.Binder.manager.binderForName(binderName);
            if (binder) {
                deferredBinder.resolve(binder);
            } else {
                try {
                    deferredBinder = BinderModule.Binder.getBinderWithModuleId(binderModuleId, require);
                } catch (exception) {
                    deferredBinder.reject("Error cannot find Blueprint Binder " + binderModuleId);
                }
            }
            return deferredBinder.promise;
        }
    },

    referenceFromValue: {
        value: function(value) {
            var references = {};
            references.binderName = value.name;
            references.binderModuleId = value.binderModuleId;
            return references;
        }
    }

});
