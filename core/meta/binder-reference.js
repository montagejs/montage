"use strict";

/**
 * @module montage/core/meta/binder-reference
 * @requires core/exception
 * @requires core/promise
 * @requires core/logger
 */
var Promise = require("../promise").Promise;
var RemoteReference = require("./remote-reference").RemoteReference;
var BinderModule = require("./binder");

var logger = require("../logger").logger("blueprint");

exports.BinderReference = RemoteReference.create(RemoteReference, {

    constructor: {
        value: function BinderReference() {
            this.superForValue("constructor")();
        }
    },

    /**
     * The identifier is the name of the binder and is used to make the
     * serialization of binders more readable.
     * @readonly
     * @type {string}
     */
    identifier: {
        get: function () {
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
        value: function (references, require) {
            var binderName = references.binderName;
            var binderModuleId = references.binderModuleId;

            var deferredBinder;
            var binder = BinderModule.Binder.manager.binderForName(binderName);
            if (binder) {
                deferredBinder = Promise.resolve(binder);
            } else {
                try {
                    // We need to be careful as the parent may be in another module
                    var targetRequire = require;
                    var slashIndex = binderModuleId.indexOf("/");
                    if (slashIndex > 0) {
                        var prefix = binderModuleId.substring(0, slashIndex);
                        var mappings = require.mappings;
                        if (prefix in mappings) {
                            binderModuleId = binderModuleId.substring(slashIndex + 1);
                            targetRequire = targetRequire.getPackage(mappings[prefix].location);
                        }
                    }
                    deferredBinder = BinderModule.Binder.getBinderWithModuleId(binderModuleId, targetRequire);
                } catch (exception) {
                    deferredBinder = Promise.reject(new Error("Error cannot find Blueprint Binder " + binderModuleId));
                }
            }
            return deferredBinder;
        }
    },

    referenceFromValue: {
        value: function (value) {
            var references = {};
            references.binderName = value.name;
            references.binderModuleId = value.binderModuleId;
            return references;
        }
    }

});

