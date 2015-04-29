"use strict";

/**
 * @module montage/core/meta/binder-manager
 * @requires montage/core/core
 * @requires montage/core/meta/object-property
 * @requires montage/core/meta/binder
 * @requires montage/core/logger
 */
var Montage = require("../core").Montage,
    ObjectProperty = require("./object-property").ObjectProperty,
    BinderModule = require("./binder"),
    logger = require("../logger").logger("blueprint");

/**
 * @class BinderManager
 * @classdesc A blueprint binder manager is a singleton that is responsible for
 * loading and dispaching binders and blueprints.
 *
 * @extends Montage
 */
var BinderManager = exports.BinderManager = Montage.specialize( /** @lends BinderManager.prototype # */ {
    /**
     * @constructs BinderManager
     */
    constructor: {
        value: function BinderManager() {
            this._binders = [];
            this._binderTable = {};
        }
    },

    /**
     * @private
     * @property {Array} value
     */
    _binders: {
        value: null
    },


    /**
     * @private
     */
    _binderTable: {
        value: null
    },

    /**
     * Return the list of binder registered on the manager.
     *
     * @readonly
     * @returns {Array.<Binder>}
     */
    binders: {
        get: function () {
            return this._binders;
        }
    },

    /**
     * Add a new blueprint binder
     *
     * @function
     * @param {Binder} binder
     */
    addBinder: {
        value: function (binder) {
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
     * @function
     * @param {Binder} binder
     */
    removeBinder: {
        value: function (binder) {
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

    /**
     * Gets the blueprint binder associated with the name.
     * @param {string} name
     */
    binderForName: {
        value: function (name) {
            return this._binderTable[name];
        }
    },

    /**
     * Search through the binders for a blueprint that extends that prototype.
     * @function
     * @param {string} prototypeName
     * @param {string} moduleId
     * @returns The requested blueprint or null if this prototype is not
     * managed.
     */
    blueprintForPrototype: {
        value: function (prototypeName, moduleId) {
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

    /**
     * @private
     */
    _defaultBlueprintObjectProperty: {
        serializable: true,
        value: null
    },

    /**
     * Return the default blueprint object property.
     * This is the last resort property declaration object.
     *
     * @readonly
     * @returns {ObjectProperty} default blueprint object property
     */
    defaultBlueprintObjectProperty: {
        get: function () {
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
     * Return the default blueprint object property.
     * This is the last resort property declaration object.
     *
     * @readonly
     * @returns {ObjectProperty} default blueprint object property
     */
    defaultBinder: {
        get: function () {
            if (!this._defaultBinder) {
                this._defaultBinder = new BinderModule.Binder().initWithNameAndRequire("default", self.mr);
                this._defaultBinder.isDefault = true;
                this.addBinder(this._defaultBinder);
            }
            return this._defaultBinder;
        }
    }

});

