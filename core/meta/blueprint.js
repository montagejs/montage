"use strict";
/**
 @module montage/core/blueprint
 @requires montage/core/core
 @requires core/exception
 @requires core/promise
 @requires core/logger
 */
var Montage = require("montage").Montage;
var ObjectProperty = require("core/meta/object-property").ObjectProperty;
var Enum = require("core/enum").Enum;
var Promise = require("core/promise").Promise;
var Selector = require("core/selector").Selector;
var Semantics = require("core/selector/semantics").Semantics;
var Serializer = require("core/serializer").Serializer;
var Deserializer = require("core/deserializer").Deserializer;
var Exception = require("core/exception").Exception;
var logger = require("core/logger").logger("blueprint");

/**
 @private
 */
var _binderManager = null;
/**
 @class module:montage/core/blueprint.BlueprintBinderManager
 @classdesc A blueprint binder manager is a singleton that is responsible for loading and dispaching binders and blueprints.
 @extends module:montage/core/core.Montage
 */
var BlueprintBinderManager = exports.BlueprintBinderManager = Montage.create(Montage, /** @lends module:montage/core/blueprint.BlueprintBinderManager# */ {

    didCreate: {
        value: function() {
            this._blueprintBinders = [];
            this._blueprintBinderTable = {};
        }
    },

    /**
     @private
     */
    _blueprintBinders: {
        value: null
    },


    /**
     @private
     */
    _blueprintBinderTable: {
        value: null
    },

    /**
     Return the list of binder registered on the manager
     @type {Property} Function
     @default {Array} new Array()
     */
    blueprintBinders: {
        get: function() {
            return this._blueprintBinders;
        }
    },

    /**
     Add a new blueprint binder.
     @function
     @param {Property} binder TODO
     */
    addBlueprintBinder: {
        value: function(binder) {
            if (binder !== null) {
                if (this._blueprintBinderTable[binder.name]) {
                    this.removeBlueprintBinder(this._blueprintBinderTable[binder.name]);
                }
                var index = this._blueprintBinders.indexOf(binder);
                if (index >= 0) {
                    this._blueprintBinders.splice(index, 1);
                }
                this._blueprintBinders.push(binder);
                this._blueprintBinderTable[binder.name] = binder;
            }
        }
    },

    /**
     Description TODO
     @function
     @param {Property} binder TODO
     */
    removeBlueprintBinder: {
        value: function(binder) {
            if (binder !== null) {
                var index = this._blueprintBinders.indexOf(binder);
                if (index >= 0) {
                    this._blueprintBinders.splice(index, 1);
                }
                if (this._blueprintBinderTable[binder.name]) {
                    delete this._blueprintBinderTable[binder.name];
                }
            }
        }
    },

    /*
     * Returns the blueprint binder associated with the name
     */
    blueprintBinderForName: {
        value: function(name) {
            return this._blueprintBinderTable[name];
        }
    },

    /**
     Search through the binders for a blueprint that extends that prototype.
     @function
     @param {Property} prototypeName TODO
     @param {Property} moduleId TODO
     @returns The requested blueprint or null if this prototype is not managed.
     */
    blueprintForPrototype: {
        value: function(prototypeName, moduleId) {
            var binder, blueprint, index;
            for (index = 0; typeof (binder = this.blueprintBinders[index]) !== "undefined"; index++) {
                blueprint = binder.blueprintForPrototype(prototypeName, moduleId);
                if (blueprint !== null) {
                    return blueprint;
                }
            }
            return null;
        }
    },

    _defaultBlueprintObjectProperty: {
        serializable: true,
        value: null
    },

    /**
     * Return the default blueprint object property</br>
     * This is the last resort property declaration object.
     * @type {Property}
     * @returns {ObjectProperty} default blueprint object property
     */
    defaultBlueprintObjectProperty: {
        get: function() {
            if (!this._defaultBlueprintObjectProperty) {
                this._defaultBlueprintObjectProperty = ObjectProperty.create().init();
            }
            return this._defaultBlueprintObjectProperty;
        }
    },

    _defaultBinder: {
        serializable: true,
        value: null
    },

    /**
     * Return the default blueprint object property</br>
     * This is the last resort property declaration object.
     * @type {Property}
     * @returns {ObjectProperty} default blueprint object property
     */
    defaultBinder: {
        get: function() {
            if (!this._defaultBinder) {
                this._defaultBinder = BlueprintBinder.create().initWithName("default");
                this._defaultBinder.isDefault = true;
                this.addBlueprintBinder(this._defaultBinder);
            }
            return this._defaultBinder;
        }
    }

});

/**
 @class module:montage/core/blueprint.BlueprintBinder
 @classdesc A blueprint binder is a collection of of blueprints for a specific access type. It also includes the connection information.
 @extends module:montage/core/core.Montage
 */
var BlueprintBinder = exports.BlueprintBinder = Montage.create(Montage, /** @lends module:montage/core/blueprint.BlueprintBinder# */ {

    /**
      didCreate method
      @function
      @private
    */
    didCreate: {
        value: function() {
            this._name = null;
            this.binderModuleId = null;
            this.isDefault = false;
            /**
             Description TODO
             @type {Property}
             @default {Array} new Array(30)
             */
            Montage.defineProperty(this, "_blueprintForPrototypeTable", {
                writable: false,
                value: {}
            });

            Montage.defineProperty(this, "blueprints", {
                /*We deal with serialization manually since the property is not writable*/
                serializable:false,
                writable: false,
                value: []
            });
            return this;
        }
    },

    /**
     Description TODO
     @function
     @param {String} name TODO
     @returns itself
     */
    initWithName: {
        value: function(name) {
            // match null or undefined
            this._name = (name != null ? name : "default");
            BlueprintBinder.manager.addBlueprintBinder(this);
            return this;
        }
    },

    serializeSelf: {
        value: function(serializer) {
            serializer.setProperty("name", this.name);
            serializer.setProperty("blueprints", this.blueprints);
            serializer.setProperties();
        }
    },

    deserializeSelf: {
        value: function(deserializer) {
            this._name = deserializer.getProperty("name");
            //copy contents into the blueprints array
            this.blueprints.push.apply(this.blueprints, deserializer.getProperty("blueprints"));
            // FIXME [PJYF Jan 8 2013] There is an API issue in the deserialization
            // We should be able to write deserializer.getProperties sight!!!
            var propertyNames = Montage.getSerializablePropertyNames(this);
            for (var i = 0, l = propertyNames.length; i < l; i++) {
                var propertyName = propertyNames[i];
                this[propertyName] = deserializer.getProperty(propertyName);
            }
        }
    },

    /**
     @private
     */
    _name: {
        value: null
    },

    /**
     Name of the object. The name is used to define the property on the object.
     @function
     @returns {String} this._name
     */
    name: {
        get: function() {
            return this._name;
        }
    },

    /**
     Returns the blueprint binder manager.
     @type {Property}
     @returns Blueprint Binder Manager
     */
    manager: {
        get: function() {
            if (_binderManager === null) {
                _binderManager = BlueprintBinderManager.create();
            }
            return _binderManager;
        }
    },

    /**
     Description TODO
     @private
     */
    _blueprintForPrototypeTable: {
        value: null
    },

    /**
     The identifier is the name of the binder and is used to make the serialization of binders more
     readable.
     @type {Property}
     @default {String} this.name
     */
    identifier: {
        get: function() {
            return [
                "binder",
                this.name.toLowerCase()
            ].join("_");
        }
    },

    /*
     * This is used for references only so that we can reload referenced binders
     */
    binderModuleId: {
        value: null
    },

    /*
    * Identify the default binder. Do not set.
     */
    isDefault: {
        serializable: false,
        value: false
    },

    /**
     Gets a binder from a serialized file at the given module id.
     @function
     @param {String} binder module id
     @param {Function} require function
     */
    getBinderWithModuleId: {
        value: function(binderModuleId, targetRequire) {
            var deferredBinder = Promise.defer();
            if (!targetRequire) {
                // This is probably wrong but at least we will try
                targetRequire = this.require;
            }

            targetRequire.async(binderModuleId).then(function(object) {
                try {
                    Deserializer.create().initWithObjectAndRequire(object, targetRequire, binderModuleId).deserializeObject(function(binder) {
                        if (binder) {
                            binder.binderModuleId = binderModuleId;
                            BlueprintBinder.manager.addBlueprintBinder(this);
                            deferredBinder.resolve(binder);
                        } else {
                            deferredBinder.reject("No Binder found " + binderModuleId);
                        }
                    }, targetRequire);
                } catch (exception) {
                    deferredBinder.reject("Error deserializing Binder " + binderModuleId + " " + JSON.stringfy(exception));
                }
            }, deferredBinder.reject);

            return deferredBinder.promise;
        }
    },


    /**
     Description TODO
     @function
     @param {Array} blueprint TODO
     @returns blueprint
     */
    addBlueprint: {
        value: function(blueprint) {
            if (blueprint !== null) {
                var index = this.blueprints.indexOf(blueprint);
                if (index < 0) {
                    if ((blueprint.binder !== null) && (blueprint.binder !== this)) {
                        blueprint.binder.removeBlueprint(blueprint);
                    }
                    this.blueprints.push(blueprint);
                    blueprint.binder = this;
                    //
                    var key = blueprint.moduleId + "." + blueprint.prototypeName;
                    this._blueprintForPrototypeTable[key] = blueprint;
                }
            }
            return blueprint;
        }
    },

    /**
     Description TODO
     @function
     @param {Array} blueprint TODO
     @returns blueprint
     */
    removeBlueprint: {
        value: function(blueprint) {
            if (blueprint !== null) {
                var index = this.blueprints.indexOf(blueprint);
                if (index >= 0) {
                    this.blueprints.splice(index, 1);
                    blueprint.binder = null;
                    // Remove the cached entry
                    var key = blueprint.moduleId + "." + blueprint.prototypeName;
                    delete this._blueprintForPrototypeTable[key];
                }
            }
            return blueprint;
        }
    },

    /**
     Description TODO
     @function
     @param {String} name TODO
     @param {String} moduleID TODO
     @returns this.addBlueprint(this.createBlueprint().initWithNameAndModuleId(name, moduleId))
     */
    addBlueprintNamed: {
        value: function(name, moduleId) {
            return this.addBlueprint(Blueprint.create().initWithNameAndModuleId(name, moduleId));
        }
    },


    /**
     Return the blueprint associated with this prototype.
     @function
     @param {String} prototypeName TODO
     @param {ID} moduleId TODO
     @returns blueprint
     */
    blueprintForPrototype: {
        value: function(prototypeName, moduleId) {
            var key = moduleId + "." + prototypeName;
            var blueprint = this._blueprintForPrototypeTable[key];
            if (typeof blueprint === "undefined") {
                var aBlueprint, index;
                for (index = 0; typeof (aBlueprint = this.blueprints[index]) !== "undefined"; index++) {
                    if ((aBlueprint.prototypeName === prototypeName) && (aBlueprint.moduleId === moduleId)) {
                        blueprint = aBlueprint;
                        break;
                    }
                }
                this._blueprintForPrototypeTable[key] = blueprint;
            }
            return blueprint;
        }
    },

    _blueprintObjectProperty: {
        value: null
    },

    /**
     * Return the blueprint object property for this binder</br>
     * This will return the default if none is declared.
     * @type {Property}
     * @returns {ObjectProperty} default blueprint object property
     */
    ObjectProperty: {
        get: function() {
            if (!this._blueprintObjectProperty) {
                this._blueprintObjectProperty = BlueprintBinder.manager.defaultBlueprintObjectProperty;
            }
            return this._blueprintObjectProperty;
        }
    }

});

/**
 @class module:montage/core/bluprint.Blueprint
 */
var Blueprint = exports.Blueprint = Montage.create(Montage, /** @lends module:montage/core/bluprint.Blueprint# */ {

    /**
     Description TODO
     @function
     @param {String} name TODO
     @returns this.initWithNameAndModuleId(name, null)
     */
    initWithName: {
        value: function(name) {
            return this.initWithNameAndModuleId(name, null);
        }
    },

    /**
     Description TODO
     @function
     @param {String} name TODO
     @param {String} moduleId TODO
     @returns itself
     */
    initWithNameAndModuleId: {
        value: function(name, moduleId) {
            this._name = (name !== null ? name : "default");
            // The default is that the prototype name is the name
            this.prototypeName = this.name;
            this.moduleId = moduleId;
            this.customPrototype = false;
            return this;
        }
    },

    serializeSelf: {
        value: function(serializer) {
            serializer.setProperty("name", this.name);
            if ((this._binder) && (! this.binder.isDefault)) {
                serializer.setProperty("binder", this._binder, "reference");
            }
            serializer.setProperties();
            if (this._parentReference) {
                serializer.setProperty("parent", this._parentReference);
            }
            serializer.setProperty("propertyBlueprints", this._propertyBlueprints);
            serializer.setProperty("propertyBlueprintGroups", this._propertyBlueprintGroups);
            serializer.setProperty("propertyValidationRules", this._propertyValidationRules);
        }
    },

    deserializeSelf: {
        value: function(deserializer) {
            this._name = deserializer.getProperty("name");
            var binder = deserializer.getProperty("binder");
            if (binder) {
                this._binder = binder;
            }
            this._parentReference = deserializer.getProperty("parent");
            this._propertyBlueprints = deserializer.getProperty("propertyBlueprints");
            this._propertyBlueprintGroups = deserializer.getProperty("propertyBlueprintGroups");
            this._propertyValidationRules = deserializer.getProperty("propertyValidationRules");
            // FIXME [PJYF Jan 8 2013] There is an API issue in the deserialization
            // We should be able to write deserializer.getProperties sight!!!
            var propertyNames = Montage.getSerializablePropertyNames(this);
            for (var i = 0, l = propertyNames.length; i < l; i++) {
                var propertyName = propertyNames[i];
                this[propertyName] = deserializer.getProperty(propertyName);
            }
        }
    },

    /**
     @private
     */
    _name: {
        value: null
    },

    /**
     Name of the object. The name is used to define the property on the object.
     @function
     @returns {String} this._name
     */
    name: {
        get: function() {
            return this._name;
        }
    },

    /**
     This is the canonical way of creating managed objects prototypes.<br>
     Newly created prototype will be blessed with all the required properties to be well behaved.
     @function
     @param {Object} aPrototype TODO
     @param {String} propertyDescriptor TODO
     @returns newPrototype
     */
    create: {
        value: function(aPrototype, propertyDescriptor) {
            if ((typeof aPrototype === "undefined") || (Blueprint.isPrototypeOf(aPrototype))) {
                var parentCreate = Object.getPrototypeOf(Blueprint).create;
                return parentCreate.call(this, (typeof aPrototype === "undefined" ? this : aPrototype), propertyDescriptor);
            }
            var newPrototype = Montage.create(aPrototype, propertyDescriptor);
            this.ObjectProperty.applyWithBlueprint(newPrototype, this);
            // We have just created a custom prototype lets use it.
            this.customPrototype = true;
            return newPrototype;
        }
    },

    /**
     Create a new instance of the target prototype for the blueprint.
     @function
     @return new instance
     */
    newInstance: {
        value: function() {
            var prototype = this.newInstancePrototype();
            return (prototype ? prototype.create() : null);
        }
    },

    /**
     Returns the target prototype for this blueprint.<br>
     <b>Note: </b> This method uses the <code>customPrototype</code> property to determine if it needs to require a custom prototype or create a default prototype.
     @function
     @return new prototype
     */
    newInstancePrototype: {
        value: function() {
            var self = this;
            if (this.customPrototype) {
                var results = Promise.defer();
                require.async(this.moduleId,
                    function(exports) {
                        results.resolve(exports);
                    });
                return results.promise.then(function(exports) {
                        var prototype = exports[self.prototypeName];
                        return (prototype ? prototype : null);
                    }
                );
            } else {
                if (typeof exports[self.prototypeName] === "undefined") {
                    var parentInstancePrototype = (this.parent ? this.parent.newInstancePrototype() : Montage );
                    var newPrototype = Montage.create(parentInstancePrototype, {
                        // Token class
                        init: {
                            value: function() {
                                return this;
                            }
                        }
                    });
                    this.ObjectProperty.applyWithBlueprint(newPrototype, this);
                    exports[self.prototypeName] = newPrototype;
                }
                var prototype = exports[self.prototypeName];
                return (prototype ? prototype : null);
            }
        }
    },


    /**
     * Return the blueprint object property for this blueprint</br>
     * This will return the default if none is declared.
     * @type {Property}
     * @returns {ObjectProperty} default blueprint object property
     */
    ObjectProperty: {
        serializable: false,
        enumerable: true,
        get: function() {
            if (this.binder) {
                return this.binder.ObjectProperty;
            }
            return BlueprintBinder.manager.defaultBlueprintObjectProperty;
        }
    },

    /*
     * This is used for references only so that we can reload referenced blueprints
     */
    blueprintModuleId: {
        value: null
    },

    /**
     Gets a blueprint from a serialized file at the given module id.
     @function
     @param {String} blueprint module id
     @param {Function} require function
     */
    getBlueprintWithModuleId: {
        value: function(blueprintModuleId, require) {
            var deferredBlueprint = Promise.defer();
            var targetRequire = require;
            if (!targetRequire) {
                // This is probably wrong but at least we will try
                targetRequire = this.require;
            }

            targetRequire.async(blueprintModuleId).then(function(object) {
                try {
                    Deserializer.create().initWithObjectAndRequire(object, targetRequire, blueprintModuleId).deserializeObject(function(blueprint) {
                        if (blueprint) {
                            var binder = (blueprint._binder ? blueprint._binder : BlueprintBinder.manager.defaultBinder); // We do not want to trigger the auto registration
                            var existingBlueprint = binder.blueprintForPrototype(blueprint.prototypeName, blueprint.moduleId);
                            if (existingBlueprint) {
                                deferredBlueprint.resolve(existingBlueprint);
                            } else {
                                binder.addBlueprint(blueprint);
                                blueprint.blueprintModuleId = blueprintModuleId;
                                if (blueprint._parentReference) {
                                    // We need to grab the parent before we return or most operation will fail
                                    blueprint._parentReference.promise(targetRequire).then(function(parentBlueprint) {
                                            blueprint._parent = parentBlueprint;
                                            deferredBlueprint.resolve(blueprint);
                                        }
                                    );
                                } else {
                                    deferredBlueprint.resolve(blueprint);
                                }
                            }
                        } else {
                            deferredBlueprint.reject(new Error("No Blueprint found " + blueprintModuleId));
                        }
                    }, targetRequire);
                } catch (exception) {
                    deferredBlueprint.reject(new Error("Error deserializing Blueprint " + blueprintModuleId + " " + JSON.stringfy(exception)));
                }
            }, deferredBlueprint.reject);

            return deferredBlueprint.promise;
        }
    },

    /*
     * Creates a default blueprint with all enumerable properties.
     * <b>Note</b>Value type are set to the string default.
     */
    createDefaultBlueprintForObject: {
        value: function(object) {
            if (object) {
                var newBlueprint = Blueprint.create().initWithName(object.identifier);
                for (var name in object) {
                    if (name.charAt(0) !== "_") {
                        // We don't want to list private properties
                        var value = object.name;
                        var propertyBlueprint;
                        if (Array.isArray(value)) {
                            propertyBlueprint = newBlueprint.addToManyPropertyBlueprintNamed(name);
                        } else {
                            propertyBlueprint = newBlueprint.addToOnePropertyBlueprintNamed(name);
                        }
                    }
                }
                return newBlueprint;
            } else {
                return UnknownBlueprint;
            }
        }
    },

    /**
     The identifier is the same as the name and is used to make the
     serialization of a blueprint humane.
     @type {Property}
     @default {String} this.name
     */
    identifier: {
        get: function() {
            // TODO convert UpperCase to lower-case instead of lowercase
            return [
                "blueprint",
                this.name.toLowerCase()
            ].join("_");
        }
    },

    /*
    * @private
     */
    _binder: {
        value: null
    },

    /**
     Description TODO
     @type {Property}
     @default null
     */
    binder: {
        serializable: false,
        get: function() {
            if (! this._binder) {
                this._binder = BlueprintBinder.manager.defaultBinder;
                this._binder.addBlueprint(this);
            }
            return this._binder;
        },
        set: function(value) {
            this._binder = value;
        }
    },

    /*
     @private
     */
    _parentReference: {
        value: null
    },

    /*
     @private
     */
    _parent: {
        value: null
    },

    /**
     Blueprint parent<br/>
     @type {Property}
     @default {Object} null
     */
    parent: {
        serializable: false,
        get: function() {
            return this._parent;
        },
        set: function(blueprint) {
            if (blueprint) {
                this._parentReference = BlueprintReference.create().initWithValue(blueprint);
                this._parent = blueprint;
            } else {
                this._parentReference = null;
                this._parent = null;
            }
        }
    },

    /**
     Description TODO
     @type {Property}
     @default null
     */
    moduleId: {
        value: ""
    },

    /**
     Description TODO
     @type {Property}
     @default null
     */
    prototypeName: {
        value: null
    },

    /**
     Defines if the blueprint should use custom prototype for new instances.<br>
     Returns <code>true</code> if the blueprint needs to require a custom prototype for creating new instances, <code>false</code> if new instance are generic prototypes.
     @type {Boolean}
     @default false
     */
    customPrototype: {
        value: false
    },

    /**
     Description TODO
     @type {Property}
     @default {Array} new Array()
     */
    _propertyBlueprints: {
        value: [],
        distinct: true
    },

    /**
     Description TODO
     @type {Property}
     @default {Array} new Array()
     */
    propertyBlueprints: {
        get: function() {
            var propertyBlueprints = [];
            propertyBlueprints = propertyBlueprints.concat(this._propertyBlueprints);
            if (this.parent) {
                propertyBlueprints = propertyBlueprints.concat(this.parent.propertyBlueprints);
            }
            return propertyBlueprints;
        }
    },

    /**
     Description TODO
     @private
     */
    _propertyBlueprintsTable: {
        value: {},
        distinct: true,
        writable: false
    },

    /**
     Add a new property blueprint to this blueprint.<br>
     If that property blueprint was associated with another blueprint it will be removed first.
     @function
     @param {String} property blueprint The property blueprint to be added.
     @returns property blueprint
     */
    addPropertyBlueprint: {
        value: function(propertyBlueprint) {
            if (propertyBlueprint !== null && propertyBlueprint.name !== null) {
                var index = this._propertyBlueprints.indexOf(propertyBlueprint);
                if (index < 0) {
                    if ((propertyBlueprint.blueprint !== null) && (propertyBlueprint.blueprint !== this)) {
                        propertyBlueprint.blueprint.removePropertyBlueprint(propertyBlueprint);
                    }
                    this._propertyBlueprints.push(propertyBlueprint);
                    this._propertyBlueprintsTable[propertyBlueprint.name] = propertyBlueprint;
                    propertyBlueprint._blueprint = this;
                }
            }
            return propertyBlueprint;
        }
    },

    /**
     Removes an property blueprint from the property blueprint list of this blueprint.
     @function
     @param {Object} property blueprint The property blueprint to be removed.
     @returns property blueprint
     */
    removePropertyBlueprint: {
        value: function(propertyBlueprint) {
            if (propertyBlueprint !== null && propertyBlueprint.name !== null) {
                var index = this._propertyBlueprints.indexOf(propertyBlueprint);
                if (index >= 0) {
                    this._propertyBlueprints.splice(index, 1);
                    delete this._propertyBlueprintsTable[propertyBlueprint.name];
                    propertyBlueprint._blueprint = null;
                }
            }
            return propertyBlueprint;
        }
    },

    /**
     * Return a new property blueprint.<br/>
     * <b>Note: </b> This is the canonical way of creating new property blueprint in order to enable subclassing.
     * @param {String} name name of the property blueprint to create
     * @param {Number} cardinality name of the property blueprint to create
     */
    newPropertyBlueprint: {
        value: function(name, cardinality) {
            return PropertyBlueprint.create().initWithNameBlueprintAndCardinality(name, this, cardinality);
        }
    },

    /**
     * Return a new association blueprint.<br/>
     * <b>Note: </b> This is the canonical way of creating new association blueprint in order to enable subclassing.
     * @param {String} name name of the association blueprint to create
     * @param {Number} cardinality name of the association blueprint to create
     */
    newAssociationBlueprint: {
        value: function(name, cardinality) {
            return AssociationBlueprint.create().initWithNameBlueprintAndCardinality(name, this, cardinality);
        }
    },

    /**
     * Return a new derived property blueprint.<br/>
     * <b>Note: </b> This is the canonical way of creating new derived property blueprint in order to enable subclassing.
     * @param {String} name name of the derived property blueprint to create
     * @param {Number} cardinality name of the derived property blueprint to create
     */
    newDerivedPropertyBlueprint: {
        value: function(name, cardinality) {
            return DerivedPropertyBlueprint.create().initWithNameBlueprintAndCardinality(name, this, cardinality);
        }
    },

    /**
     Convenience to add one property blueprint.
     @function
     @param {String} name Add to one property blueprint
     @returns name
     */
    addToOnePropertyBlueprintNamed: {
        value: function(name) {
            return this.addPropertyBlueprint(this.newPropertyBlueprint(name, 1));
        }
    },

    /**
     Convenience to add many property blueprints.
     @function
     @param {String} name Add to many property blueprints
     @returns names
     */
    addToManyPropertyBlueprintNamed: {
        value: function(name) {
            return this.addPropertyBlueprint(this.newPropertyBlueprint(name, Infinity));
        }
    },

    /**
     Convenience to add an property blueprint to one relationship.
     @function
     @param {String} name TODO
     @param {String} inverse TODO
     @returns relationship
     */
    addToOneAssociationBlueprintNamed: {
        value: function(name, inverse) {
            var relationship = this.addPropertyBlueprint(this.newAssociationBlueprint(name, 1));
            if (inverse) {
                relationship.targetBlueprint = inverse.blueprint;
                inverse.targetBlueprint = this;
            }
            return relationship;
        }
    },

    /**
     Convenience to add an property blueprint to many relationships.
     @function
     @param {String} name TODO
     @param {String} inverse TODO
     @returns relationship
     */
    addToManyAssociationBlueprintNamed: {
        value: function(name, inverse) {
            var relationship = this.addPropertyBlueprint(this.newAssociationBlueprint(name, Infinity));
            if (inverse) {
                relationship.targetBlueprint = inverse.blueprint;
                inverse.targetBlueprint = this;
            }
            return relationship;
        }
    },

    /**
     Description TODO
     @function
     @param {String} name TODO
     @returns property blueprint
     */
    propertyBlueprintForName: {
        value: function(name) {
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

    /*
     * @private
     */
    _propertyBlueprintGroups: {
        distinct: true,
        value: {}
    },

    /*
     * List of properties blueprint groups names
     */
    propertyBlueprintGroups: {
        get: function() {
            var groups = [];
            for (var name in this._propertyBlueprintGroups) {
                groups.push(name);
            }
            return groups;
        }
    },

    /*
     * Returns the group associated with that name
     * @param {String} name of the group
     * @returns {array} property blueprint group
     */
    propertyBlueprintGroupForName: {
        value: function(groupName) {
            var group = this._propertyBlueprintGroups[groupName];
            if ((! group) && (this.parent)) {
                group = this.parent.propertyBlueprintGroupForName(groupName);
            }
            return (group != null ? group : []);
        }
    },

    /*
     * Add a new property blueprint group.
     * @function
     * @param {String} name of the group
     * @returns {array} new property blueprint group
     */
    addPropertyBlueprintGroupNamed: {
        value: function(groupName) {
            var group = this._propertyBlueprintGroups[groupName];
            if (group == null) {
                group = [];
                this._propertyBlueprintGroups[groupName] = group;
            }
            return group;
        }
    },

    /*
     * Remove the property blueprint group.
     * @function
     * @param {String} name of the group to remove
     * @returns {array} removed property blueprint group
     */
    removePropertyBlueprintGroupNamed: {
        value: function(groupName) {
            var group = this._propertyBlueprintGroups[groupName];
            if (group != null) {
                delete this._propertyBlueprintGroups[groupName];
            }
            return group;
        }
    },

    /*
     * Adds a property blueprint to the group name.<br/>
     * if the group does not exist creates it.
     * @function
     * @param {String} property to add
     * @param {String} name of the group
     * @returns {array} property blueprint group
     */
    addPropertyBlueprintToGroupNamed: {
        value: function(propertyBlueprint, groupName) {
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

    /*
     * Removes a property blueprint from the group name.<br/>
     * @function
     * @param {String} name of the property
     * @param {String} name of the group
     * @returns {array} property blueprint group
     */
    removePropertyBlueprintFromGroupNamed: {
        value: function(propertyBlueprint, groupName) {
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
     * @private
     */
    _propertyValidationRules: {
        value: {}
    },

    /*
     * Gets the list of properties validation rules
     * @return {Array} copy of the list of properties validation rules
     */
    propertyValidationRules: {
        get: function() {
            var propertyValidationRules = [];
            for (var name in this._propertyValidationRules) {
                propertyValidationRules.push(this._propertyValidationRules[name]);
            }
            return propertyValidationRules;
        }
    },

    /*
     * Returns the properties validation rule for that name
     * @param {String} name of the rule
     * @returns {PropertyDescription} property description
     */
    propertyValidationRuleForName: {
        value: function(name) {
            return this._propertyValidationRules[name];
        }
    },

    /*
     * Add a new properties validation rule .
     * @function
     * @param {String} name of the rule
     * @returns {PropertyDescription} new properties validation rule
     */
    addPropertyValidationRule: {
        value: function(name) {
            var propertyValidationRule = this._propertyValidationRules[name];
            if (propertyValidationRule == null) {
                propertyValidationRule = PropertyValidationRule.create().initWithNameAndBlueprint(name, this);
                this._propertyValidationRules[name] = propertyValidationRule;
            }
            return propertyValidationRule;
        }
    },

    /*
     * Remove the properties validation rule  for the name.
     * @function
     * @param {String} name of the rule
     * @returns {PropertyDescription} removed properties validation rule
     */
    removePropertyValidationRule: {
        value: function(name) {
            var propertyValidationRule = this._propertyValidationRules[name];
            if (propertyValidationRule != null) {
                delete this._propertyValidationRules[name];
            }
            return propertyValidationRule;
        }
    },

    /*
     * Evaluates the rules based on the object and the properties.<br/>
     * @param {Object} object instance to evaluate the rule for
     * @return {Array} list of message key for rule that fired. Empty array otherwise.
     */
    evaluateRules: {
        value: function(objectInstance) {
            var messages = [];
            for (var name in this._propertyValidationRules) {
                var rule = this._propertyValidationRules[name];
                if (rule.evaluateRule(objectInstance)) {
                    messages.push(rule.messageKey);
                }
            }
            return messages;
        }
    }

});
var UnknownBlueprint = Object.freeze(Blueprint.create().initWithName("Unknown"));

var ValueType = Enum.create().initWithMembers("string", "number", "boolean", "date", "enum", "set", "list", "map", "url", "object");
/**
 @class module:montage/core/blueprint.PropertyBlueprint
 */
var PropertyBlueprint = exports.PropertyBlueprint = Montage.create(Montage, /** @lends module:montage/core/blueprint.PropertyBlueprint# */ {

    /**
     Initialize a newly allocated property blueprint.
     @function
     @param {String} name name of the property blueprint to create
     @param {Blueprint} blueprint
     @param {Number} cardinality name of the property blueprint to create
     @returns itself
     */
    initWithNameBlueprintAndCardinality: {
        value: function(name, blueprint, cardinality) {
            this._name = (name !== null ? name : "default");
            this._blueprint = blueprint;
            this._cardinality = (cardinality > 0 ? cardinality : 1);
            return this;
        }
    },

    serializeSelf: {
        value: function(serializer) {
            serializer.setProperty("name", this.name);
            serializer.setProperty("blueprint", this.blueprint, "reference");
            if (this.cardinality === Infinity) {
                serializer.setProperty("cardinality", -1);
            } else {
                serializer.setProperty("cardinality", this.cardinality);
            }
            serializer.setProperties();
        }
    },

    deserializeSelf: {
        value: function(deserializer) {
            this._name = deserializer.getProperty("name");
            this._blueprint = deserializer.getProperty("blueprint");
            var cardinality = deserializer.getProperty("cardinality");
            if (cardinality === -1) {
                this._cardinality = Infinity;
            } else {
                this._cardinality = cardinality;
            }
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
    _blueprint: {
        value: null
    },

    /*
     * Component description attached to this property blueprint.
     */
    blueprint: {
        get: function() {
            return this._blueprint;
        }
    },

    /**
     @private
     */
    _name: {
        value: null
    },

    /**
     Name of the object. The name is used to define the property on the object.
     @function
     @returns {String} this._name
     */
    name: {
        serializable: false,
        get: function() {
            return this._name;
        }
    },

    /**
     The identifier is the name of the blueprint, dot, the name of the
     property blueprint, and is used to make the serialization of property blueprints more
     readable.
     @type {Property}
     @default {String} this.name
     */
    identifier: {
        get: function() {
            return [
                this.blueprint.identifier,
                this.name
            ].join("_");
        }
    },

    /**
     Description TODO
     @private
     */
    _cardinality: {
        value: 1
    },

    /**
     Cardinality of the property blueprint.<br/>
     The Cardinality of an property blueprint is the number of values that can be stored.
     A cardinality of one means that only one object can be stored. Only positive values are legal. A value of infinity means that any number of values can be stored.
     @type {Property}
     @default {Number} 1
     */
    cardinality: {
        get: function() {
            return this._cardinality;
        }
    },

    /**
     Description TODO
     @type {Property}
     @default {Boolean} false
     */
    mandatory: {
        value: false
    },

    /**
     Description TODO
     @type {Property}
     @default {Boolean} false
     */
    denyDelete: {
        value: false
    },

    /**
     Description TODO
     @type {Property}
     @default {Boolean} false
     */
    readOnly: {
        value: false
    },

    /**
     Description TODO
     @type {Property}
     @default {Boolean} false
     */
    isAssociationBlueprint: {
        get: function() {
            return false;
        }
    },

    /**
     Description TODO
     @type {Property}
     @default {Boolean} false
     */
    isToMany: {
        get: function() {
            return this.cardinality > 1;
        }
    },

    /**
     Description TODO
     @type {Property}
     @default {Boolean} false
     */
    isDerived: {
        get: function() {
            return false;
        }
    },

    /**
     Description TODO
     @type {Property}
     @default {String} "string"
     */
    valueType: {
        value: "string"
    },

    /**
     Description TODO
     @type {Property}
     @default {Object} null
     */
    valueObjectPrototypeName: {
        value: null
    },

    /**
     Description TODO
     @type {Property}
     @default {Object} null
     */
    valueObjectModuleId: {
        value: null
    },

    _enumValues: {
        value: null
    },

    /**
     * List of values for enumerated value types
     * @type {Property}
     * @default {Object} null
     */
    enumValues: {
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

    helpKey: {
        value: ""
    }

});
var UnknownPropertyBlueprint = Object.freeze(PropertyBlueprint.create().initWithNameBlueprintAndCardinality("Unknown", null, 1));
/**
 @class module:montage/core/blueprint.AssociationBlueprint
 */
var AssociationBlueprint = exports.AssociationBlueprint = Montage.create(PropertyBlueprint, /** @lends module:montage/core/blueprint.AssociationBlueprint# */ {

    serializeSelf: {
        value: function(serializer) {
            serializer.setProperty("targetBlueprint", this._targetBlueprintReference);
            var parentCall = Object.getPrototypeOf(AssociationBlueprint).serializeSelf;
            parentCall.call(this, serializer);
        }
    },

    deserializeSelf: {
        value: function(deserializer) {
            var parentCall = Object.getPrototypeOf(AssociationBlueprint).deserializeSelf;
            parentCall.call(this, deserializer);
            this._targetBlueprintReference = deserializer.getProperty("targetBlueprint");
        }
    },

    /*
     @private
     */
    _targetBlueprintReference: {
        value: null
    },

    /**
     Promise for the blueprint targeted by this association<br/>
     <b>Note</b> The setter expects an actual blueprint but the getter will return a promise
     @type {Property}
     @default {Object} null
     */
    targetBlueprint: {
        serializable: false,
        get: function() {
            return this._targetBlueprintReference.promise(this.require);
        },
        set: function(blueprint) {
            this._targetBlueprintReference = BlueprintReference.create().initWithValue(blueprint);
        }
    },

    /**
     Description TODO
     @type {Property}
     @default {Boolean} false
     */
    isAssociationBlueprint: {
        get: function() {
            return true;
        }
    }

});

/**
 A derived is property blueprint is calculated using other property blueprints of the object.<br/>

 @class module:montage/core/blueprint.DerivedPropertyBlueprint
 */
var DerivedPropertyBlueprint = exports.DerivedPropertyBlueprint = Montage.create(PropertyBlueprint, /** @lends module:montage/core/blueprint.DerivedPropertyBlueprint# */ {
    /**
     Description TODO
     @type {Property}
     @default {Boolean} true
     */
    isDerived: {
        get: function() {
            return true;
        },
        serializable: false
    },

    /**
     List of property blueprints this derived property blueprint depends on.
     @type {Property}
     @default {Array} []
     */
    dependencies: {
        value: [],
        serializable: true
    },
    /**
     Description TODO
     @type {Property}
     @default null
     */
    getterDefinition: {
        value: null,
        serializable: true
    },

    /**
     Description TODO
     @type {Property}
     @default null
     */
    setterDefinition: {
        value: null,
        serializable: true
    }

});


/**
 @class module:montage/core/blueprint.PropertyValidationRule
 @extends module:montage/core/core.Montage
 */
var PropertyValidationRule = exports.PropertyValidationRule = Montage.create(Montage, /** @lends module:montage/core/blueprint.PropertyValidationRule# */ {

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
            this._blueprint = blueprint;
            return this;
        }
    },

    serializeSelf: {
        value: function(serializer) {
            serializer.setProperty("name", this.name);
            serializer.setProperty("blueprint", this.blueprint, "reference");
            //            serializer.setProperty("validationSelector", this._validationSelector, "reference");
            serializer.setProperty("messageKey", this.messageKey);
            serializer.setProperties();
        }
    },

    deserializeSelf: {
        value: function(deserializer) {
            this._name = deserializer.getProperty("name");
            this._blueprint = deserializer.getProperty("blueprint");
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
    _blueprint: {
        value: null
    },

    /*
     * Component description attached to this validation rule.
     */
    blueprint: {
        get: function() {
            return this._blueprint;
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
    }

});

/**
 @class module:montage/core/blueprint.PropertyValidationSemantics
 @extends module:montage/core/selector/semantics.Semantics
 */
var PropertyValidationSemantics = exports.PropertyValidationSemantics = Semantics.create(Semantics, /** @lends module:montage/core/blueprint.PropertyValidationSemantics# */ {

    /**
     Create a new semantic evaluator with the blueprint.
     @function
     @param {Blueprint} blueprint
     @returns itself
     */
    initWithBlueprint: {
        value: function(blueprint) {
            this._blueprint = blueprint;
            return this;
        }
    },

    /*
     * @private
     */
    _blueprint: {
        value: null
    },

    /*
     * Component description attached to this validation rule.
     */
    blueprint: {
        get: function() {
            return this._blueprint;
        }
    },

    /**
     * Compile the syntax tree into a function that can be used for evaluating this selector.
     * @function
     * @param {Selector} selector syntax
     * @returns function
     */
    compile: {
        value: function(syntax, parents) {
            Semantics.compile.call(this, syntax, parents);
        }
    },

    operators: {
        value: {
            isBound: function(a) {
                return !a;
            }
        }
    },

    evaluators: {
        value: {
            isBound: function(collection, modify) {
                var self = this;
                return function(value, parameters) {
                    value = self.count(collection(value, parameters));
                    return modify(value, parameters);
                };
            }
        }
    }

});

for (var operator in Semantics.operators) {
    PropertyValidationSemantics.operators[operator] = Semantics.operators[operator];
}

for (var evaluator in Semantics.evaluators) {
    PropertyValidationSemantics.evaluators[evaluator] = Semantics.evaluators[evaluator];
}

var RemoteReference = exports.RemoteReference = Montage.create(Montage, {

    /**
      didCreate method
      @function
      @private
    */
    didCreate: {
        value: function() {
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

    /*
     * @private
     */
    _value: {
        value: null
    },

    /*
     * @private
     */
    _reference: {
        value: null
    },

    /*
     * @private
     */
    _promise: {
        value: null
    },

    promise: {
        value: function(require) {
            if (!this._promise) {
                if (this._value) {
                    this._promise = Promise.resolve(this._value);
                } else {
                    this._promise = this.valueFromReference(this._reference, require);
                }
            }
            return this._promise;
        }
    },

    /*
     * Takes the serialized reference and return a promise for the value.<br/>
     * The default implementation does nothing and must be overwritten by subcallsses
     */
    valueFromReference: {
        value: function(reference, require) {
            return Promise.resolve(null);
        }
    },

    /*
     * Take the value and creates a reference string for serialization.<br/>
     * The default implementation does nothing and must be overwritten by subcallsses
     */
    referenceFromValue: {
        value: function(value) {
            return {};
        }
    }

});

var BlueprintReference = exports.BlueprintReference = RemoteReference.create(RemoteReference, {

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
                "blueprint",
                this._reference.blueprintName.toLowerCase(),
                "reference"
            ].join("_");
        }
    },

    valueFromReference: {
        value: function(references, require) {
            var blueprintName = references.blueprintName;
            var blueprintModuleId = references.blueprintModuleId;
            var prototypeName = references.prototypeName;
            var moduleId = references.moduleId;

            var binderReference = references.binderReference;
            var binderPromise = Promise.resolve(BlueprintBinder.manager.defaultBinder);
            if (binderReference) {
                binderPromise = BinderReference.valueFromReference(binderReference, require);
            }

            var deferredBlueprint = Promise.defer();
            binderPromise.then(function(binder) {
                if (binder) {
                    var blueprint = binder.blueprintForPrototype(prototypeName, moduleId);
                    if (blueprint) {
                        deferredBlueprint.resolve(blueprint);
                    } else {
                        try {
                            Blueprint.getBlueprintWithModuleId(blueprintModuleId, require).then(function(blueprint) {
                                if (blueprint) {
                                    binder.addBlueprint(blueprint);
                                    deferredBlueprint.resolve(blueprint);
                                } else {
                                    deferredBlueprint.reject("Error cannot find Blueprint " + blueprintModuleId);
                                }
                            }, deferredBlueprint.reject);
                        } catch (exception) {
                            deferredBlueprint.reject("Error cannot find Blueprint " + blueprintModuleId);
                        }
                    }

                } else {
                    try {
                        deferredBlueprint = Blueprint.getBlueprintWithModuleId(blueprintModuleId, require);
                    } catch (exception) {
                        deferredBlueprint.reject("Error cannot find Blueprint " + blueprintModuleId);
                    }
                }
            });
            return deferredBlueprint.promise;
        }
    },

    referenceFromValue: {
        value: function(value) {
            // the value is a blueprint we need to serialize the binder and the blueprint reference
            var references = {};
            references.blueprintName = value.name;
            references.blueprintModuleId = value.blueprintModuleId;
            references.prototypeName = value.prototypeName;
            references.moduleId = value.moduleId;
            if ((value.binder) && (! value.binder.isDefault)) {
                references.binderReference = BinderReference.referenceFromValue(value.binder);
            }
            return references;
        }
    }

});

var BinderReference = exports.BinderReference = RemoteReference.create(RemoteReference, {

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
            var binder = BlueprintBinder.manager.blueprintBinderForName(binderName);
            if (binder) {
                deferredBinder.resolve(binder);
            } else {
                try {
                    deferredBinder = BlueprintBinder.getBinderWithModuleId(binderModuleId, require);
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
