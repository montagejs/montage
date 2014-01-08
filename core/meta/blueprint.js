"use strict";
/**
 @module montage/core/meta/blueprint
 @requires montage/core/core
 @requires core/exception
 @requires core/promise
 */
var Montage = require("montage").Montage;
var Promise = require("core/promise").Promise;
var Deserializer = require("core/serialization").Deserializer;
var ObjectProperty = require("core/meta/object-property").ObjectProperty;
var BlueprintReference = require("core/meta/blueprint-reference").BlueprintReference;
var PropertyBlueprint = require("core/meta/property-blueprint").PropertyBlueprint;
var AssociationBlueprint = require("core/meta/association-blueprint").AssociationBlueprint;
var DerivedPropertyBlueprint = require("core/meta/derived-property-blueprint").DerivedPropertyBlueprint;
var EventBlueprint = require("core/meta/event-blueprint").EventBlueprint;
var PropertyValidationRule = require("core/meta/validation-rule").PropertyValidationRule;
var deprecate = require("../deprecate");
var Set = require("collections/set");

// customPrototype -> customConstructorModuleReferenceOrSomething
// newInstancePrototype -> getConstructor

var Defaults = {
    name: "default",
    customPrototype: false
};

// These two functions are used for the property and event blueprint Sets to
// ensure that there are no properties or events with duplicate names.
function nameEquals(a, b) {
    return a.name === b.name;
}
function nameHash(value) {
    return value.name;
}

/**
 * @class Blueprint
 */
var Blueprint = exports.Blueprint = Montage.specialize(/** @lends Blueprint# */ {

    FileExtension: {
        value: ".meta"
    },

    constructor: {
        value: function Blueprint() {
            this.superForValue("constructor")();
            this.ownEventBlueprints = new Set(void 0, nameEquals, nameHash);
            this.defineBinding("eventBlueprints", {"<-": "ownEventBlueprints.concat(parent.eventBlueprints)"});
            this.ownPropertyBlueprints = new Set(void 0, nameEquals, nameHash);
            this.defineBinding("propertyBlueprints", {"<-": "ownPropertyBlueprints.concat(parent.propertyBlueprints)"});
        }
    },

    /**
     * @method
     * @param {string} name The name of the blueprint
     * @returns this
     */
    initWithName: {
        value: function(name) {
            this._name = (name !== null ? name : "default");
            this.customPrototype = false;
            return this;
        }
    },

    /**
     * @method
     * @param {string} name TODO
     * @param {string} moduleId TODO
     * @returns itself
     */
    initWithNameAndModuleId: {
        value: deprecate.deprecateMethod(void 0, function (name) {
            return this.initWithName(name);
        }, "Blueprint#initWithNameAndModuleId", "ModuleBlueprint#initWithModuleAndExportName")
    },

    serializeSelf: {
        value: function (serializer) {
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
            if (this.ownPropertyBlueprints.length > 0) {
                serializer.setProperty("propertyBlueprints", this.ownPropertyBlueprints.toArray());
            }
            if (Object.getOwnPropertyNames(this._propertyBlueprintGroups).length > 0) {
                serializer.setProperty("propertyBlueprintGroups", this._propertyBlueprintGroups);
            }
            if (this.ownEventBlueprints.length > 0) {
                serializer.setProperty("eventBlueprints", this.ownEventBlueprints.toArray());
            }
            if (this._propertyValidationRules.length > 0) {
                serializer.setProperty("propertyValidationRules", this._propertyValidationRules);
            }
        }
    },

    deserializeSelf: {
        value: function (deserializer) {
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
                value.forEach(this.addPropertyBlueprint, this);
            }
            value = deserializer.getProperty("propertyBlueprintGroups");
            if (value) {
                this._propertyBlueprintGroups = value;
            }
            value = deserializer.getProperty("eventBlueprints");
            if (value) {
                value.forEach(this.addEventBlueprint, this);
            }
            value = deserializer.getProperty("propertyValidationRules");
            if (value) {
                this._propertyValidationRules = value;
            }
        }
    },

    _setPropertyWithDefaults: {
        value: function (serializer, propertyName, value) {
            if (value != Defaults[propertyName]) {
                serializer.setProperty(propertyName, value);
            }
        }
    },

    _getPropertyWithDefaults: {
        value: function (deserializer, propertyName) {
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
     * @type {string} this._name
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
     * @method
     * @param {Object} aPrototype TODO
     * @param {string} propertyDescriptor TODO
     * @returns newPrototype
     */
    create: {
        value: function (aPrototype, propertyDescriptor) {
            if ((typeof aPrototype === "undefined") || (Blueprint.prototype.isPrototypeOf(aPrototype))) {
                var parentCreate = Object.getPrototypeOf(Blueprint).create;
                return parentCreate.call(this, (typeof aPrototype === "undefined" ? this : aPrototype), propertyDescriptor);
            }
            var newConstructor = Montage.create(aPrototype, propertyDescriptor);
            this.objectPropertyInstance.applyWithBlueprint(newConstructor.prototype, this);
            // We have just created a custom prototype lets use it.
            this.customPrototype = true;
            return newConstructor;
        }
    },

    /**
     * Create a new instance of the target prototype for the blueprint.
     * @method
     * @return new instance
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
     * @method
     * @return new prototype
     */
    newInstancePrototype: {
        value: function () {
            throw new Error("Can't create a constructor for blueprint. Not yet implemented.");
            // This needs to be reimplemented in terms of ModuleBlueprint for
            // what was the “customConstructor”
        }
    },

    /**
     * Return the blueprint object property for this blueprint.
     *
     * This will return the default if none is declared.
     *
     * @type {Property}
     * @returns {ObjectProperty} default blueprint object property instance
     */
    objectPropertyInstance: {
        get: function () {
            if (this.binder) {
                return this.binder.objectPropertyInstance;
            }
            return Blueprint.binderManager.defaultBlueprintObjectPropertyInstance;
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
     * @type {Property}
     * @default {string} this.name
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
     * @type {Property}
     * @default null
     */
    binder: {
        serializable: false,
        get: function () {
            if (!this._binder) {
                this._binder = Blueprint.binderManager.defaultBinder;
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
     * @type {Property}
     * @default {Object} null
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

    /**
     * @type {Property}
     * @default null
     */
    moduleId: {
        get: function () {
            throw new Error("Blueprint#moduleId is deprecated, use ModuleBlueprint#module instead");
        },
        set: function () {
            throw new Error("Blueprint#moduleId is deprecated, use ModuleBlueprint#module instead");
        }
    },

    /**
     * @type {Property}
     * @default null
     */
    prototypeName: {
        get: function () {
            throw new Error("Blueprint#prototypeName is deprecated, use ModuleBlueprint#exportName instead");
        },
        set: function () {
            throw new Error("Blueprint#prototypeName is deprecated, use ModuleBlueprint#exportName instead");
        }
    },

    /**
     * Defines if the blueprint should use custom prototype for new
     * instances.
     *
     * Returns `true` if the blueprint needs to require a custom prototype for
     * creating new instances, `false` if new instance are generic prototypes.
     *
     * @type {boolean}
     * @default false
     */
    customPrototype: {
        value: false
    },

    /**
     * A set of property blueprints that this blueprint owns.
     * @type {Set}
     */
    ownPropertyBlueprints: {
        value: null
    },

    /**
     * An array of property blueprints from this blueprint and all of its
     * parents. Maintained by a binding.
     * @type {Array}
     * @readonly
     */
    propertyBlueprints: {
        value: null
    },

    /**
     * Add a new property blueprint to this blueprint.
     *
     * If that property blueprint was associated with another blueprint it will
     * be removed first.
     *
     * @method
     * @param {string} property blueprint The property blueprint to be added.
     * @returns property blueprint
     */
    addPropertyBlueprint: {
        value: function (propertyBlueprint) {
            if (
                propertyBlueprint &&
                propertyBlueprint.name &&
                this.ownPropertyBlueprints.add(propertyBlueprint)
            ) {
                if (propertyBlueprint.owner && propertyBlueprint.owner !== this) {
                    propertyBlueprint.owner.removePropertyBlueprint(propertyBlueprint);
                }
                propertyBlueprint._owner = this;
            }
            return propertyBlueprint;
        }
    },

    /**
     * Removes an property blueprint from the property blueprint list of this
     * blueprint.
     *
     * @method
     * @param {Object} property blueprint The property blueprint to be removed.
     * @returns property blueprint
     */
    removePropertyBlueprint: {
        value: function (propertyBlueprint) {
            if (propertyBlueprint &&
                propertyBlueprint.name &&
                this.ownPropertyBlueprints.delete(propertyBlueprint)
            ) {
                propertyBlueprint._owner = null;
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
     */
    newPropertyBlueprint: {
        value: function (name, cardinality) {
            return new this.propertyBlueprintConstructor().initWithNameBlueprintAndCardinality(name, this, cardinality);
        }
    },

    /*
     * Enable subclasses to overwrite the blueprint class
     */
    propertyBlueprintConstructor: {
        value: PropertyBlueprint
    },

    /**
     * Return a new association blueprint.
     * <b>Note: </b> This is the canonical way of creating new association blueprint in order to enable subclassing.
     * @param {string} name name of the association blueprint to create
     * @param {number} cardinality name of the association blueprint to create
     */
    newAssociationBlueprint: {
        value: function (name, cardinality) {
            return new this.associationBlueprintConstructor().initWithNameBlueprintAndCardinality(name, this, cardinality);
        }
    },

    /*
     * Enable subclasses to overwrite the blueprint class
     */
    associationBlueprintConstructor: {
        value: AssociationBlueprint
    },

    /**
     * Return a new derived property blueprint.
     * <b>Note: </b> This is the canonical way of creating new derived property blueprint in order to enable subclassing.
     * @param {string} name name of the derived property blueprint to create
     * @param {number} cardinality name of the derived property blueprint to create
     */
    newDerivedPropertyBlueprint: {
        value: function (name, cardinality) {
            return new this.derivedPropertyBlueprintConstructor().initWithNameBlueprintAndCardinality(name, this, cardinality);
        }
    },

    /*
     * Enable subclasses to overwrite the blueprint class
     */
    derivedPropertyBlueprintConstructor: {
        value: DerivedPropertyBlueprint
    },

    /**
     * Convenience to add one property blueprint.
     * @method
     * @param {string} name Add to one property blueprint
     * @returns name
     */
    addToOnePropertyBlueprintNamed: {
        value: function (name) {
            return this.addPropertyBlueprint(this.newPropertyBlueprint(name, 1));
        }
    },

    /**
     * Convenience to add many property blueprints.
     * @method
     * @param {string} name Add to many property blueprints
     * @returns names
     */
    addToManyPropertyBlueprintNamed: {
        value: function (name) {
            return this.addPropertyBlueprint(this.newPropertyBlueprint(name, Infinity));
        }
    },

    /**
     * Convenience to add an property blueprint to one relationship.
     * @method
     * @param {string} name TODO
     * @param {string} inverse TODO
     * @returns relationship
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
     * @method
     * @param {string} name TODO
     * @param {string} inverse TODO
     * @returns relationship
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
     * @method
     * @param {string} name TODO
     * @returns property blueprint
     */
    propertyBlueprintForName: {
        value: function (name) {
            var propertyBlueprint = this.ownPropertyBlueprints.get({name: name});
            if (!propertyBlueprint || propertyBlueprint === UnknownPropertyBlueprint) {
                propertyBlueprint = null;
            }
            if (!propertyBlueprint && this.parent) {
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
     * @returns {array} property blueprint group
     */
    propertyBlueprintGroupForName: {
        value: function (groupName) {
            var group = this._propertyBlueprintGroups[groupName];
            if ((!group) && (this.parent)) {
                group = this.parent.propertyBlueprintGroupForName(groupName);
            }
            return group;
        }
    },

    /**
     * Add a new property blueprint group.
     * @method
     * @param {string} name of the group
     * @returns {array} new property blueprint group
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
     * @method
     * @param {string} name of the group to remove
     * @returns {array} removed property blueprint group
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
     * @method
     * @param {string} property to add
     * @param {string} name of the group
     * @returns {array} property blueprint group
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
     * @method
     * @param {string} name of the property
     * @param {string} name of the group
     * @returns {array} property blueprint group
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

    /**
     * A set of event blueprints that this blueprint owns.
     * @type {Set}
     */
    ownEventBlueprints: {
        value: null
    },

    /**
     * An array of event blueprints from this blueprint and all of its parents
     * @type {Array}
     */
    eventBlueprints: {
        value: null
    },

    /**
     * Add a new property blueprint to this blueprint.
     *
     * If that property blueprint was associated with another blueprint it will
     * be removed first.
     *
     * @method
     * @param {string} property blueprint The property blueprint to be added.
     * @returns property blueprint
     */
    addEventBlueprint: {
        value: function (eventBlueprint) {
            if (
                eventBlueprint &&
                eventBlueprint.name &&
                this.ownEventBlueprints.add(eventBlueprint)
            ) {
                if (eventBlueprint.owner && eventBlueprint.owner !== this) {
                    eventBlueprint.owner.removeEventBlueprint(eventBlueprint);
                }
                eventBlueprint._owner = this;
            }
            return eventBlueprint;
        }
    },

    /**
     * Removes an property blueprint from the property blueprint list of this
     * blueprint.
     * @method
     * @param {Object} property blueprint The property blueprint to be removed.
     * @returns property blueprint
     */
    removeEventBlueprint: {
        value: function (eventBlueprint) {
            if (
                eventBlueprint &&
                eventBlueprint.name &&
                this.ownEventBlueprints.delete(eventBlueprint)
            ) {
                eventBlueprint._owner = null;
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
            return new this.eventBlueprintConstructor().initWithNameAndBlueprint(name, this);
        }
    },

    /*
     * Enable subclasses to overwrite the blueprint class
     */
    eventBlueprintConstructor: {
        value: EventBlueprint
    },

    /**
     * Convenience to add an event blueprint.
     * @method
     * @param {string} name TODO
     * @returns relationship
     */
    addEventBlueprintNamed: {
        value: function (name, inverse) {
            return this.addEventBlueprint(this.newEventBlueprint(name));
        }
    },

    /**
     * @method
     * @param {string} name TODO
     * @returns event blueprint
     */
    eventBlueprintForName: {
        value: function (name) {
            var eventBlueprint = this.ownEventBlueprints.get({name: name});
            if (!eventBlueprint || eventBlueprint === UnknownEventBlueprint) {
                eventBlueprint = null;
            }
            if (!eventBlueprint && this.parent) {
                eventBlueprint = this.parent.eventBlueprintForName(name);
            }
            return eventBlueprint;
        }
    },


    _propertyValidationRules: {
        value: {}
    },

    /**
     * Gets the list of properties validation rules
     * @return {Array} copy of the list of properties validation rules
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

    /*
     * Returns the properties validation rule for that name
     * @param {string} name of the rule
     * @returns {PropertyDescription} property description
     */
    propertyValidationRuleForName: {
        value: function (name) {
            var propertyValidationRule = this._propertyValidationRules[name];
            if ((!propertyValidationRule) && (this.parent)) {
                propertyValidationRule = this.parent.propertyValidationRuleForName(name);
            }
            return propertyValidationRule;
        }
    },

    /*
     * Add a new properties validation rule .
     * @method
     * @param {string} name of the rule
     * @returns {PropertyDescription} new properties validation rule
     */
    addPropertyValidationRule: {
        value: function (name) {
            var propertyValidationRule = this._propertyValidationRules[name];
            if (propertyValidationRule == null) {
                propertyValidationRule = new this.propertyValidationConstructor().initWithNameAndBlueprint(name, this);
                this._propertyValidationRules[name] = propertyValidationRule;
            }
            return propertyValidationRule;
        }
    },

    /*
     * Enable subclasses to overwrite the blueprint class
     */
    propertyValidationConstructor: {
        value: PropertyValidationRule
    },


    /*
     * Remove the properties validation rule  for the name.
     * @method
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

    /*
     * Evaluates the rules based on the object and the properties.
     * @param {Object} object instance to evaluate the rule for
     * @return {Array} list of message key for rule that fired. Empty array
    * otherwise.
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

    blueprintModuleId: require("montage")._blueprintModuleIdDescriptor,

    blueprint: require("montage")._blueprintDescriptor


}, {

    binderManager: {
        get: function () {
            return require("core/meta/binder").Binder.manager;
        }
    },

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
        value: function (object) {
            if (object) {
                var target = Montage.getInfoForObject(object).isInstance ? Object.getPrototypeOf(object) : object;
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

