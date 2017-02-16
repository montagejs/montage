
/**
 * @module montage/core/meta/blueprint
 * @requires montage/core/core
 * @requires core/exception
 * @requires core/promise
 */
var Montage = require("../core").Montage,
    DerivedPropertyBlueprint = require("./derived-property-blueprint").DerivedPropertyBlueprint,
    EventDescriptor = require("./event-descriptor").EventDescriptor,
    ModelModule = require("./model"),
    ObjectDescriptorReference = require("./object-descriptor-reference").ObjectDescriptorReference,
    Promise = require("../promise").Promise,
    PropertyDescriptor = require("./property-descriptor").PropertyDescriptor,
    PropertyValidationRule = require("./validation-rule").PropertyValidationRule,
    deprecate = require("../deprecate");

var Defaults = {
    name: "default",
    customPrototype: false
};

/**
 * @class ObjectDescriptor
 * @extends Montage
 */
var ObjectDescriptor = exports.ObjectDescriptor = Montage.specialize( /** @lends ObjectDescriptor.prototype # */ {

    FileExtension: {
        value: ".mjson"
    },

    constructor: {
        value: function ObjectDescriptor() {
            this._eventDescriptors = [];
            this._propertyDescriptors = [];
            this._propertyDescriptorGroups = {};
            Object.defineProperty(this,"_propertyDescriptorsTable",{ value:{}, writable: false});
            Object.defineProperty(this,"_eventPropertyDescriptorsTable",{ value:{}, writable: false});
            this.defineBinding("eventDescriptors", {"<-": "_eventDescriptors.concat(parent.eventDescriptors)"});
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

    serializeSelf: {
        value:function (serializer) {
            serializer.setProperty("name", this.name);
            if ((this._model) && (!this.model.isDefault)) {
                serializer.setProperty("model", this._model, "reference");
            }

            if (this.objectDescriptorInstanceModule) {
                serializer.setProperty("objectDescriptorModule", this.objectDescriptorInstanceModule);
            }
            if (this._parentReference) {
                serializer.setProperty("parent", this._parentReference);
            }

            this._setPropertyWithDefaults(serializer, "customPrototype", this.customPrototype);
            //
            if (this._propertyDescriptors.length > 0) {
                serializer.setProperty("propertyDescriptors", this._propertyDescriptors);
            }
            if (Object.getOwnPropertyNames(this._propertyDescriptorGroups).length > 0) {
                serializer.setProperty("propertyDescriptorGroups", this._propertyDescriptorGroups);
            }
            if (this._eventDescriptors.length > 0) {
                serializer.setProperty("eventDescriptors", this._eventDescriptors);
            }
            if (this._propertyValidationRules.length > 0) {
                serializer.setProperty("propertyValidationRules", this._propertyValidationRules);
            }
        }
    },

    deserializeSelf: {
        value:function (deserializer) {
            var value, model;
            this._name = deserializer.getProperty("name");
            value = deserializer.getProperty("model") || deserializer.getProperty("binder");
            if (value) {
                this._model = value;
            }
            this.objectDescriptorInstanceModule = deserializer.getProperty("objectDescriptorModule") || deserializer.getProperty("blueprintModule");
            this._parentReference = deserializer.getProperty("parent");

            this.customPrototype = this._getPropertyWithDefaults(deserializer, "customPrototype");
            //
            value = deserializer.getProperty("propertyDescriptors") || deserializer.getProperty("propertyBlueprints");
            if (value) {
                this._propertyDescriptors = value;
            }
            value = deserializer.getProperty("propertyDescriptorGroups") || deserializer.getProperty("propertyBlueprintGroups");
            if (value) {
                this._propertyDescriptorGroups = value;
            }
            value = deserializer.getProperty("eventDescriptors") || deserializer.getProperty("eventBlueprints");
            if (value) {
                this._eventDescriptors = value;
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
        value: function (aPrototype, propertyDescriptor, constructorDescriptor) {
            var newConstructor;

            if ((typeof aPrototype === "undefined") || (ObjectDescriptor.prototype.isPrototypeOf(aPrototype))) {
                var parentCreate = Object.getPrototypeOf(ObjectDescriptor).create;
                return parentCreate.call(this, (typeof aPrototype === "undefined" ? this : aPrototype), propertyDescriptor, constructorDescriptor);
            }

            if (typeof aPrototype.specialize !== "function" && !propertyDescriptor) {
                newConstructor = new aPrototype();
            } else {
                newConstructor = aPrototype.specialize(propertyDescriptor, constructorDescriptor);
            }
            this.ObjectProperty.applyWithObjectDescriptor(newConstructor.prototype, this);
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
                this.ObjectProperty.applyWithObjectDescriptor(newConstructor.prototype, this);

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
            if (this.model) {
                return this.model.ObjectProperty;
            }
            return ModelModule.Model.group.defaultObjectDescriptorObjectProperty;
        }
    },

    /**
     * This is used for references only so that we can reload referenced
     * blueprints.
     */
    objectDescriptorInstanceModule: {
        serializable: false,
        value: null
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
                "objectDescriptor",
                (this.name || "unnamed").toLowerCase()
            ].join("_");
        }
    },

    _model: {
        value: null
    },

    /**
     * @returns {Property}
     * @default null
     */
    model: {
        serializable: false,
        get: function () {
            if (! this._model) {
                this._model = ModelModule.Model.group.defaultModel;
                this._model.addObjectDescriptor(this);
            }
            return this._model;
        },
        set: function (value) {
            this._model = value;
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
     * @returns {?ObjectDescriptorReference}
     */
    parent: {
        serializable: false,
        get: function () {
            return this._parent;
        },
        set: function (objectDescriptor) {
            if (objectDescriptor) {
                this._parentReference = new ObjectDescriptorReference().initWithValue(objectDescriptor);
                this._parent = objectDescriptor;
            } else {
                this._parentReference = null;
                this._parent = null;
            }
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

    _propertyDescriptors: {
        value: null
    },

    /**
     * @returns {Array.<PropertyDescriptor>}
     */
    propertyDescriptors: {
        get: function () {
            var propertyDescriptors = [];
            propertyDescriptors = propertyDescriptors.concat(this._propertyDescriptors);
            if (this.parent) {
                propertyDescriptors = propertyDescriptors.concat(this.parent.propertyDescriptors);
            }
            return propertyDescriptors;
        }
    },

    _propertyDescriptorsTable: {
        value: null
    },

    /**
     * Adds a new property descriptor to this object descriptor.
     *
     * If that property descriptor was associated with another object descriptor it will
     * be removed first.
     *
     * @function
     * @param {PropertyDescriptor} property blueprint to be added.
     * @returns the property descriptor
     */
    addPropertyDescriptor: {
        value: function (propertyDescriptor) {
            if (propertyDescriptor !== null && propertyDescriptor.name !== null) {
                var index = this._propertyDescriptors.indexOf(propertyDescriptor);
                if (index < 0) {
                    if ((propertyDescriptor.owner !== null) && (propertyDescriptor.owner !== this)) {
                        propertyDescriptor.owner.removePropertyDescriptor(propertyDescriptor);
                    }
                    this._propertyDescriptors.push(propertyDescriptor);
                    this._propertyDescriptorsTable[propertyDescriptor.name] = propertyDescriptor;
                    propertyDescriptor._owner = this;
                }
            }
            return propertyDescriptor;
        }
    },

    /**
     * Removes a property descriptor from the property descriptor list of this
     * object descriptor.
     *
     * @function
     * @param {PropertyDescriptor} The property descriptor to be removed.
     * @returns the same property descriptor
     */
    removePropertyDescriptor: {
        value: function (propertyDescriptor) {
            if (propertyDescriptor !== null && propertyDescriptor.name !== null) {
                var index = this._propertyDescriptors.indexOf(propertyDescriptor);
                if (index >= 0) {
                    this._propertyDescriptors.splice(index, 1);
                    delete this._propertyDescriptorsTable[propertyDescriptor.name];
                    propertyDescriptor._owner = null;
                }
            }
            return propertyDescriptor;
        }
    },

    /**
     * Return a new property blueprint.
     *
     * **Note:** This is the canonical way of creating new property blueprint
     * in order to enable subclassing.
     * @param {string} name name of the property blueprint to create
     * @param {number} cardinality name of the property blueprint to create
     * @returns {PropertyDescriptor}
     */
    newPropertyDescriptor: {
        value: function (name, cardinality) {
            return new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality(name, this, cardinality);
        }
    },

    /**
     * Convenience to add one property blueprint.
     * @function
     * @param {string} name Add to one property blueprint
     * @returns {PropertyDescriptor}
     */
    addToOnePropertyDescriptorNamed: {
        value: function (name) {
            return this.addPropertyDescriptor(this.newPropertyDescriptor(name, 1));
        }
    },

    /**
     * Convenience to add many property blueprints.
     * @function
     * @param {string} name Add to many property blueprints
     * @returns {PropertyDescriptor}
     */
    addToManyPropertyDescriptorNamed: {
        value: function (name) {
            return this.addPropertyDescriptor(this.newPropertyDescriptor(name, Infinity));
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
     * @returns {PropertyDescriptor}
     */
    propertyDescriptorForName: {
        value: function (name) {
            var propertyDescriptor = this._propertyDescriptorsTable[name];
            if (propertyDescriptor === undefined) {
                propertyDescriptor = UnknownPropertyDescriptor;
                var aPropertyDescriptor, index;
                for (index = 0; typeof (aPropertyDescriptor = this._propertyDescriptors[index]) !== "undefined"; index++) {
                    if (aPropertyDescriptor.name === name) {
                        propertyDescriptor = aPropertyDescriptor;
                        break;
                    }
                }
                this._propertyDescriptorsTable[name] = propertyDescriptor;
            }
            if (propertyDescriptor === UnknownPropertyDescriptor) {
                propertyDescriptor = null;
            }
            if (!propertyDescriptor && this.parent) {
                propertyDescriptor = this.parent.propertyDescriptorForName(name);
            }
            return propertyDescriptor;
        }

    },

    _propertyDescriptorGroups: {
        value: null
    },

    /**
     * List of properties blueprint groups names
     * @returns {Array.<PropertyBlueprint>}
     */
    propertyDescriptorGroups: {
        get: function () {
            var groups = [],
                name;
            for (name in this._propertyDescriptorGroups) {
                groups.push(name);
            }
            if (this.parent) {
                groups = groups.concat(this.parent.propertyDescriptorGroups);
            }
            return groups;
        }
    },

    /**
     * Returns the group associated with that name
     * @param {string} name of the group
     * @returns {Array.<PropertyDescriptor>} property descriptor group
     */
    propertyDescriptorGroupForName: {
        value: function (groupName) {
            var group = this._propertyDescriptorGroups[groupName];
            if ((! group) && (this.parent)) {
                group = this.parent.propertyDescriptorGroupForName(groupName);
            }
            return group;
        }
    },

    /**
     * Add a new property descriptor group.
     * @function
     * @param {string} name of the group
     * @returns {Array.<PropertyDescriptor>} new property descriptor group
     */
    addPropertyDescriptorGroupNamed: {
        value: function (groupName) {
            var group = this._propertyDescriptorGroups[groupName];
            if (group == null) {
                group = [];
                this._propertyDescriptorGroups[groupName] = group;
            }
            return group;
        }
    },

    /**
     * Remove the property descriptor group.
     * @function
     * @param {string} name of the group to remove
     * @returns {Array.<PropertyDescriptor>} removed property blueprint group
     */
    removePropertyDescriptorGroupNamed: {
        value: function (groupName) {
            var group = this._propertyDescriptorGroups[groupName];
            if (group != null) {
                delete this._propertyDescriptorGroups[groupName];
            }
            return group;
        }
    },

    /**
     * Adds a property descriptor to the group name.
     * if the group does not exist creates it.
     * @function
     * @param {string} property to add
     * @param {string} name of the group
     * @returns {Array.<PropertyBlueprint>} property blueprint group
     */
    addPropertyDescriptorToGroupNamed: {
        value: function (propertyDescriptor, groupName) {
            var group = this._propertyDescriptorGroups[groupName],
                index;
            if (group == null) {
                group = this.addPropertyDescriptorGroupNamed(groupName);
            }
            index = group.indexOf(propertyDescriptor);
            if (index < 0) {
                group.push(propertyDescriptor);
            }
            return group;
        }
    },

    /**
     * Removes a property blueprint from the group name.
     * @function
     * @param {string} name of the property
     * @param {string} name of the group
     * @returns {Array.<PropertyDescriptor>} property descriptor group
     */
    removePropertyDescriptorFromGroupNamed: {
        value: function (propertyDescriptor, groupName) {
            var group = this._propertyDescriptorGroups[groupName];
            if ((group != null) && (propertyDescriptor != null)) {
                var index = group.indexOf(propertyDescriptor);
                if (index >= 0) {
                    group.splice(index, 1);
                }
            }
            return (group != null ? group : []);
        }
    },

    _eventDescriptors: {
        value: null
    },

    /**
     * @property {Array.<EventDescriptor>} value
     */
    eventDescriptors: {
        value: null
    },

    _eventPropertyDescriptorsTable: {
        value: null
    },


    /**
     * Adds a new event property descriptor to this object descriptor.
     *
     * If that event property descriptor was associated with another object descriptor it will
     * be removed first.
     *
     * @function
     * @param {string} event property descriptor to be added.
     * @returns {EventPropertyDescriptor}
     */
    addEventDescriptor: {
        value: function (eventDescriptor) {
            if (eventDescriptor !== null && eventDescriptor.name !== null) {
                var index = this._eventDescriptors.indexOf(eventDescriptor);
                if (index < 0) {
                    if (eventDescriptor.owner && eventDescriptor.owner !== this) {
                        eventDescriptor.owner.removeEventDescriptor(eventDescriptor);
                    }
                    this._eventDescriptors.push(eventDescriptor);
                    this._eventPropertyDescriptorsTable[eventDescriptor.name] = eventDescriptor;
                    eventDescriptor._owner = this;
                }
            }
            return eventDescriptor;
        }
    },

    /**
     * Removes an property blueprint from the property blueprint list of this
     * blueprint.
     * @function
     * @param {Object} property blueprint The property blueprint to be removed.
     * @returns {PropertyBlueprint}
     */
    removeEventDescriptor: {
        value: function (eventDescriptor) {
            if (eventDescriptor !== null && eventDescriptor.name !== null) {
                var index = this._eventDescriptors.indexOf(eventDescriptor);
                if (index >= 0) {
                    this._eventDescriptors.splice(index, 1);
                    delete this._eventPropertyDescriptorsTable[eventDescriptor.name];
                    eventDescriptor._owner = null;
                }
            }
            return eventDescriptor;
        }
    },

    /**
     * Return a new event property descriptor.
     * **Note:** This is the canonical way of creating new event property descriptors in
     * order to enable subclassing.
     * @param {string} name name of the event property descriptor to create
     */
    newEventDescriptor: {
        value: function (name) {
            return new EventDescriptor().initWithNameAndObjectDescriptor(name, this);
        }
    },


    /**
     * Convenience to add an event blueprint.
     * @function
     * @param {string} name
     * @returns {EventDescriptor}
     */
    addEventDescriptorNamed: {
        value: function (name) {
            return this.addEventDescriptor(this.newEventDescriptor(name));
        }
    },

    /**
     * @function
     * @param {string} name
     * @returns {EventDescriptor}
     */
    eventDescriptorForName: {
        value: function (name) {
            var eventDescriptor = this._eventPropertyDescriptorsTable[name];
            if (typeof eventDescriptor === "undefined") {
                eventDescriptor = UnknownEventDescriptor;
                var anEventPropertyDescriptor, index;
                for (index = 0; typeof (anEventPropertyDescriptor = this._eventDescriptors[index]) !== "undefined"; index++) {
                    if (anEventPropertyDescriptor.name === name) {
                        eventDescriptor = anEventPropertyDescriptor;
                        break;
                    }
                }
                this._eventPropertyDescriptorsTable[name] = eventDescriptor;
            }
            // TODO: Come back after creating event property descriptor
            if (eventDescriptor === UnknownEventDescriptor) {
                eventDescriptor = null;
            }
            if ((! eventDescriptor) && (this.parent)) {
                eventDescriptor = this.parent.eventDescriptorForName(name);
            }
            return eventDescriptor;
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
            var propertyValidationRules = [], name;
            for (name in this._propertyValidationRules) {
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
            if (!propertyValidationRule && this.parent) {
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
            var messages = [], name, rule;
            for (name in this._propertyValidationRules) {
                rule = this._propertyValidationRules[name];
                if (rule.evaluateRule(objectInstance)) {
                    messages.push(rule.messageKey);
                }
            }
            return messages;
        }
    },

    objectDescriptorModuleId: require("../core")._objectDescriptorModuleIdDescriptor,
    objectDescriptor: require("../core")._objectDescriptorDescriptor,

    /**********************************************************************************
     * Deprecated methods.
     */

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
        value: deprecate.deprecateMethod(void 0, function (eventBlueprint) {
            return this.addEventDescriptor(eventBlueprint);
        }, "addEventBlueprint", "addEventDescriptor")
        // value: function (eventBlueprint) {
        //     // if (eventBlueprint !== null && eventBlueprint.name !== null) {
        //     //     var index = this._eventBlueprints.indexOf(eventBlueprint);
        //     //     if (index < 0) {
        //     //         if (eventBlueprint.owner && eventBlueprint.owner !== this) {
        //     //             eventBlueprint.owner.removeEventBlueprint(eventBlueprint);
        //     //         }
        //     //         this._eventBlueprints.push(eventBlueprint);
        //     //         this._eventBlueprintsTable[eventBlueprint.name] = eventBlueprint;
        //     //         eventBlueprint._owner = this;
        //     //     }
        //     // }
        //     // return eventBlueprint;
        //     this.addEventDescriptor(eventBlueprint);
        // }
    },

    /**
     * Convenience to add an event blueprint.
     * @function
     * @param {string} name
     * @returns {EventBlueprint}
     */
    addEventBlueprintNamed: {
        value: deprecate.deprecateMethod(void 0, function (name) {
            return this.addEventDescriptorNamed(name);
        }, "addEventBlueprintNamed", "addEventDescriptorNamed")
        // value: function (name, inverse) {
        //     // return this.addEventBlueprint(this.newEventBlueprint(name));
        //     return this.addEventDescriptorNamed(name);
        // }
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
        value: deprecate.deprecateMethod(void 0, function (propertyBlueprint) {
            this.addPropertyDescriptor(propertyBlueprint);
        }, "addPropertyBlueprint", "addPropertyDescriptor")
        // value: function (propertyBlueprint) {
        //     // if (propertyBlueprint !== null && propertyBlueprint.name !== null) {
        //     //     var index = this._propertyBlueprints.indexOf(propertyBlueprint);
        //     //     if (index < 0) {
        //     //         if ((propertyBlueprint.owner !== null) && (propertyBlueprint.owner !== this)) {
        //     //             propertyBlueprint.owner.removePropertyBlueprint(propertyBlueprint);
        //     //         }
        //     //         this._propertyBlueprints.push(propertyBlueprint);
        //     //         this._propertyBlueprintsTable[propertyBlueprint.name] = propertyBlueprint;
        //     //         propertyBlueprint._owner = this;
        //     //     }
        //     // }
        //     // return propertyBlueprint;
        //     this.addPropertyDescriptor(propertyBlueprint);
        // }
    },

    /**
     * Add a new property blueprint group.
     * @function
     * @param {string} name of the group
     * @returns {Array.<PropertyBlueprint>} new property blueprint group
     */
    addPropertyBlueprintGroupNamed: {
        value: deprecate.deprecateMethod(void 0, function (groupName) {
            this.addPropertyDescriptorGroupNamed(groupName);
        }, "addPropertyBlueprintGroupNamed", "addPropertyDescriptorGroupNamed")
        // value: function (groupName) {
        //     // var group = this._propertyBlueprintGroups[groupName];
        //     // if (group == null) {
        //     //     group = [];
        //     //     this._propertyBlueprintGroups[groupName] = group;
        //     // }
        //     // return group;
        //     this.addPropertyDescriptorGroupNamed(groupName);
        // }
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
        value: deprecate.deprecateMethod(void 0, function (propertyBlueprint, groupName) {
            this.addPropertyDescriptorToGroupNamed(propertyBlueprint, groupName);
        }, "addPropertyBlueprintToGroupNamed", "addPropertyDescriptorToGroupNamed")
        // value: function (propertyBlueprint, groupName) {
        //     // var group = this._propertyBlueprintGroups[groupName];
        //     // if (group == null) {
        //     //     group = this.addPropertyBlueprintGroupNamed(groupName);
        //     // }
        //     // var index = group.indexOf(propertyBlueprint);
        //     // if (index < 0) {
        //     //     group.push(propertyBlueprint);
        //     // }
        //     // return group;
        //     this.addPropertyDescriptorGroupNamed(propertyBlueprint, groupName);
        // }
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
            // TODO: Implement
            // var relationship = this.addPropertyBlueprint(this.newAssociationBlueprint(name, Infinity));
            // if (inverse) {
            //     relationship.targetBlueprint = inverse.owner;
            //     inverse.targetBlueprint = this;
            // }
            // return relationship;
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
            // TODO: Implement
            // var relationship = this.addPropertyBlueprint(this.newAssociationBlueprint(name, 1));
            // if (inverse) {
            //     relationship.targetBlueprint = inverse.owner;
            //     inverse.targetBlueprint = this;
            // }
            // return relationship;
        }
    },

    addToOnePropertyBlueprintNamed: {
        value: deprecate.deprecateMethod(void 0, function (name) {
            return this.addToOnePropertyDescriptorNamed(name);
        }, "addToOnePropertyBlueprintNamed", "addToOnePropertyDescriptorNamed")
    },

    addToManyPropertyBlueprintNamed: {
        value: deprecate.deprecateMethod(void 0, function (name) {
            return this.addToManyPropertyDescriptorNamed(name);
        }, "addToManyPropertyBlueprintNamed", "addToManyPropertyDescriptorNamed")
    },

    /**
     * This is used for references only so that we can reload referenced
     * blueprints.
     */
    blueprintInstanceModule: {
        serializable: false,
        get: deprecate.deprecateMethod(void 0, function () {
            return this.objectDescriptorInstanceModule;
        }, "blueprintInstanceModule.get", "objectDescriptorInstanceModule.get"),
        set: deprecate.deprecateMethod(void 0, function (value) {
            this.objectDescriptorInstanceModule = value;
        }, "blueprintInstanceModule.set", "objectDescriptorInstanceModule.set")
    },

    /**
     * @returns {Property}
     * @default null
     */
    binder: {
        serializable: false,
        get: deprecate.deprecateMethod(void 0, function () {
            return this.model;
        }, "binder.get", "model.get"),
        set: deprecate.deprecateMethod(void 0, function (value) {
            this.model = value;
        }, "binder.set", "model.set")
    },

    /**
     * @function
     * @param {string} name
     * @returns {EventBlueprint}
     */
    eventBlueprintForName: {
        value: deprecate.deprecateMethod(void 0, function (name) {
            return this.eventDescriptorForName(name);
        }, "eventBlueprintForName", "eventDescriptorForName")
    },

    /**
     * @property {Array.<EventBlueprint>} value
     */
    eventBlueprints: {
        // value: null
        get: deprecate.deprecateMethod(void 0, function () {
            return this.eventDescriptors;
        }, "eventBlueprints.get", "eventDescriptors.get"),
        set: deprecate.deprecateMethod(void 0, function (value) {
            this.eventDescriptors = value;
        }, "eventBlueprints.set", "eventDescriptors.set")
    },

    /**
     * Return a new association blueprint.
     * **Note:** This is the canonical way of creating new association
     * blueprint in order to enable subclassing.
     * @param {string} name name of the association blueprint to create
     * @param {number} cardinality name of the association blueprint to create
     * @returns {AssociationBlueprint}
     */
    // TODO: Deprecate -- discuss with Benoit.
    newAssociationBlueprint: {
        value: function (name, cardinality) {
            // TODO: Implement.
            return cardinality === 1 ?  this.addToOnePropertyDescriptorNamed(name) :
                                        this.addToManyPropertyDescriptorNamed(name);
            // return new AssociationBlueprint().initWithNameBlueprintAndCardinality(name, this, cardinality);
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
            // TODO: Implement
            return new DerivedPropertyBlueprint().initWithNameBlueprintAndCardinality(name, this, cardinality);
        }
    },

    /**
     * Return a new event blueprint.
     * **Note:** This is the canonical way of creating new event blueprint in
     * order to enable subclassing.
     * @param {string} name name of the event blueprint to create
     */
    newEventBlueprint: {
        value: deprecate.deprecateMethod(void 0, function (name) {
            return this.newEventDescriptor(name);
        }, "newEventBlueprint", "newEventDescriptor")
        // value: function (name) {
        //     // return new EventBlueprint().initWithNameAndBlueprint(name, this);
        //     return this.newEventDescriptor(name);
        // }
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
        value: deprecate.deprecateMethod(void 0, function (name, cardinality) {
            return this.newPropertyDescriptor(name, cardinality);
        }, "newPropertyBlueprint", "newPropertyDescriptor")
        // value: function (name, cardinality) {
            //
            // // return new PropertyBlueprint().initWithNameBlueprintAndCardinality(name, this, cardinality);
            // return this.newPropertyDescriptor(name, cardinality);
        // }
    },

    /**
     * @function
     * @param {string} name
     * @returns {PropertyBlueprint}
     */
    propertyBlueprintForName: {
        value: deprecate.deprecateMethod(void 0, function (name) {
            return this.propertyDescriptorForName(name);
        }, "propertyBlueprintForName", "propertyDescriptorForName")
            // var propertyBlueprint = this._propertyBlueprintsTable[name];
            // if (typeof propertyBlueprint === "undefined") {
            //     propertyBlueprint = UnknownPropertyBlueprint;
            //     var anPropertyBlueprint, index;
            //     for (index = 0; typeof (anPropertyBlueprint = this._propertyBlueprints[index]) !== "undefined"; index++) {
            //         if (anPropertyBlueprint.name === name) {
            //             propertyBlueprint = anPropertyBlueprint;
            //             break;
            //         }
            //     }
            //     this._propertyBlueprintsTable[name] = propertyBlueprint;
            // }
            // if (propertyBlueprint === UnknownPropertyBlueprint) {
            //     propertyBlueprint = null;
            // }
            // if ((! propertyBlueprint) && (this.parent)) {
            //     propertyBlueprint = this.parent.propertyBlueprintForName(name);
            // }
            // return propertyBlueprint;
            // return this.propertyDescriptorForName(name);
    },

    /**
     * List of properties blueprint groups names
     * @returns {Array.<PropertyBlueprint>}
     */
    propertyBlueprintGroups: {
        get: deprecate.deprecateMethod(void 0, function () {
            return this.propertyDescriptorGroups;
        }, "propertyBlueprintGroups", "propertyDescriptorGroups")
        // get: function () {
        //     // var groups = [];
        //     // for (var name in this._propertyBlueprintGroups) {
        //     //     groups.push(name);
        //     // }
        //     // if (this.parent) {
        //     //     groups = groups.concat(this.parent.propertyBlueprintGroups);
        //     // }
        //     // return groups;
        //     return this.propertyDescriptorGroups;
        // }
    },

    /**
     * Returns the group associated with that name
     * @param {string} name of the group
     * @returns {Array.<PropertyBlueprint>} property blueprint group
     */
    propertyBlueprintGroupForName: {
        value: deprecate.deprecateMethod(void 0, function (groupName) {
            return this.propertyDescriptorGroupForName(groupName);
        }, "propertyBlueprintGroupForName", "propertyDescriptorForName")
        // value: function (groupName) {
        //     // var group = this._propertyBlueprintGroups[groupName];
        //     // if ((! group) && (this.parent)) {
        //     //     group = this.parent.propertyBlueprintGroupForName(groupName);
        //     // }
        //     // return group;
        //     this.propertyDescriptorForName(groupName);
        // }
    },

    propertyBlueprints: {
        get: deprecate.deprecateMethod(void 0, function () {
            return this.propertyDescriptors;
        }, "propertyBlueprints", "propertyDescriptors")
        // get: function () {
        //     // var propertyBlueprints = [];
        //     // propertyBlueprints = propertyBlueprints.concat(this._propertyBlueprints);
        //     // if (this.parent) {
        //     //     propertyBlueprints = propertyBlueprints.concat(this.parent.propertyBlueprints);
        //     // }
        //     // return propertyBlueprints;
        //     return this.propertyDescriptors;
        // }
    },

    /**
     * Removes an property blueprint from the property blueprint list of this
     * blueprint.
     * @function
     * @param {Object} property blueprint The property blueprint to be removed.
     * @returns {PropertyBlueprint}
     */
    removeEventBlueprint: {
        value: deprecate.deprecateMethod(void 0, function (eventBlueprint) {
            this.removeEventDescriptor(eventBlueprint);
        }, "removeEventBlueprint", "removeEventDescriptor")
        // value: function (eventBlueprint) {
        //     // if (eventBlueprint !== null && eventBlueprint.name !== null) {
        //     //     var index = this._eventBlueprints.indexOf(eventBlueprint);
        //     //     if (index >= 0) {
        //     //         this._eventBlueprints.splice(index, 1);
        //     //         delete this._eventBlueprintsTable[eventBlueprint.name];
        //     //         eventBlueprint._owner = null;
        //     //     }
        //     // }
        //     // return eventBlueprint;
        //     this.removeEventDescriptor(eventBlueprint);
        // }
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
        value: deprecate.deprecateMethod(void 0, function (propertyBlueprint) {
            this.removePropertyDescriptor(propertyBlueprint);
        }, "removePropertyBlueprint", "removePropertyDescriptor")
        // value: function (propertyBlueprint) {
        //     // if (propertyBlueprint !== null && propertyBlueprint.name !== null) {
        //     //     var index = this._propertyBlueprints.indexOf(propertyBlueprint);
        //     //     if (index >= 0) {
        //     //         this._propertyBlueprints.splice(index, 1);
        //     //         delete this._propertyBlueprintsTable[propertyBlueprint.name];
        //     //         propertyBlueprint._owner = null;
        //     //     }
        //     // }
        //     // return propertyBlueprint;
        //     this.removePropertyDescriptor(propertyBlueprint);
        // }
    },

    /**
     * Removes a property blueprint from the group name.
     * @function
     * @param {string} name of the property
     * @param {string} name of the group
     * @returns {Array.<PropertyBlueprint>} property blueprint group
     */
    removePropertyBlueprintFromGroupNamed: {
        value: deprecate.deprecateMethod(void 0, function (propertyBlueprint, groupName) {
            this.removePropertyDescriptorFromGroupNamed(propertyBlueprint, groupName);
        }, "removePropertyBlueprintFromGroupNamed", "removePropertyDescriptorGroupNamed")
        // value: function (propertyBlueprint, groupName) {
        //     // var group = this._propertyBlueprintGroups[groupName];
        //     // if ((group != null) && (propertyBlueprint != null)) {
        //     //     var index = group.indexOf(propertyBlueprint);
        //     //     if (index >= 0) {
        //     //         group.splice(index, 1);
        //     //     }
        //     // }
        //     // return (group != null ? group : []);
        //     this.removePropertyDescriptorGroupNamed(propertyBlueprint, groupName);
        // }
    },

    /**
     * Remove the property blueprint group.
     * @function
     * @param {string} name of the group to remove
     * @returns {Array.<PropertyBlueprint>} removed property blueprint group
     */
    removePropertyBlueprintGroupNamed: {
        value: deprecate.deprecateMethod(void 0, function (groupName) {
            this.removePropertyDescriptorGroupNamed(groupName);
        }, "removePropertyBlueprintGroupNamed", "removePropertyDescriptorGroupNamed")
        // value: function (groupName) {
        //     // var group = this._propertyBlueprintGroups[groupName];
        //     // if (group != null) {
        //     //     delete this._propertyBlueprintGroups[groupName];
        //     // }
        //     // return group;
        //     this.removePropertyDescriptorGroupNamed(groupName);
        // }
    },

    blueprintModuleId:require("../core")._objectDescriptorModuleIdDescriptor,
    blueprint: require("../core")._objectDescriptorDescriptor


}, {

    /**
     * Creates a default blueprint with all enumerable properties.
     *
     * **Note:** Value type are set to the string default.
     */
    createDefaultBlueprintForObject: {
        value: deprecate.deprecateMethod(void 0, function (object) {
            return ObjectDescriptor.createDefaultObjectDescriptorForObject(object);
        }, "Blueprint.createDefaultBlueprintForObject", "ObjectDescriptor.createDefaultObjectDescriptorForObject")
        // value: function (object) {
        //     return ObjectDescriptor.createDefaultObjectDescriptorForObject(object);
        // }
    },

    /**
     * Creates a default blueprint with all enumerable properties.
     *
     * **Note:** Value type are set to the string default.
     */
    createDefaultObjectDescriptorForObject: {
        value:function (object) {
            if (object) {
                var target = Montage.getInfoForObject(object).isInstance ? Object.getPrototypeOf(object) : object.prototype;
                var info = Montage.getInfoForObject(target);

                // Create `new this()` so that subclassing works
                var newObjectDescriptor = new this();

                for (var name in target) {
                    if (name[0] !== "_" && target.hasOwnProperty(name)) {
                        // We don't want to list private properties
                        var value = target[name];
                        var propertyDescriptor;
                        if (Array.isArray(value)) {
                            propertyDescriptor = newObjectDescriptor.addToManyPropertyDescriptorNamed(name);
                        } else {
                            propertyDescriptor = newObjectDescriptor.addToOnePropertyDescriptorNamed(name);
                        }
                        newObjectDescriptor.addPropertyDescriptorGroupNamed(propertyDescriptor, info.objectName);
                    }
                }
                var parentObject = Object.getPrototypeOf(target);
                if (parentObject && "objectDescriptor" in parentObject) {
                    return parentObject.objectDescriptor.then(function (objectDescriptor) {
                        newObjectDescriptor.parent = objectDescriptor;
                        return newObjectDescriptor;
                    });
                } else {
                    return Promise.resolve(newObjectDescriptor);
                }
            } else {
                return Promise.resolve(UnknownObjectDescriptor);
            }
        }
    }
});

var UnknownObjectDescriptor = Object.freeze(new ObjectDescriptor().initWithName("Unknown"));
var UnknownPropertyDescriptor = Object.freeze(new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("Unknown", null, 1));
var UnknownEventDescriptor = Object.freeze(new EventDescriptor().initWithNameAndObjectDescriptor("Unknown", null));
