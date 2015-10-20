"use strict";

/**
 * @module montage/core/meta/blueprint
 * @requires montage/core/core
 * @requires core/exception
 * @requires core/promise
 * @requires core/logger
 */
var Montage = require("../core").Montage;
var Promise = require("../promise").Promise;
var ObjectProperty = require("./object-property").ObjectProperty;
var BinderModule = require("./binder");
var BlueprintReference = require("./blueprint-reference").BlueprintReference;
var PropertyBlueprint = require("./property-blueprint").PropertyBlueprint;
var AssociationBlueprint = require("./association-blueprint").AssociationBlueprint;
var DerivedPropertyBlueprint = require("./derived-property-blueprint").DerivedPropertyBlueprint;
var EventBlueprint = require("./event-blueprint").EventBlueprint;
var PropertyValidationRule = require("./validation-rule").PropertyValidationRule;
var deprecate = require("../deprecate");
var logger = require("../logger").logger("blueprint");

var Defaults = {
    name: "default",
    customPrototype: false
};

/**
 * @class Blueprint
 * @extends Montage
 */
var Blueprint = exports.Blueprint = Montage.specialize( /** @lends Blueprint.prototype # */ {

    FileExtension: {
        value: ".meta"
    },

    constructor: {
        value: function Blueprint() {
            this.superForValue("constructor")();
            this._eventBlueprints = [];
            this.defineBinding("eventBlueprints", {"<-": "_eventBlueprints.concat(parent.eventBlueprints)"});
        }
    },

    /**
     * @function
     * @param {string} name The name of the blueprint
     * @returns itself
     */
    initWithName: {
        value: function (name) {
            this._name = (name !== null ? name : "default");
            this.customPrototype = false;

            return this;
        }
    },

    /**
     * @function
     * @param {string} name
     * @param {string} moduleId
     * @returns itself
     */
    initWithNameAndModuleId: {
        value: deprecate.deprecateMethod(void 0, function (name) {
            return this.initWithName(name);
        }, "Blueprint#initWithNameAndModuleId", "ModuleBlueprint#initWithModuleAndExportName")
    },

    serializeSelf: {
        value:function (serializer) {
            serializer.setProperty("name", this.name);
            if ((this._binder) && (!this.binder.isDefault)) {
                serializer.setProperty("binder", this._binder, "reference");
            }

            if (this.blueprintInstanceModule) {
                serializer.setProperty("blueprintModule", this.blueprintInstanceModule);
            }
            if (this._parentReference) {
                serializer.setProperty("parent", this._parentReference);
            }

            this._setPropertyWithDefaults(serializer, "customPrototype", this.customPrototype);
            //
            if (this._propertyBlueprints.length > 0) {
                serializer.setProperty("propertyBlueprints", this._propertyBlueprints);
            }
            if (Object.getOwnPropertyNames(this._propertyBlueprintGroups).length > 0) {
                serializer.setProperty("propertyBlueprintGroups", this._propertyBlueprintGroups);
            }
            if (this._eventBlueprints.length > 0) {
                serializer.setProperty("eventBlueprints", this._eventBlueprints);
            }
            if (this._propertyValidationRules.length > 0) {
                serializer.setProperty("propertyValidationRules", this._propertyValidationRules);
            }
        }
    },

    deserializeSelf: {
        value:function (deserializer) {
            this._name = deserializer.getProperty("name");
            var binder = deserializer.getProperty("binder");
            if (binder) {
                this._binder = binder;
            }
            this.blueprintInstanceModule = deserializer.getProperty("blueprintModule");
            this._parentReference = deserializer.getProperty("parent");

            this.customPrototype = this._getPropertyWithDefaults(deserializer, "customPrototype");
            //
            var value;
            value = deserializer.getProperty("propertyBlueprints");
            if (value) {
                this._propertyBlueprints = value;
            }
            value = deserializer.getProperty("propertyBlueprintGroups");
            if (value) {
                this._propertyBlueprintGroups = value;
            }
            value = deserializer.getProperty("eventBlueprints");
            if (value) {
                this._eventBlueprints = value;
            }
            value = deserializer.getProperty("propertyValidationRules");
            if (value) {
                this._propertyValidationRules = value;
            }
        }
    },

    _setPropertyWithDefaults: {
        value:function (serializer, propertyName, value) {
            if (value != Defaults[propertyName]) {
                serializer.setProperty(propertyName, value);
            }
        }
    },

    _getPropertyWithDefaults: {
        value:function (deserializer, propertyName) {
            var value = deserializer.getProperty(propertyName);
            return value ? value : Defaults[propertyName];
        }
    },

    _name: {
        value: null
    },

    /**
     * Name of the object. The name is used to define the property on the object.
     *
     * This is an accessor. It is not writable or observable.
     *
     * @returns {string} this._name
     */
    name: {
        get: function () {
            return this._name;
        }
    },

    /**
     * This is the canonical way of creating managed objects prototypes.
     *
     * Newly created prototype will be blessed with all the required properties
     * to be well behaved.
     *
     * @function
     * @param {Object} prototype
     * @param {Object} propertyDescriptor
     * @returns newPrototype
     */
    create: {
        value: function (aPrototype, propertyDescriptor) {
            if ((typeof aPrototype === "undefined") || (Blueprint.prototype.isPrototypeOf(aPrototype))) {
                var parentCreate = Object.getPrototypeOf(Blueprint).create;
                return parentCreate.call(this, (typeof aPrototype === "undefined" ? this : aPrototype), propertyDescriptor);
            }

            var newConstructor;

            if (!propertyDescriptor) {
                newConstructor = new aPrototype();
            } else {
                newConstructor = aPrototype.specialize(propertyDescriptor);
            }

            this.ObjectProperty.applyWithBlueprint(newConstructor.prototype, this);
            // We have just created a custom prototype lets use it.
            this.customPrototype = true;
            return newConstructor;
        }
    },

    /**
     * Create a new instance of the target prototype for the blueprint.
     * @function
     * @returns new instance
     */
    newInstance: {
        value: function () {
            var prototype = this.newInstancePrototype();
            return (prototype ? new prototype() : null);
        }
    },

    /**
     * Returns the target prototype for this blueprint.
     *
     * **Note:** This method uses the `customPrototype` property to determine
     * if it needs to require a custom prototype or create a default prototype.
     *
     * @function
     * @returns new prototype
     */
    newInstancePrototype: {
        value: function () {
            // FIXME this function is no missing all the data it needs
            var self = this;
            if (this.customPrototype) {
                throw new Error("FIXME");
                var resultsPromise = new Promise(function(resolve, reject) {
                    require.async(self.moduleId,
                        function(exports) {
                            resolve(exports);
                        });
                });
                return resultsPromise.then(function(exports) {
                        var prototype = exports[self.prototypeName];
                        return (prototype ? prototype : null);
                    }
                );
            } else {
                var parentInstancePrototype = (this.parent ? this.parent.newInstancePrototype() : Montage );
                var newConstructor = parentInstancePrototype.specialize({
                    // Token class
                    init: {
                        value: function () {
                            return this;
                        }
                    }
                });
                this.ObjectProperty.applyWithBlueprint(newConstructor.prototype, this);

                return (newConstructor ? newConstructor : null);
            }
        }
    },

    /**
     * Return the blueprint object property for this blueprint.
     *
     * This will return the default if none is declared.
     *
     * @returns {ObjectProperty}
     */
    ObjectProperty: {
        serializable: false,
        enumerable: true,
        get: function () {
            if (this.binder) {
                return this.binder.ObjectProperty;
            }
            return BinderModule.Binder.manager.defaultBlueprintObjectProperty;
        }
    },

    /**
     * This is used for references only so that we can reload referenced
     * blueprints.
     */
    blueprintInstanceModule: {
        serializable: false,
        value: null
    },

    blueprintInstanceModuleId: {
        get: function () {
            throw new Error("blueprintInstanceModuleId is deprecated, use blueprintInstanceModule instead");
        },
        set: function () {
            throw new Error("blueprintInstanceModuleId is deprecated, use blueprintInstanceModule instead");
        }
    },

    /**
     * The identifier is the same as the name and is used to make the
     * serialization of a blueprint humane.
     * @returns {string}
     * @default `this.name`
     */
    identifier: {
        get: function () {
            // TODO convert UpperCase to lower-case instead of lowercase
            return [
                "blueprint",
                (this.name || "unnamed").toLowerCase()
            ].join("_");
        }
    },

    _binder: {
        value: null
    },

    /**
     * @returns {Property}
     * @default null
     */
    binder: {
        serializable: false,
        get: function () {
            if (! this._binder) {
                this._binder = BinderModule.Binder.manager.defaultBinder;
                this._binder.addBlueprint(this);
            }
            return this._binder;
        },
        set: function (value) {
            this._binder = value;
        }
    },

    _parentReference: {
        value: null
    },

    _parent: {
        value: null
    },

    /**
     * Blueprint parent
     * @returns {?BlueprintReference}
     */
    parent: {
        serializable: false,
        get: function () {
            return this._parent;
        },
        set: function (blueprint) {
            if (blueprint) {
                this._parentReference = new BlueprintReference().initWithValue(blueprint);
                this._parent = blueprint;
            } else {
                this._parentReference = null;
                this._parent = null;
            }
        }
    },

    moduleId: {
        get: function () {
            throw new Error("Blueprint#moduleId is deprecated, use ModuleBlueprint#module instead");
        },
        set: function () {
            throw new Error("Blueprint#moduleId is deprecated, use ModuleBlueprint#module instead");
        }
    },

    prototypeName: {
        get: function () {
            throw new Error("Blueprint#prototypeName is deprecated, use ModuleBlueprint#exportName instead");
        },
        set: function () {
            throw new Error("Blueprint#prototypeName is deprecated, use ModuleBlueprint#exportName instead");
        }
    },

    /**
     * Defines whether the blueprint should use custom prototype for new
     * instances.
     *
     * Is `true` if the blueprint needs to require a custom prototype for
     * creating new instances, `false` if new instance are generic prototypes.
     *
     * @property {boolean} value
     * @default false
     */
    customPrototype: {
        value: false
    },

    _propertyBlueprints: {
        value: [],
        distinct: true
    },

    /**
     * @returns {Array.<PropertyBlueprint>}
     */
    propertyBlueprints: {
        get: function () {
            var propertyBlueprints = [];
            propertyBlueprints = propertyBlueprints.concat(this._propertyBlueprints);
            if (this.parent) {
                propertyBlueprints = propertyBlueprints.concat(this.parent.propertyBlueprints);
            }
            return propertyBlueprints;
        }
    },

    _propertyBlueprintsTable: {
        value: {},
        distinct: true,
        writable: false
    },

    /**
     * Add a new property blueprint to this blueprint.
     *
     * If that property blueprint was associated with another blueprint it will
     * be removed first.
     *
     * @function
     * @param {PropertyBlueprint} property blueprint The property blueprint to
     * be added.
     * @returns the property blueprint
     */
    addPropertyBlueprint: {
        value: function (propertyBlueprint) {
            if (propertyBlueprint !== null && propertyBlueprint.name !== null) {
                var index = this._propertyBlueprints.indexOf(propertyBlueprint);
                if (index < 0) {
                    if ((propertyBlueprint.owner !== null) && (propertyBlueprint.owner !== this)) {
                        propertyBlueprint.owner.removePropertyBlueprint(propertyBlueprint);
                    }
                    this._propertyBlueprints.push(propertyBlueprint);
                    this._propertyBlueprintsTable[propertyBlueprint.name] = propertyBlueprint;
                    propertyBlueprint._owner = this;
                }
            }
            return propertyBlueprint;
        }
    },

    /**
     * Removes a property blueprint from the property blueprint list of this
     * blueprint.
     *
     * @function
     * @param {PropertyBlueprint} property blueprint The property blueprint to
     * be removed.
     * @returns the same property blueprint
     */
    removePropertyBlueprint: {
        value: function (propertyBlueprint) {
            if (propertyBlueprint !== null && propertyBlueprint.name !== null) {
                var index = this._propertyBlueprints.indexOf(propertyBlueprint);
                if (index >= 0) {
                    this._propertyBlueprints.splice(index, 1);
                    delete this._propertyBlueprintsTable[propertyBlueprint.name];
                    propertyBlueprint._owner = null;
                }
            }
            return propertyBlueprint;
        }
    },

    /**
     * Return a new property blueprint.
     *
     * **Note:** This is the canonical way of creating new property blueprint
     * in order to enable subclassing.
     * @param {string} name name of the property blueprint to create
     * @param {number} cardinality name of the property blueprint to create
     * @returns {PropertyBlueprint}
     */
    newPropertyBlueprint: {
        value: function (name, cardinality) {
            return new PropertyBlueprint().initWithNameBlueprintAndCardinality(name, this, cardinality);
        }
    },

    /**
     * Return a new association blueprint.
     * **Note:** This is the canonical way of creating new association
     * blueprint in order to enable subclassing.
     * @param {string} name name of the association blueprint to create
     * @param {number} cardinality name of the association blueprint to create
     * @returns {AssociationBlueprint}
     */
    newAssociationBlueprint: {
        value: function (name, cardinality) {
            return new AssociationBlueprint().initWithNameBlueprintAndCardinality(name, this, cardinality);
        }
    },

    /**
     * Return a new derived property blueprint.
     * **Note:** This is the canonical way of creating new derived property
     * blueprint in order to enable subclassing.
     * @param {string} name name of the derived property blueprint to create
     * @param {number} cardinality name of the derived property blueprint to create
     * @returns {DerivedPropertyBlueprint}
     */
    newDerivedPropertyBlueprint: {
        value: function (name, cardinality) {
            return new DerivedPropertyBlueprint().initWithNameBlueprintAndCardinality(name, this, cardinality);
        }
    },

    /**
     * Convenience to add one property blueprint.
     * @function
     * @param {string} name Add to one property blueprint
     * @returns {PropertyBlueprint}
     */
    addToOnePropertyBlueprintNamed: {
        value: function (name) {
            return this.addPropertyBlueprint(this.newPropertyBlueprint(name, 1));
        }
    },

    /**
     * Convenience to add many property blueprints.
     * @function
     * @param {string} name Add to many property blueprints
     * @returns {PropertyBlueprint}
     */
    addToManyPropertyBlueprintNamed: {
        value: function (name) {
            return this.addPropertyBlueprint(this.newPropertyBlueprint(name, Infinity));
        }
    },

    /**
     * Convenience to add an property blueprint to one relationship.
     * @function
     * @param {string} name
     * @param {string} inverse
     * @returns {AssociationBlueprint}
     */
    addToOneAssociationBlueprintNamed: {
        value: function (name, inverse) {
            var relationship = this.addPropertyBlueprint(this.newAssociationBlueprint(name, 1));
            if (inverse) {
                relationship.targetBlueprint = inverse.owner;
                inverse.targetBlueprint = this;
            }
            return relationship;
        }
    },

    /**
     * Convenience to add an property blueprint to many relationships.
     * @function
     * @param {string} name TODO
     * @param {string} inverse TODO
     * @returns {AssociationBlueprint}
     */
    addToManyAssociationBlueprintNamed: {
        value: function (name, inverse) {
            var relationship = this.addPropertyBlueprint(this.newAssociationBlueprint(name, Infinity));
            if (inverse) {
                relationship.targetBlueprint = inverse.owner;
                inverse.targetBlueprint = this;
            }
            return relationship;
        }
    },

    /**
     * @function
     * @param {string} name
     * @returns {PropertyBlueprint}
     */
    propertyBlueprintForName: {
        value: function (name) {
            var propertyBlueprint = this._propertyBlueprintsTable[name];
            if (typeof propertyBlueprint === "undefined") {
                propertyBlueprint = UnknownPropertyBlueprint;
                var anPropertyBlueprint, index;
                for (index = 0; typeof (anPropertyBlueprint = this._propertyBlueprints[index]) !== "undefined"; index++) {
                    if (anPropertyBlueprint.name === name) {
                        propertyBlueprint = anPropertyBlueprint;
                        break;
                    }
                }
                this._propertyBlueprintsTable[name] = propertyBlueprint;
            }
            if (propertyBlueprint === UnknownPropertyBlueprint) {
                propertyBlueprint = null;
            }
            if ((! propertyBlueprint) && (this.parent)) {
                propertyBlueprint = this.parent.propertyBlueprintForName(name);
            }
            return propertyBlueprint;
        }

    },

    _propertyBlueprintGroups: {
        distinct: true,
        value: {}
    },

    /**
     * List of properties blueprint groups names
     * @returns {Array.<PropertyBlueprint>}
     */
    propertyBlueprintGroups: {
        get: function () {
            var groups = [];
            for (var name in this._propertyBlueprintGroups) {
                groups.push(name);
            }
            if (this.parent) {
                groups = groups.concat(this.parent.propertyBlueprintGroups);
            }
            return groups;
        }
    },

    /**
     * Returns the group associated with that name
     * @param {string} name of the group
     * @returns {Array.<PropertyBlueprint>} property blueprint group
     */
    propertyBlueprintGroupForName: {
        value: function (groupName) {
            var group = this._propertyBlueprintGroups[groupName];
            if ((! group) && (this.parent)) {
                group = this.parent.propertyBlueprintGroupForName(groupName);
            }
            return group;
        }
    },

    /**
     * Add a new property blueprint group.
     * @function
     * @param {string} name of the group
     * @returns {Array.<PropertyBlueprint>} new property blueprint group
     */
    addPropertyBlueprintGroupNamed: {
        value: function (groupName) {
            var group = this._propertyBlueprintGroups[groupName];
            if (group == null) {
                group = [];
                this._propertyBlueprintGroups[groupName] = group;
            }
            return group;
        }
    },

    /**
     * Remove the property blueprint group.
     * @function
     * @param {string} name of the group to remove
     * @returns {Array.<PropertyBlueprint>} removed property blueprint group
     */
    removePropertyBlueprintGroupNamed: {
        value: function (groupName) {
            var group = this._propertyBlueprintGroups[groupName];
            if (group != null) {
                delete this._propertyBlueprintGroups[groupName];
            }
            return group;
        }
    },

    /**
     * Adds a property blueprint to the group name.
     * if the group does not exist creates it.
     * @function
     * @param {string} property to add
     * @param {string} name of the group
     * @returns {Array.<PropertyBlueprint>} property blueprint group
     */
    addPropertyBlueprintToGroupNamed: {
        value: function (propertyBlueprint, groupName) {
            var group = this._propertyBlueprintGroups[groupName];
            if (group == null) {
                group = this.addPropertyBlueprintGroupNamed(groupName);
            }
            var index = group.indexOf(propertyBlueprint);
            if (index < 0) {
                group.push(propertyBlueprint);
            }
            return group;
        }
    },

    /**
     * Removes a property blueprint from the group name.
     * @function
     * @param {string} name of the property
     * @param {string} name of the group
     * @returns {Array.<PropertyBlueprint>} property blueprint group
     */
    removePropertyBlueprintFromGroupNamed: {
        value: function (propertyBlueprint, groupName) {
            var group = this._propertyBlueprintGroups[groupName];
            if ((group != null) && (propertyBlueprint != null)) {
                var index = group.indexOf(propertyBlueprint);
                if (index >= 0) {
                    group.splice(index, 1);
                }
            }
            return (group != null ? group : []);
        }
    },

    _eventBlueprints: {
        value: null
    },

    /**
     * @property {Array.<EventBlueprint>} value
     */
    eventBlueprints: {
        value: null
    },

    _eventBlueprintsTable: {
        value: {},
        distinct: true,
        writable: false
    },


    /**
     * Add a new property blueprint to this blueprint.
     *
     * If that property blueprint was associated with another blueprint it will
     * be removed first.
     *
     * @function
     * @param {string} property blueprint The property blueprint to be added.
     * @returns {PropertyBlueprint}
     */
    addEventBlueprint: {
        value: function (eventBlueprint) {
            if (eventBlueprint !== null && eventBlueprint.name !== null) {
                var index = this._eventBlueprints.indexOf(eventBlueprint);
                if (index < 0) {
                    if (eventBlueprint.owner && eventBlueprint.owner !== this) {
                        eventBlueprint.owner.removeEventBlueprint(eventBlueprint);
                    }
                    this._eventBlueprints.push(eventBlueprint);
                    this._eventBlueprintsTable[eventBlueprint.name] = eventBlueprint;
                    eventBlueprint._owner = this;
                }
            }
            return eventBlueprint;
        }
    },

    /**
     * Removes an property blueprint from the property blueprint list of this
     * blueprint.
     * @function
     * @param {Object} property blueprint The property blueprint to be removed.
     * @returns {PropertyBlueprint}
     */
    removeEventBlueprint: {
        value: function (eventBlueprint) {
            if (eventBlueprint !== null && eventBlueprint.name !== null) {
                var index = this._eventBlueprints.indexOf(eventBlueprint);
                if (index >= 0) {
                    this._eventBlueprints.splice(index, 1);
                    delete this._eventBlueprintsTable[eventBlueprint.name];
                    eventBlueprint._owner = null;
                }
            }
            return eventBlueprint;
        }
    },

    /**
     * Return a new event blueprint.
     * **Note:** This is the canonical way of creating new event blueprint in
     * order to enable subclassing.
     * @param {string} name name of the event blueprint to create
     */
    newEventBlueprint: {
        value: function (name) {
            return new EventBlueprint().initWithNameAndBlueprint(name, this);
        }
    },


    /**
     * Convenience to add an event blueprint.
     * @function
     * @param {string} name
     * @returns {EventBlueprint}
     */
    addEventBlueprintNamed: {
        value: function (name, inverse) {
            return this.addEventBlueprint(this.newEventBlueprint(name));
        }
    },

    /**
     * @function
     * @param {string} name
     * @returns {EventBlueprint}
     */
    eventBlueprintForName: {
        value: function (name) {
            var eventBlueprint = this._eventBlueprintsTable[name];
            if (typeof eventBlueprint === "undefined") {
                eventBlueprint = UnknownEventBlueprint;
                var anEventBlueprint, index;
                for (index = 0; typeof (anEventBlueprint = this._eventBlueprints[index]) !== "undefined"; index++) {
                    if (anEventBlueprint.name === name) {
                        eventBlueprint = anEventBlueprint;
                        break;
                    }
                }
                this._eventBlueprintsTable[name] = eventBlueprint;
            }
            if (eventBlueprint === UnknownEventBlueprint) {
                eventBlueprint = null;
            }
            if ((! eventBlueprint) && (this.parent)) {
                eventBlueprint = this.parent.eventBlueprintForName(name);
            }
            return eventBlueprint;
        }

    },


    _propertyValidationRules: {
        value: {}
    },

    /**
     * Gets the list of properties validation rules.
     * @returns {Array.<PropertyValidationRule>} copy of the list of properties
     * validation rules.
     */
    propertyValidationRules: {
        get: function () {
            var propertyValidationRules = [];
            for (var name in this._propertyValidationRules) {
                propertyValidationRules.push(this._propertyValidationRules[name]);
            }
            if (this.parent) {
                propertyValidationRules = propertyValidationRules.concat(this.parent.propertyValidationRules);
            }
            return propertyValidationRules;
        }
    },

    /**
     * Returns the properties validation rule for that name
     * @param {string} name of the rule
     * @returns {PropertyDescription} property description
     */
    propertyValidationRuleForName: {
        value: function (name) {
            var propertyValidationRule = this._propertyValidationRules[name];
            if ((! propertyValidationRule) && (this.parent)) {
                propertyValidationRule = this.parent.propertyValidationRuleForName(name);
            }
            return propertyValidationRule;
        }
    },

    /**
     * Add a new properties validation rule .
     * @function
     * @param {string} name of the rule
     * @returns {PropertyDescription} new properties validation rule
     */
    addPropertyValidationRule: {
        value: function (name) {
            var propertyValidationRule = this._propertyValidationRules[name];
            if (propertyValidationRule == null) {
                propertyValidationRule = new PropertyValidationRule().initWithNameAndBlueprint(name, this);
                this._propertyValidationRules[name] = propertyValidationRule;
            }
            return propertyValidationRule;
        }
    },

    /**
     * Remove the properties validation rule  for the name.
     * @function
     * @param {string} name of the rule
     * @returns {PropertyDescription} removed properties validation rule
     */
    removePropertyValidationRule: {
        value: function (name) {
            var propertyValidationRule = this._propertyValidationRules[name];
            if (propertyValidationRule != null) {
                delete this._propertyValidationRules[name];
            }
            return propertyValidationRule;
        }
    },

    /**
     * Evaluates the rules based on the object and the properties.
     * @param {Object} object instance to evaluate the rule for
     * @returns {Array.<string>} list of message key for rule that fired. Empty
     * array otherwise.
     */
    evaluateRules: {
        value: function (objectInstance) {
            var messages = [];
            for (var name in this._propertyValidationRules) {
                var rule = this._propertyValidationRules[name];
                if (rule.evaluateRule(objectInstance)) {
                    messages.push(rule.messageKey);
                }
            }
            return messages;
        }
    },

    blueprintModuleId:require("../core")._blueprintModuleIdDescriptor,

    blueprint:require("../core")._blueprintDescriptor


}, {

    getBlueprintWithModuleId: {
        value: deprecate.deprecateMethod(void 0, function (moduleId, _require) {
            return require("./module-blueprint").ModuleBlueprint.getBlueprintWithModuleId(moduleId, _require);
        }, "Blueprint.getBlueprintWithModuleId", "ModuleBlueprint.getBlueprintWithModuleId")
    },

    /**
     * Creates a default blueprint with all enumerable properties.
     *
     * **Note:** Value type are set to the string default.
     */
    createDefaultBlueprintForObject: {
        value:function (object) {
            if (object) {
                var target = Montage.getInfoForObject(object).isInstance ? Object.getPrototypeOf(object) : object.prototype;
                var info = Montage.getInfoForObject(target);

                // Create `new this()` so that subclassing works
                var newBlueprint = new this();

                for (var name in target) {
                    if ((name.charAt(0) !== "_") && (target.hasOwnProperty(name))) {
                        // We don't want to list private properties
                        var value = target[name];
                        var propertyBlueprint;
                        if (Array.isArray(value)) {
                            propertyBlueprint = newBlueprint.addToManyPropertyBlueprintNamed(name);
                        } else {
                            propertyBlueprint = newBlueprint.addToOnePropertyBlueprintNamed(name);
                        }
                        newBlueprint.addPropertyBlueprintToGroupNamed(propertyBlueprint, info.objectName);
                    }
                }
                var parentObject = Object.getPrototypeOf(target);
                if (parentObject && "blueprint" in parentObject) {
                    return parentObject.blueprint.then(function (blueprint) {
                        newBlueprint.parent = blueprint;
                        return newBlueprint;
                    });
                } else {
                    return Promise.resolve(newBlueprint);
                }
            } else {
                return Promise.resolve(UnknownBlueprint);
            }
        }
    }
});

var UnknownBlueprint = Object.freeze(new Blueprint().initWithName("Unknown"));

var UnknownPropertyBlueprint = Object.freeze(new PropertyBlueprint().initWithNameBlueprintAndCardinality("Unknown", null, 1));
var UnknownEventBlueprint = Object.freeze(new EventBlueprint().initWithNameAndBlueprint("Unknown", null));

