/* <copyright>
 </copyright> */
/**
 @module montage/data/component-description
 @requires montage/core/core
 @requires montage/core/logger
 */
var Montage = require("montage").Montage;
var Enum = require("core/enum").Enum;
var Promise = require("core/promise").Promise;
var Selector = require("core/selector").Selector;
var Semantics = require("core/selector/semantics").Semantics;
var Serializer = require("core/serializer").Serializer;
var Deserializer = require("core/deserializer").Deserializer;
var logger = require("core/logger").logger("component-description");
/**
 @class module:montage/data/component-description.ComponentDescription
 @extends module:montage/core/core.Montage
 */
var ComponentDescription = exports.ComponentDescription = Montage.create(Montage, /** @lends module:montage/data/component-description.ComponentDescription# */ {

    /*
     * @private
     */
    _component:{
        serializable:false,
        enumerable:false,
        value:null
    },

    /*
     * Component being described by this object.
     */
    component:{
        get:function () {
            return this._component;
        }
    },

    /**
     Initialize a newly allocated component description.
     @function
     @param {Component} component to describe
     @returns itself
     */
    initWithComponent:{
        value:function (component) {
            this._component = component;
            this._component.description = this;
            return this;
        }
    },

    /**
     Gets a component description from a serialized file at the given module id.
     @function
     @param {Component} target component to load from
     */
    getComponentDescriptionFromComponentModule:{
        value:function (component) {
            var info = Montage.getInfoForObject(component),
                moduleId = info.moduleId,
                slashIndex = moduleId.lastIndexOf("/"),
                descriptionModuleId = moduleId + "/" + moduleId.slice(slashIndex === -1 ? 0 : slashIndex + 1, -5) + "-description.json",
                deferredDescription = Promise.defer();

            info.require.async(descriptionModuleId).then(function (object) {
                Deserializer.create().initWithObjectAndRequire(object, info.require, descriptionModuleId).deserializeObject(function (componentDescription) {
                    if (componentDescription) {
                        componentDescription._component = component;
                        deferredDescription.resolve(componentDescription);
                    } else {
                        deferredDescription.reject("No Component Description found " + descriptionModuleId);
                    }
                }, require);
            }, deferredDescription.reject);

            return deferredDescription.promise;
        }
    },

    /**
     The identifier is the same as the name and is used to make the serialization of a blueprint humane.
     @type {Property}
     @default {String} this.name
     */
    identifier:{
        get:function () {
            return [
                this.component.identifier,
                "description"
            ].join("_");
        }
    },

    /*
     * @private
     */
    _componentPropertyDescriptions:{
        serializable:true,
        enumerable:false,
        distinct:true,
        value:{}
    },

    /*
     * List of component properties description
     */
    componentPropertyDescriptions:{
        get:function () {
            var propertyDescriptions = [];
            var name;
            for (name in this._componentPropertyDescriptions) {
                propertyDescriptions.push(this._componentPropertyDescriptions[name]);
            }
            return propertyDescriptions;
        }
    },

    /*
     * Returns the component properties description for that property name
     * @param {String} name of the property
     * @returns {ComponentPropertyDescription} property description
     */
    componentPropertyDescriptionForName:{
        value:function (propertyName) {
            return this._componentPropertyDescriptions[propertyName];
        }
    },

    /*
     * Add a new property description for the property.
     * @function
     * @param {String} name of the property to describe
     * @returns {ComponentPropertyDescription} new property description
     */
    addComponentPropertyDescription:{
        value:function (propertyName) {
            var propertyDescription = this._componentPropertyDescriptions[propertyName];
            if (propertyDescription == null) {
                propertyDescription = ComponentPropertyDescription.create().initWithPropertyAndComponentDescription(propertyName, this);
                this._componentPropertyDescriptions[propertyName] = propertyDescription;
            }
            return propertyDescription;
        }
    },

    /*
     * Remove the property description for the property.
     * @function
     * @param {String} name of the property to remove
     * @returns {ComponentPropertyDescription} removed property description
     */
    removeComponentPropertyDescription:{
        value:function (propertyName) {
            var propertyDescription = this._componentPropertyDescriptions[propertyName];
            if (propertyDescription != null) {
                delete this._componentPropertyDescriptions[propertyName];
            }
            return propertyDescription;
        }
    },

    /*
     * @private
     */
    _componentPropertyDescriptionGroups:{
        serializable:true,
        enumerable:false,
        distinct:true,
        value:{}
    },

    /*
     * List of component properties description groups names
     */
    componentPropertyDescriptionGroups:{
        get:function () {
            var groups = [];
            for (var name in this._componentPropertyDescriptionGroups) {
                groups.push(name);
            }
            return groups;
        }
    },

    /*
     * Returns the group associated with that name
     * @param {String} name of the group
     * @returns {array} property description group
     */
    componentPropertyDescriptionGroupForName:{
        value:function (groupName) {
            var group = this._componentPropertyDescriptionGroups[groupName];
            return (group != null ? group : []);
        }
    },

    /*
     * Add a new property description group.
     * @function
     * @param {String} name of the group
     * @returns {array} new property description group
     */
    addComponentPropertyDescriptionGroup:{
        value:function (groupName) {
            var group = this._componentPropertyDescriptionGroups[groupName];
            if (group == null) {
                group = [];
                this._componentPropertyDescriptionGroups[groupName] = group;
            }
            return group;
        }
    },

    /*
     * Remove the property description group.
     * @function
     * @param {String} name of the group to remove
     * @returns {array} removed property description group
     */
    removeComponentPropertyDescriptionGroup:{
        value:function (groupName) {
            var group = this._componentPropertyDescriptionGroups[groupName];
            if (group != null) {
                delete this._componentPropertyDescriptionGroups[groupName];
            }
            return group;
        }
    },

    /*
     * Adds a property description to the group name.<br/>
     * if the property description does not exist creates it, if the group does not exist creates it.
     * @function
     * @param {String} name of the property
     * @param {String} name of the group
     * @returns {array} property description group
     */
    addComponentPropertyDescriptionToGroup:{
        value:function (propertyName, groupName) {
            var group = this._componentPropertyDescriptionGroups[groupName];
            if (group == null) {
                group = this.addComponentPropertyDescriptionGroup(groupName);
            }
            var propertyDescription = this._componentPropertyDescriptions[propertyName];
            if (propertyDescription == null) {
                propertyDescription = this.addComponentPropertyDescription(propertyName);
            }
            var index = group.indexOf(propertyDescription);
            if (index < 0) {
                group.push(propertyDescription);
            }
            return group;
        }
    },

    /*
     * Removes a property description from the group name.<br/>
     * @function
     * @param {String} name of the property
     * @param {String} name of the group
     * @returns {array} property description group
     */
    removeComponentPropertyDescriptionFromGroup:{
        value:function (propertyName, groupName) {
            var group = this._componentPropertyDescriptionGroups[groupName];
            var propertyDescription = this._componentPropertyDescriptions[propertyName];
            if ((group != null) && (propertyDescription != null)) {
                var index = group.indexOf(propertyDescription);
                if (index >= 0) {
                    group.splice(index, 1);
                }
            }
            return (group != null ? group : []);
        }
    },

    _componentPropertyValidationRules:{
        serializable:true,
        enumerable:false,
        distinct:true,
        value:{}
    },

    /*
     * Gets the list of component properties validation rules
     * @return {Array} copy of the list of component properties validation rules
     */
    componentPropertyValidationRules:{
        get:function () {
            var propertyValidationRules = [];
            for (var name in this._componentPropertyValidationRules) {
                propertyValidationRules.push(this._componentPropertyValidationRules[name]);
            }
            return propertyValidationRules;
        }
    },

    /*
     * Returns the component properties validation rule for that name
     * @param {String} name of the rule
     * @returns {ComponentPropertyDescription} property description
     */
    componentPropertyValidationRuleForName:{
        value:function (name) {
            return this._componentPropertyValidationRules[name];
        }
    },

    /*
     * Add a new component properties validation rule .
     * @function
     * @param {String} name of the rule
     * @returns {ComponentPropertyDescription} new component properties validation rule
     */
    addComponentPropertyValidationRule:{
        value:function (name) {
            var propertyValidationRule = this._componentPropertyValidationRules[name];
            if (propertyValidationRule == null) {
                propertyValidationRule = ComponentPropertyValidationRule.create().initWithNameAndComponentDescription(name, this);
                this._componentPropertyValidationRules[name] = propertyValidationRule;
            }
            return propertyValidationRule;
        }
    },

    /*
     * Remove the component properties validation rule  for the name.
     * @function
     * @param {String} name of the rule
     * @returns {ComponentPropertyDescription} removed component properties validation rule
     */
    removeComponentPropertyValidationRule:{
        value:function (name) {
            var propertyValidationRule = this._componentPropertyValidationRules[name];
            if (propertyValidationRule != null) {
                delete this._componentPropertyValidationRules[name];
            }
            return propertyValidationRule;
        }
    },

    /*
     * Evaluates the rules based on the component and the properties.<br/>
     * @return {Array} list of message key for rule that fired. Empty array otherwise.
     */
    evaluateRules:{
        value:function () {
            var messages = [];
            for (var name in this._componentPropertyValidationRules) {
                var rule = this._componentPropertyValidationRules[name];
                if (rule.evaluateRule()) {
                    messages.push(rule.messageKey);
                }
            }
            return messages;
        }
    }

});

var ValueType = Enum.create().initWithMembers("string", "number", "boolean", "date", "enum", "set", "list", "map", "url", "object");
/**
 @class module:montage/data/component-description.ComponentPropertyDescription
 @extends module:montage/core/core.Montage
 */
var ComponentPropertyDescription = exports.ComponentPropertyDescription = Montage.create(Montage, /** @lends module:montage/data/component-description.ComponentPropertyDescription# */ {

    /*
     * @private
     */
    _componentDescription:{
        serializable:true,
        enumerable:false,
        value:null
    },

    /*
     * Component description attached to this property description.
     */
    componentDescription:{
        get:function () {
            return this._componentDescription;
        }
    },

    /*
     * @private
     */
    _name:{
        serializable:true,
        enumerable:false,
        value:""
    },

    /*
     * Name of the property being described
     */
    name:{
        get:function () {
            return this._name;
        }
    },

    /**
     Initialize a newly allocated component description.
     @function
     @param {String} property to describe
     @param {ComponentDescription} component description
     @returns itself
     */
    initWithPropertyAndComponentDescription:{
        value:function (property, componentDescription) {
            this._name = property;
            this._componentDescription = componentDescription;
            return this;
        }
    },

    /**
     The identifier is the same as the name and is used to make the serialization of a blueprint humane.
     @type {Property}
     @default {String} this.name
     */
    identifier:{
        get:function () {
            return [
                this.componentDescription.identifier,
                this.name
            ].join("_");
        }
    },

    /*
     * Returns the status of the writable property of the property
     */
    writable:{
        get:function () {
            return Montage.getPropertyProperty(this.componentDescription.component, this.name, "writable");
        }
    },

    /*
     * Returns the status of the serializable property of the property
     */
    serializable:{
        get:function () {
            return Montage.getPropertyProperty(this.componentDescription.component, this.name, "serializable");
        }
    },

    /*
     * Returns the status of the distinct property of the property
     */
    distinct:{
        get:function () {
            return Montage.getPropertyProperty(this.componentDescription.component, this.name, "distinct");
        }
    },

    /*
     * @private
     */
    _valueType:{
        serializable:true,
        enumerable:false,
        value:null
    },

    /*
     * Returns the Value Type for this property.<br/>
     * the Value type is an indication of the value to bind to this property.<br/>
     * This is used by authoring tools to implement the correct UI interface.
     */
    valueType:{
        serializable:false,
        get:function () {
            if (this._valueType === "") {
                return "string";
            }
            return this._valueType;
        },
        set:function (value) {
            // TODO [PJYF July 12 2012] we need to check that the value is within the enum
            this._valueType = value;
        }
    },

    _enumValues: {
        serializable:true,
        enumerable:false,
        value:null
    },

    enumValues: {
        serializable:false,
        get: function() {
            if (!this._enumValues) {
                return [];
            }
            return this._enumValues_enumValues;
        },
        set: function(value) {
            if (Array.isArray(value)) {
                this._enumValues = value;
            }
        }
    },

    helpString: {
        serializable:true,
        value: ""
    }


});

/**
 @class module:montage/data/component-description.ComponentPropertyValidationRule
 @extends module:montage/core/core.Montage
 */
var ComponentPropertyValidationRule = exports.ComponentPropertyValidationRule = Montage.create(Montage, /** @lends module:montage/data/component-description.ComponentPropertyValidationRule# */ {

    /*
     * @private
     */
    _componentDescription:{
        serializable:true,
        enumerable:false,
        value:null
    },

    /*
     * Component description attached to this validation rule.
     */
    componentDescription:{
        get:function () {
            return this._componentDescription;
        }
    },

    /**
     The identifier is the same as the name and is used to make the serialization of a blueprint humane.
     @type {Property}
     @default {String} this.name
     */
    identifier:{
        get:function () {
            return [
                this.componentDescription.identifier,
                "rule",
                this.name
            ].join("_");
        }
    },

    /*
     * @private
     */
    _name:{
        serializable:true,
        enumerable:false,
        value:""
    },

    /*
     * Name of the property being described
     */
    name:{
        get:function () {
            return this._name;
        }
    },

    /**
     Initialize a newly allocated component validation rule.
     @function
     @param {String} rule name
     @param {ComponentDescription} component description
     @returns itself
     */
    initWithNameAndComponentDescription:{
        value:function (name, componentDescription) {
            this._name = name;
            this._componentDescription = componentDescription;
            return this;
        }
    },

    /*
     * @private
     */
    _validationSelector:{
//        serializable:true,
        enumerable:false,
        value:null
    },

    /*
     * Selector to evaluate to check this rule.
     */
    validationSelector:{
        serializable:false,
        get:function () {
            if (!this._validationSelector) {
                this._validationSelector = Selector.false;
            }
            return this._validationSelector;
        },
        set:function (value) {
            this._validationSelector = value;
        }
    },

    _messageKey:{
        serializable:true,
        enumerable:false,
        value:""
    },

    /*
     * Message key to display when the rule fires.
     */
    messageKey:{
        serializable:false,
        get:function () {
            if ((!this._messageKey) || (this._messageKey.length == 0)) {
                return ths._name;
            }
            return this._messageKey;
        },
        set:function (value) {
            this._messageKey = value;
        }
    },

    _propertyValidationEvaluator:{
        serializable:false,
        enumerable:false,
        value:null
    },

    /*
     * Evaluates the rules based on the component and the properties.<br/>
     * @return true if the rules fires, false otherwise.
     */
    evaluateRule:{
        value:function () {
            if (_propertyValidationEvaluator === null) {
                var propertyValidationSemantics = PropertyValidationSemantics.create().initWithComponentDescription(this.componentDescription);
                _propertyValidationEvaluator = propertyValidationSemantics.compile(this.selector.syntax);
            }
            return _propertyValidationEvaluator(this.componentDescription.component);
        }
    }

});

/**
 @class module:montage/data/component-description.PropertyValidationSemantics
 @extends module:montage/core/core.Montage
 */
var PropertyValidationSemantics = exports.PropertyValidationSemantics = Semantics.create(Semantics, /** @lends module:montage/data/component-description.PropertyValidationSemantics# */ {

    /*
     * @private
     */
    _componentDescription:{
        serializable:true,
        enumerable:false,
        value:null
    },

    /*
     * Component description attached to this validation rule.
     */
    componentDescription:{
        get:function () {
            return this._componentDescription;
        }
    },

    /**
     Create a new semantic evaluator with the component dexcription.
     @function
     @param {ComponentDescription} component description
     @returns itself
     */
    initWithComponentDescription:{
        value:function (componentDescription) {
            this._componentDescription = componentDescription;
            return this;
        }
    },

    /**
     * Compile the syntax tree into a function that can be used for evaluating this selector.
     * @function
     * @param {Selector} selector syntax
     * @returns function
     */
    compile:{
        value:function (syntax, parents) {
            Semantics.compile.call(self, syntax, parents);
        }
    },

    operators:{
        value:{
            isBound:function (a) {
                return !a;
            }
        }
    },

    evaluators:{
        value:{
            isBound: function (collection, modify) {
                 var self = this;
                 return function (value, parameters) {
                     var value = self.count(collection(value, parameters));
                     return modify(value, parameters);
                 };
             }
        }
    }

});

for (var name in Semantics.operators) {
    PropertyValidationSemantics.operators[name] = Semantics.operators[name];
}

for (var name in Semantics.evaluators) {
    PropertyValidationSemantics.evaluators[name] = Semantics.evaluators[name];
}



