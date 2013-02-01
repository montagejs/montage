"use strict";
/**
 @module montage/core/blueprint
 @requires montage/core/core
 @requires core/exception
 @requires core/promise
 @requires core/logger
 */
var Montage = require("montage").Montage;
var Promise = require("core/promise").Promise;
var ObjectProperty = require("core/meta/object-property").ObjectProperty;
var BinderModule = require("core/meta/binder");

var logger = require("core/logger").logger("blueprint");

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
                this._defaultBinder = BinderModule.BlueprintBinder.create().initWithName("default");
                this._defaultBinder.isDefault = true;
                this.addBlueprintBinder(this._defaultBinder);
            }
            return this._defaultBinder;
        }
    }

});