/**
 * @module montage/core/meta/validation-rule
 * @requires montage/core/core
 * @requires core/exception
 * @requires core/promise
 * @requires core/logger
 */
var Montage = require("../core").Montage,
    PropertyValidationSemantics = require("./validation-semantics").PropertyValidationSemantics,
    Selector = require("../selector").Selector,
    deprecate = require("../deprecate");

/**
 * @class PropertyValidationRule
 * @extends Montage
 */
exports.PropertyValidationRule = Montage.specialize( /** @lends PropertyValidationRule# */ {

    /**
     * Initialize a newly allocated object descriptor validation rule.
     * @function
     * @param {string} rule name
     * @param {ObjectDescriptor} objectDescriptor
     * @returns itself
     */
    initWithNameAndObjectDescriptor: {
        value: function (name, objectDescriptor) {
            this._name = name;
            this._owner = objectDescriptor;
            return this;
        }
    },

    serializeSelf: {
        value: function (serializer) {
            serializer.setProperty("name", this.name);
            serializer.setProperty("objectDescriptor", this.owner, "reference");
            //            serializer.setProperty("validationSelector", this._validationSelector, "reference");
            serializer.setProperty("messageKey", this.messageKey);
            serializer.setAllValues();
        }
    },

    deserializeSelf: {
        value: function (deserializer) {
            this._name = deserializer.getProperty("name");
            this._owner = deserializer.getProperty("objectDescriptor") || deserializer.getProperty("blueprint");
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

    _owner: {
        value: null
    },

    /**
     * Component description attached to this validation rule.
     * @type {ObjectDescriptor}
     */
    owner: {
        get: function () {
            return this._owner;
        }
    },

    /**
     * The identifier is the same as the name and is used to make the serialization of a ObjectDescriptor humane.
     * @type {string}
     */
    identifier: {
        get: function () {
            return [
                this.objectDescriptor.identifier,
                "rule",
                this.name
            ].join("_");
        }
    },

    _name: {
        value: ""
    },

    /**
     * Name of the property being described
     */
    name: {
        get: function () {
            return this._name;
        }
    },


    _validationSelector: {
        value: null
    },

    /**
     * Selector to evaluate to check this rule.
     * @type {Selector}
     */
    validationSelector: {
        serializable: false,
        get: function () {
            if (!this._validationSelector) {
                this._validationSelector = Selector['false'];
            }
            return this._validationSelector;
        },
        set: function (value) {
            this._validationSelector = value;
        }
    },

    _messageKey: {
        value: ""
    },

    /**
     * Message key to display when the rule fires.
     */
    messageKey: {
        serializable: false,
        get: function () {
            if ((!this._messageKey) || (this._messageKey.length === 0)) {
                return this._name;
            }
            return this._messageKey;
        },
        set: function (value) {
            this._messageKey = value;
        }
    },

    _propertyValidationEvaluator: {
        value: null
    },

    /**
     * Evaluates the rules based on the ObjectDescriptor and the properties.
     * @param {Object} object instance to evaluate the rule for
     * @returns {boolean} true if the rules fires, false otherwise.
     */
    evaluateRule: {
        value: function (objectInstance) {
            if (this._propertyValidationEvaluator === null) {
                var propertyValidationSemantics = new PropertyValidationSemantics().initWithBlueprint(this.objectDescriptor);
                this._propertyValidationEvaluator = propertyValidationSemantics.compile(this.selector.syntax);
            }
            return this._propertyValidationEvaluator(objectInstance);
        }
    },

    objectDescriptorModuleId: require("../core")._objectDescriptorModuleIdDescriptor,
    objectDescriptor: require("../core")._objectDescriptorDescriptor,

    /*********************************************************************
     * Deprecated methods
     */

    /**
     * @deprecated
     * Initialize a newly allocated validation rule.
     * @deprecated
     * @function
     * @param {string} rule name
     * @param {ObjectDescriptor} objectDescriptor
     * @returns itself
     */
    initWithNameAndBlueprint: {
        value: deprecate.deprecateMethod(void 0, function (name, blueprint) {
            return this.initWithNameAndObjectDescriptor(name, blueprint);
        }, "initWithNameAndBlueprint", "initWithNameAndObjectDescriptor")
    },


    blueprintModuleId: require("../core")._objectDescriptorModuleIdDescriptor,
    blueprint: require("../core")._objectDescriptorDescriptor

});
