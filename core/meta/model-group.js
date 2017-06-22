var Montage = require("../core").Montage,
    ModelModule = require("./model"),
    ObjectProperty = require("./object-property").ObjectProperty,
    deprecate = require("../deprecate");

/**
 * @class ModelGroup
 * @classdesc A model group is a singleton that is responsible for
 * loading and dispatching object models and descriptors.
 *
 * @extends Montage
 */
exports.ModelGroup = Montage.specialize( /** @lends ModelGroup.prototype # */ {

    /**
     * @constructs ModelGroup
     */
    constructor: {
        value: function ModelGroup() {
            this._models = [];
            this._modelTable = {};
        }
    },

    _name: {
        value: null
    },

    /**
     * Name of the ModelGroup.
     * The name is used to define the property on the object.
     * @function
     * @type {string}
     */
    name: {
        get: function () {
            return this._name;
        },
        set: function (value) {
            if(value !== this._name) this._name = value;
        }
    },

    /**
     * @private
     * @property {Array} value
     */
    _models: {
        value: null
    },

    /**
     * @private
     */
    _modelTable: {
        value: null
    },

    /**
     * Return the list of binder registered on the manager.
     *
     * @readonly
     * @returns {Array.<Binder>}
     */
    models: {
        get: function () {
            return this._models;
        }
    },

    /**
     * Adds an object model to the model group.
     *
     * @function
     * @param {Model} model
     */
    addModel: {
        value: function (model) {
            var index;
            if (model !== null) {
                if (this._modelTable[model.name]) {
                    this.removeModel(this._modelTable[model.name]);
                }
                index = this._models.indexOf(model);
                if (index >= 0) {
                    this._models.splice(index, 1);
                }
                this._models.push(model);
                this._modelTable[model.name] = model;
            }
        }
    },

    /**
     * @function
     * @param {Model} model
     */
    removeModel: {
        value: function (model) {
            var index;
            if (model !== null) {
                index = this._models.indexOf(model);
                if (index >= 0) {
                    this._models.splice(index, 1);
                }
                if (this._modelTable[model.name]) {
                    delete this._modelTable[model.name];
                }
            }
        }
    },

    /**
     * Gets the object model associated with the name.
     * @param {string} name
     */
    modelForName: {
        value: function (name) {
            return this._modelTable[name];
        }
    },

    /**
     * Search through the models for an object descriptor that extends
     * the provided prototype.
     * @function
     * @param {string} prototypeName
     * @param {string} moduleId
     * @returns The requested object descriptor or null if this prototype is not
     * found.
     */
    objectDescriptorForPrototype: {
        value: function (prototypeName, moduleId /* unused */) {
            var objectDescriptor = null, model, index;
            for (index = 0; typeof (model = this.models[index]) !== "undefined" && !objectDescriptor; index++) {
                objectDescriptor = model.objectDescriptorForName(prototypeName);
            }
            return objectDescriptor;
        }
    },

    /**
     * @private
     */
    _defaultObjectDescriptorObjectProperty: {
        serializable: true,
        value: null
    },

    /**
     * Return the default object descriptor's object property.
     * This is the last resort property declaration object.
     *
     * @readonly
     * @returns {ObjectProperty} default object descriptor object property
     */
    defaultObjectDescriptorObjectProperty: {
        get: function () {
            if (!this._defaultObjectDescriptorObjectProperty) {
                this._defaultObjectDescriptorObjectProperty = new ObjectProperty().init();
            }
            return this._defaultObjectDescriptorObjectProperty;
        }
    },

    _defaultModel: {
        serializable: true,
        value: null
    },

    /**
     * Return the default model.
     * This is the last resort property declaration object.
     *
     * @readonly
     * @returns {Model} default object descriptor model
     */
    defaultModel: {
        get: function () {
            if (!this._defaultModel) {
                var _require = global.mr || require; // Handle legacy
                this._defaultModel = new ModelModule.Model().initWithNameAndRequire("default", _require);
                this._defaultModel.isDefault = true;
                this.addModel(this._defaultModel);
            }
            return this._defaultModel;
        }
    },

    /******************************************************************************
     * Deprecated Methods
     */

    /**
     * Return the list of models registered on the group.
     * @deprecated
     * @readonly
     * @returns {Array.<Binder>}
     */
    binders: {
        get: deprecate.deprecateMethod(void 0, function () {
            return this.models;
        }, "binders", "models")
    },

    /**
     * Add a new model
     * @deprecated
     * @function
     * @param {Model} model
     */
    addBinder: {
        value: deprecate.deprecateMethod(void 0, function (binder) {
            this.addModel(binder);
        }, "addBinder", "addModel")
    },

    /**
     * @deprecated
     * @function
     * @param {Binder} binder
     */
    removeBinder: {
        value: deprecate.deprecateMethod(void 0, function (binder) {
            return this.removeModel(binder);
        }, "removeBinder", "removeModel")
    },

    /**
     * @deprecated
     * Gets the model associated with the name.
     * @param {string} name
     */
    binderForName: {
        value: deprecate.deprecateMethod(void 0, function (name) {
            // return this._binderTable[name];
            return this.modelForName(name);
        }, "binderForName", "modelForName")
    },

    /**
     * Search through the binders for an object descriptor that extends that prototype.
     * @deprecated
     * @function
     * @param {string} prototypeName
     * @param {string} moduleId
     * @returns The requested object descriptor or null if this prototype is not
     * managed.
     */
    blueprintForPrototype: {
        value: deprecate.deprecateMethod(void 0, function (prototypeName, moduleId) {
            return this.objectDescriptorForPrototype(prototypeName);
        }, "blueprintForPrototype", "objectDescriptorForPrototype")
    },

    /**
     * Return the default object property.
     * This is the last resort property declaration object.
     * @deprecated
     * @readonly
     * @returns {ObjectProperty} default object property
     */
    defaultBlueprintObjectProperty: {
        get: deprecate.deprecateMethod(void 0, function () {
            return this.defaultObjectDescriptorObjectProperty;
        }, "defaultBlueprintObjectProperty", "defaultObjectDescriptorObjectProperty")
    },

    /**
     * Return the default model.
     *
     * @readonly
     * @returns {Model} default model
     */
    defaultBinder: {
        get: deprecate.deprecateMethod(void 0, function () {
            return this.defaultModel;
        }, "defaultBinder", "defaultModel")
    }

});
