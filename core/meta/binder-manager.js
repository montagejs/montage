"use strict";
/**
 @module montage/core/meta/binder-manager
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
 @class BinderManager
 @classdesc A blueprint binder manager is a singleton that is responsible for loading and dispaching binders and blueprints.
 @extends Montage
 */

var BinderManager = exports.BinderManager = Montage.specialize( /** @lends BinderManager# */ {

    constructor: {
        value: function BinderManager() {
            this._binders = [];
            this._binderTable = {};
        }
    },

    /**
     @private
     */
    _binders: {
        value: null
    },


    /**
     @private
     */
    _binderTable: {
        value: null
    },

    /**
     Return the list of binder registered on the manager
     @type {Array<Binder>}
     */
    binders: {
        get: function() {
            return this._binders;
        }
    },

    /**
     Add a new blueprint binder.
     @function
     @param {Property} binder TODO
     */
    addBinder: {
        value: function(binder) {
            if (binder !== null) {
                if (this._binderTable[binder.name]) {
                    this.removeBinder(this._binderTable[binder.name]);
                }
                var index = this._binders.indexOf(binder);
                if (index >= 0) {
                    this._binders.splice(index, 1);
                }
                this._binders.push(binder);
                this._binderTable[binder.name] = binder;
            }
        }
    },

    /**
     @function
     @param {Property} binder TODO
     */
    removeBinder: {
        value: function(binder) {
            if (binder !== null) {
                var index = this._binders.indexOf(binder);
                if (index >= 0) {
                    this._binders.splice(index, 1);
                }
                if (this._binderTable[binder.name]) {
                    delete this._binderTable[binder.name];
                }
            }
        }
    },

    /*
     * Returns the blueprint binder associated with the name
     */
    binderForName: {
        value: function(name) {
            return this._binderTable[name];
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
            for (index = 0; typeof (binder = this.binders[index]) !== "undefined"; index++) {
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
                this._defaultBlueprintObjectProperty = new ObjectProperty().init();
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
                this._defaultBinder = new BinderModule.Binder().initWithNameAndRequire("default", global.require);
                this._defaultBinder.isDefault = true;
                this.addBinder(this._defaultBinder);
            }
            return this._defaultBinder;
        }
    }

});
