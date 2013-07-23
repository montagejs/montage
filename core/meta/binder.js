"use strict";
/**
 @module montage/core/meta/binder
 @requires montage/core/core
 @requires core/promise
 @requires core/meta/binder-manager
 @requires core/meta/blueprint
 @requires core/logger
 */
var Montage = require("montage").Montage;
var Promise = require("core/promise").Promise;
var Deserializer = require("core/serialization").Deserializer;
var BinderManager = require("core/meta/binder-manager").BinderManager;
var BlueprintModule = require("core/meta/blueprint");
var logger = require("core/logger").logger("blueprint");

/**
 @private
 */
var _binderManager = null;

/**
 @class Binder
 @classdesc A blueprint binder is a collection of of blueprints for a specific access type. It also includes the connection information.
 @extends Montage
 */
var Binder = exports.Binder = Montage.specialize( /** @lends Binder# */ {

    /**
      constructor method
      @function
      @private
    */
    constructor: {
        value: function Binder() {
            this.super();
            this._name = null;
            this.binderModuleId = null;
            this.isDefault = false;
            this._blueprintForPrototypeTable = {};
            return this;
        }
    },

    /**
     @function
     @param {String} name TODO
     @returns itself
     */
    initWithNameAndRequire: {
        value: function(name, _require) {
            if (!name) throw new Error("name is required");
            if (!_require) throw new Error("require is required");

            this._name = name;
            this._require = _require;
            Binder.manager.addBinder(this);
            return this;
        }
    },

    serializeSelf: {
        value: function(serializer) {
            serializer.setProperty("name", this.name);
            if (this.blueprints.length > 0) {
                serializer.setProperty("blueprints", this.blueprints);
            }
            serializer.setProperty("binderModuleId", this.binderInstanceModuleId);
        }
    },

    deserializeSelf: {
        value: function(deserializer) {
            this._name = deserializer.getProperty("name");
            //copy contents into the blueprints array
            var value = deserializer.getProperty("blueprints");
            if (value) {
                this._blueprints = value;
            }
            this.binderInstanceModuleId = deserializer.getProperty("binderModuleId");
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
     @private
     */
    _require: {
        value: null
    },

    /**
     Require for the binder. All blueprints added must be in this require's
     package, or in a direct dependency.
     @function
     @returns {String} this._require
     */
    require: {
        get: function() {
            return this._require;
        }
    },

    /**
     @private
     */
    _blueprintForPrototypeTable: {
        distinct:true,
        value: {}
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
    binderInstanceModuleId: {
        serializable:false,
        value: null
    },

    /*
    * Identify the default binder. Do not set.
     */
    isDefault: {
        serializable: false,
        value: false
    },

    _blueprints: {
        distinct: true,
        value: []
    },

    /**
     Returns the list of blueprints in this binder
     @function
     @default {Array}
     */
    blueprints: {
        get: function() {
            return this._blueprints;
        }
    },

    /**
     @function
     @param {Array} blueprint TODO
     @returns blueprint
     */
    addBlueprint: {
        value: function (blueprint) {
            if (blueprint !== null) {
                var index = this.blueprints.indexOf(blueprint);
                if (index < 0) {
                    if ((blueprint.binder !== null) && (blueprint.binder !== this)) {
                        blueprint.binder.removeBlueprint(blueprint);
                    }
                    this.blueprints.push(blueprint);
                    blueprint.binder = this;
                }
            }
            return blueprint;
        }
    },

    /**
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
                }
            }
            return blueprint;
        }
    },

    /**
     @function
     @param {String} name TODO
     @param {String} moduleID TODO
     @returns {Blueprint} The new blueprint
     */
    addBlueprintNamed: {
        value: function(name) {
            return this.addBlueprint(new BlueprintModule.Blueprint().initWithName(name));
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
        value: Montage.deprecate(void 0, function (prototypeName) {
            return this.blueprintForName(prototypeName);
        }, "blueprintForPrototype", "blueprintForName")
    },

    blueprintForName: {
        value: function (name) {
            var blueprints = this.blueprints,
                length = blueprints.length;
            for (var i = 0; i < length; i++) {
                if (blueprints[i].name === name) {
                    return blueprints[i];
                }
            }
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
    },

    blueprintModuleId:require("montage")._blueprintModuleIdDescriptor,

    blueprint:require("montage")._blueprintDescriptor

}, {

    /**
     Returns the blueprint binder manager.
     @type {Property}
     @returns Blueprint Binder Manager
     */
    manager: {
        get: function() {
            if (_binderManager === null) {
                _binderManager = new BinderManager();
            }
            return _binderManager;
        }
    }

});
