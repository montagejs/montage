"use strict";
/**
 * @module montage/core/remote-reference
 * @requires montage/core/core
 * @requires core/promise
 * @requires core/logger
 */
var Montage = require("montage").Montage;
var Promise = require("core/promise").Promise;

var logger = require("core/logger").logger("blueprint");

exports.RemoteReference = Montage.specialize({

    constructor: {
        value: function RemoteReference() {
            this.superForValue("constructor")();
            this._value = null;
            this._reference = null;
            this._promise = null;
            return this;
        }
    },

    initWithValue: {
        value: function(value) {
            this._value = value;
            this._reference = null;
            this._promise = null;
            return this;
        }
    },

    serializeSelf: {
        value: function(serializer) {
            if (!this._reference) {
                this._reference = this.referenceFromValue(this._value);
            }
            serializer.setProperty("valueReference", this._reference);
        }
    },

    deserializeSelf: {
        value: function(deserializer) {
            this._value = null;
            this._reference = deserializer.getProperty("valueReference");
            this._promise = null;
        }
    },

    _value: {
        value: null
    },

    _reference: {
        value: null
    },

    _promise: {
        value: null
    },

    promise: {
        value: function(iRequire) {
            if (!this._promise) {
                if (this._value) {
                    this._promise = Promise.resolve(this._value);
                } else {
                    this._promise = this.valueFromReference(this._reference, iRequire);
                }
            }
            return this._promise;
        }
    },

    /**
     * Takes the serialized reference and return a promise for the value.
     *
     * The default implementation does nothing and must be overwritten by subtypes
     *
     * @param references
     * @param {boolean} isRequire
     */
    valueFromReference: {
        value: function(reference, iRequire) {
            return Promise.resolve(null);
        }
    },

    /**
     * Take the value and creates a reference string for serialization.
     *
     * The default implementation does nothing and must be overwritten by
     * subtypes.
     */
    referenceFromValue: {
        value: function(value) {
            return {};
        }
    },

    blueprintModuleId: require("montage")._blueprintModuleIdDescriptor,

    blueprint: require("montage")._blueprintDescriptor

});

