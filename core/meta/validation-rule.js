"use strict";
/**
 @module montage/core/meta/validation-rule
 @requires montage/core/core
 @requires core/exception
 @requires core/promise
 @requires core/logger
 */
var Montage = require("montage").Montage;
var Selector = require("core/selector").Selector;
var PropertyValidationSemantics = require("core/meta/validation-semantics").PropertyValidationSemantics;

var logger = require("core/logger").logger("blueprint");

/**
 @class module:montage/core/meta/validation-rule.PropertyValidationRule
 @extends module:montage/core/core.Montage
 */
var PropertyValidationRule = exports.PropertyValidationRule = Montage.create(Montage, /** @lends module:montage/core/meta/validation-rule.PropertyValidationRule# */ {

    /**
     Initialize a newly allocated blueprint validation rule.
     @function
     @param {String} rule name
     @param {Blueprint} blueprint
     @returns itself
     */
    initWithNameAndBlueprint: {
        value: function(name, blueprint) {
            this._name = name;
            this._owner = blueprint;
            return this;
        }
    },

    serializeSelf: {
        value: function(serializer) {
            serializer.setProperty("name", this.name);
            serializer.setProperty("blueprint", this.owner, "reference");
            //            serializer.setProperty("validationSelector", this._validationSelector, "reference");
            serializer.setProperty("messageKey", this.messageKey);
            serializer.setProperties();
        }
    },

    deserializeSelf: {
        value: function(deserializer) {
            this._name = deserializer.getProperty("name");
            this._owner = deserializer.getProperty("blueprint");
            //            this._validationSelector = deserializer.getProperty("validationSelector");
            this._messageKey = deserializer.getProperty("messageKey");
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
    _owner: {
        value: null
    },

    /*
     * Component description attached to this validation rule.
     */
    owner: {
        get: function() {
            return this._owner;
        }
    },

    /**
     The identifier is the same as the name and is used to make the serialization of a blueprint humane.
     @type {Property}
     @default {String} this.name
     */
    identifier: {
        get: function() {
            return [
                this.blueprint.identifier,
                "rule",
                this.name
            ].join("_");
        }
    },

    /*
     * @private
     */
    _name: {
        value: ""
    },

    /*
     * Name of the property being described
     */
    name: {
        get: function() {
            return this._name;
        }
    },


    /*
     * @private
     */
    _validationSelector: {
        value: null
    },

    /*
     * Selector to evaluate to check this rule.
     */
    validationSelector: {
        serializable: false,
        get: function() {
            if (!this._validationSelector) {
                this._validationSelector = Selector['false'];
            }
            return this._validationSelector;
        },
        set: function(value) {
            this._validationSelector = value;
        }
    },

    _messageKey: {
        value: ""
    },

    /*
     * Message key to display when the rule fires.
     */
    messageKey: {
        serializable: false,
        get: function() {
            if ((!this._messageKey) || (this._messageKey.length === 0)) {
                return this._name;
            }
            return this._messageKey;
        },
        set: function(value) {
            this._messageKey = value;
        }
    },

    _propertyValidationEvaluator: {
        value: null
    },

    /*
     * Evaluates the rules based on the blueprint and the properties.<br/>
     * @param {Object} object instance to evaluate the rule for
     * @return true if the rules fires, false otherwise.
     */
    evaluateRule: {
        value: function(objectInstance) {
            if (this._propertyValidationEvaluator === null) {
                var propertyValidationSemantics = PropertyValidationSemantics.create().initWithBlueprint(this.blueprint);
                this._propertyValidationEvaluator = propertyValidationSemantics.compile(this.selector.syntax);
            }
            return this._propertyValidationEvaluator(objectInstance);
        }
    },

        blueprintModuleId:require("montage")._blueprintModuleIdDescriptor,

        blueprint:require("montage")._blueprintDescriptor

});
