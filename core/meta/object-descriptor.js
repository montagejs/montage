var Montage = require("../core").Montage,
    DerivedDescriptor = require("./derived-descriptor").DerivedDescriptor,
    EventDescriptor = require("./event-descriptor").EventDescriptor,
    ModelModule = require("./model"),
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
            this.addRangeAtPathChangeListener("_propertyDescriptors", this, "_handlePropertyDescriptorsRangeChange");
            this._propertyDescriptorGroups = {};
            Object.defineProperty(this,"_propertyDescriptorsTable",{ value:{}, writable: false});
            Object.defineProperty(this,"_eventPropertyDescriptorsTable",{ value:{}, writable: false});
            this.defineBinding("eventDescriptors", {"<-": "_eventDescriptors.concat(parent.eventDescriptors)"});
        }
    },

    /**
     * @function
     * @param {string} name The name of the object descriptor
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
            if (this._parent) {
                serializer.setProperty("parent", this._parent);
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
            if (typeof this.maxAge === "number") {
                serializer.setProperty("maxAge", this.maxAge);
            }
        }
    },

    deserializeSelf: {
        value:function (deserializer) {
            var value, model, parentReference;
            this._name = deserializer.getProperty("name");
            value = deserializer.getProperty("model") || deserializer.getProperty("binder");
            if (value) {
                this._model = value;
            }
            this.objectDescriptorInstanceModule = deserializer.getProperty("objectDescriptorModule");
            parentReference = deserializer.getProperty("parent");
            if (parentReference && parentReference.promise && parentReference.valueFromReference) {
                deprecate.deprecationWarningOnce("parent reference via ObjectDescriptorReference", "direct reference with object syntax");
                this._parentReference = parentReference;
            } else {
                this._parent = parentReference;
            }

            this.customPrototype = this._getPropertyWithDefaults(deserializer, "customPrototype");
            //
            value = deserializer.getProperty("propertyDescriptors");
            if (value) {
                this._propertyDescriptors = value;
            }

            value = deserializer.getProperty("propertyDescriptorGroups");
            if (value) {
                this._propertyDescriptorGroups = value;
            }
            value = deserializer.getProperty("eventDescriptors");
            if (value) {
                this._eventDescriptors = value;
            }
            value = deserializer.getProperty("propertyValidationRules");
            if (value) {
                this._propertyValidationRules = value;
            }
            value = deserializer.getProperty("maxAge");
            if (value) {
                this.maxAge = value;
            }
        }
    },

    _setPropertyWithDefaults: {
        value:function (serializer, propertyName, value) {
            if (value !== Defaults[propertyName]) {
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
     * Create a new instance of the target prototype for the object descriptor.
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
     * Returns the target prototype for this object descriptor.
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
                throw new Error("Already has customPrototype");
                /*
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
                */
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
     * Return the object descriptor object property for this object descriptor.
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
     * object descriptors.
     */
    objectDescriptorInstanceModule: {
        serializable: false,
        value: null
    },

    /**
     * The identifier is the same as the name and is used to make the
     * serialization of a object descriptor humane.
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
     * ObjectDescriptor parent
     * @type {?ObjectDescriptor}
     */
    parent: {
        serializable: false,
        get: function () {
            return this._parent;
        },
        set: function (objectDescriptor) {
            this._parent = objectDescriptor;
        }
    },

    /**
     * Defines whether the object descriptor should use custom prototype for new
     * instances.
     *
     * Is `true` if the object descriptor needs to require a custom prototype for
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

    _handlePropertyDescriptorsRangeChange: {
        value: function (plus, minus, index) {
            var i, n;
            for (i = 0, n = minus.length; i < n; ++i) {
                minus[i]._owner = null;
            }

            for (i = 0, n = plus.length; i < n; ++i) {
                plus[i]._owner = plus[i]._owner || this;
            }

        }
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

    /**
     * Returns all property descriptors that have their serializable property true
     *
     * @method
     * @returns {Array.<PropertyDescriptor>} Arrat of relevant propertyDescriptors
     */

    serializablePropertyDescriptors: {
        get: function () {
            // TODO Add some caching and invalidation when this._propertyDescriptors or this.parent.propertyDescriptors
            // changes, using bindings might be best.
            return this.propertyDescriptors.filter(function(aPropertyDescriptor) {
                return aPropertyDescriptor.serializable !== false;
            });
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
     * @param {PropertyDescriptor} property descriptor to be added.
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
     * Return a new property descriptor.
     *
     * **Note:** This is the canonical way of creating new property descriptor
     * in order to enable subclassing.
     * @param {string} name name of the property descriptor to create
     * @param {number} cardinality name of the property descriptor to create
     * @returns {PropertyDescriptor}
     */
    newPropertyDescriptor: {
        value: function (name, cardinality) {
            return new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality(name, this, cardinality);
        }
    },

    /**
     * Convenience to add one property descriptor.
     * @function
     * @param {string} name Add to one property descriptor
     * @returns {PropertyDescriptor}
     */
    addToOnePropertyDescriptorNamed: {
        value: function (name) {
            return this.addPropertyDescriptor(this.newPropertyDescriptor(name, 1));
        }
    },

    /**
     * Convenience to add many property descriptor.
     * @function
     * @param {string} name Add to many property descriptor
     * @returns {PropertyDescriptor}
     */
    addToManyPropertyDescriptorNamed: {
        value: function (name) {
            return this.addPropertyDescriptor(this.newPropertyDescriptor(name, Infinity));
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
                propertyDescriptor = exports.UnknownPropertyDescriptor;
                var aPropertyDescriptor, index;
                for (index = 0; typeof (aPropertyDescriptor = this._propertyDescriptors[index]) !== "undefined"; index++) {
                    if (aPropertyDescriptor.name === name) {
                        propertyDescriptor = aPropertyDescriptor;
                        break;
                    }
                }
                this._propertyDescriptorsTable[name] = propertyDescriptor;
            }
            if (propertyDescriptor === exports.UnknownPropertyDescriptor) {
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
     * List of properties descriptor groups names
     * @returns {Array.<PropertyDescriptor>}
     */
    propertyDescriptorGroups: {
        get: function () {
            var groups = [],
                name;
            for (name in this._propertyDescriptorGroups) {
                if (this._propertyDescriptorGroups.hasOwnProperty(name)) {
                    groups.push(name);
                }
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
            if (!group && this.parent) {
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
            if (!group) {
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
     * @returns {Array.<PropertyDescriptor>} removed property descriptor group
     */
    removePropertyDescriptorGroupNamed: {
        value: function (groupName) {
            var group = this._propertyDescriptorGroups[groupName];
            if (!group) {
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
     * @returns {Array.<PropertyDescriptor>} property descriptor group
     */
    addPropertyDescriptorToGroupNamed: {
        value: function (propertyDescriptor, groupName) {
            var group = this._propertyDescriptorGroups[groupName],
                index;
            if (!group) {
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
     * Removes a property descriptor from the group name.
     * @function
     * @param {string} name of the property
     * @param {string} name of the group
     * @returns {Array.<PropertyDescriptor>} property descriptor group
     */
    removePropertyDescriptorFromGroupNamed: {
        value: function (propertyDescriptor, groupName) {
            var group = this._propertyDescriptorGroups[groupName];
            if (group && propertyDescriptor) {
                var index = group.indexOf(propertyDescriptor);
                if (index >= 0) {
                    group.splice(index, 1);
                }
            }
            return group || [];
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
            if (eventDescriptor && eventDescriptor.name) {
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
     * Removes an property descriptor from the property descriptor list of this
     * object descriptor.
     * @function
     * @param {Object} property descriptor The property descriptor to be removed.
     * @returns {PropertyDescriptor}
     */
    removeEventDescriptor: {
        value: function (eventDescriptor) {
            if (eventDescriptor && eventDescriptor.name) {
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
     * Convenience to add an event descriptor.
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
                eventDescriptor = exports.UnknownEventDescriptor;
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
            if (eventDescriptor === exports.UnknownEventDescriptor) {
                eventDescriptor = null;
            }

            if (!eventDescriptor && this.parent) {
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
            var propertyName,
                propertyValidationRules = [];
            for (propertyName in this._propertyValidationRules) {
                if (this._propertyValidationRules.hasOwnProperty(propertyName)) {
                    propertyValidationRules.push(this._propertyValidationRules[propertyName]);
                }
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
            if (!propertyValidationRule) {
                propertyValidationRule = new PropertyValidationRule().initWithNameAndObjectDescriptor(name, this);
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
            if (propertyValidationRule) {
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
            var name, rule,
                messages = [];

            for (name in this._propertyValidationRules) {
                if (this._propertyValidationRules.hasOwnProperty(name)) {
                    rule = this._propertyValidationRules[name];
                    if (rule.evaluateRule(objectInstance)) {
                        messages.push(rule.messageKey);
                    }
                }
            }
            return messages;
        }
    },

    objectDescriptorModuleId: require("../core")._objectDescriptorModuleIdDescriptor,
    objectDescriptor: require("../core")._objectDescriptorDescriptor,

    /**
     *  Specifies the maximum amount of time that the values of on object
     * described by an ObjectDescriptor will be considered fresh.
     *
     * Value is in seconds, default to 4 minutes
     *
     * @returns {number} this.maxAge
     */
    maxAge: {
        value: 240
    }

}, {

    /**
     * Creates a default object descriptor with all enumerable properties.
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
                return Promise.resolve(exports.UnknownObjectDescriptor);
            }
        }
    }
});

exports.UnknownObjectDescriptor = Object.freeze(new ObjectDescriptor().initWithName("Unknown"));
exports.UnknownPropertyDescriptor = Object.freeze(new PropertyDescriptor().initWithNameObjectDescriptorAndCardinality("Unknown", null, 1));
exports.UnknownEventDescriptor = Object.freeze(new EventDescriptor().initWithNameAndObjectDescriptor("Unknown", null));
