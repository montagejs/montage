"use strict";
/**
 @module montage/core/blueprint
 @requires montage/core/core
 @requires core/promise
 @requires core/meta/binder-manager
 @requires core/meta/blueprint
 @requires core/logger
 */
var Montage = require("montage").Montage;
var Promise = require("core/promise").Promise;
var Deserializer = require("core/deserializer").Deserializer;
var BinderManager = require("core/meta/binder-manager").BinderManager;
var BlueprintModule = require("core/meta/blueprint");
var logger = require("core/logger").logger("blueprint");

/**
 @private
 */
var _binderManager = null;

/**
 @class module:montage/core/blueprint.Binder
 @classdesc A blueprint binder is a collection of of blueprints for a specific access type. It also includes the connection information.
 @extends module:montage/core/core.Montage
 */
var Binder = exports.Binder = Montage.create(Montage, /** @lends module:montage/core/blueprint.Binder# */ {

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
            Binder.manager.addBinder(this);
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
                _binderManager = BinderManager.create();
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
                            Binder.manager.addBinder(this);
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
            return this.addBlueprint(BlueprintModule.Blueprint.create().initWithNameAndModuleId(name, moduleId));
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
                this._blueprintObjectProperty = Binder.manager.defaultBlueprintObjectProperty;
            }
            return this._blueprintObjectProperty;
        }
    }

});
