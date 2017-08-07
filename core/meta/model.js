var Montage = require("../core").Montage,
    ModelGroup = require("./model-group").ModelGroup,
    ObjectDescriptorModule = require("./object-descriptor"),
    deprecate = require("../deprecate"),
    application = require("../application").application;
    var _group = null;

/**
 * @class Model
 * @classdesc A Model represents a logical collection
 *
 * @extends Montage
 */
var Model = exports.Model = Montage.specialize( /** @lends Model.prototype # */ {

    /**
     * @constructs Model
     */
    constructor: {
        value: function Model() {
            this._name = null;
            this.modelModuleId = null;
            this.isDefault = false;
            this._objectDescriptorForPrototypeTable = {};
            return this;
        }
    },

    /**
     * @function
     * @param {string} name
     * @returns itself
     */
    initWithNameAndRequire: {
        value: function (name, _require) {
            if (!name) throw new Error("name is required");
            if (!_require) throw new Error("require is required");

            this._name = name;
            this._require = _require;
            Model.group.addModel(this);
            return this;
        }
    },

    serializeSelf: {
        value: function (serializer) {

            if (this.version > 1) {
                serializer.setProperty("version", this.version);
            }

            serializer.setProperty("name", this.name);
            if (this.objectDescriptors.length > 0) {
                serializer.setProperty("objectDescriptors", this.objectDescriptors);
            }
            serializer.setProperty("objectModelModuleId", this.modelInstanceModuleId);
        }
    },

    deserializeSelf: {
        value: function (deserializer) {
            var value = deserializer.getProperty("version");
            if (value !== undefined) {
                this.version = value;
            }

            this._name = deserializer.getProperty("name");
            //copy contents into the objectDescriptors array
            value = deserializer.getProperty("objectDescriptors") || deserializer.getProperty("blueprints");
            if (value) {
                this._objectDescriptors = value;
            }
            this.modelInstanceModuleId = deserializer.getProperty("objectModelModuleId") || deserializer.getProperty("binderModuleId");
        }
    },

    _name: {
        value: null
    },

    /**
     * Name of the object.
     * The name is used to define the property on the object.
     * @function
     * @type {string}
     */
    name: {
        get: function () {
            return this._name;
        }
    },

    /**
     * @private
     */
    _require: {
        value: null
    },

    /**
     * Require for the binder.
     * All objectDescriptors added must be in this require's package, or in a direct
     * dependency.
     * @readonly
     * @returns {function} a package's `require` function
     */
    require: {
        get: function () {
            return this._require;
        }
    },

    /**
     * @private
     */
    _objectDescriptorForPrototypeTable: {
        value: null
    },

    /**
     * The identifier is the name of the binder and is used to make the
     * serialization of binders more readable.
     * @returns {string}
     */
    identifier: {
        get: function () {
            return [
                "objectModel",
                this.name.toLowerCase()
            ].join("_");
        }
    },

    /**
     * This is used for references only so that we can reload referenced
     * binders.
     */
    modelInstanceModuleId: {
        serializable:false,
        value: null
    },

    /**
     * Identify the default binder. Do not set.
     * @readonly
     * @type {boolean}
     */
    isDefault: {
        serializable: false,
        value: false
    },

    _objectDescriptors: {
        value: null
    },

    /**
     * The list of objectDescriptors in this binder.
     * @readonly
     * @returns {Array.<ObjectDescriptor>}
     */
    objectDescriptors: {
        get: function () {
            return this._objectDescriptors || (this._objectDescriptors = []);
        }
    },

    /**
     * @function
     * @param {?ObjectDescriptor} objectDescriptor
     * @returns objectDescriptor
     */
    addObjectDescriptor: {
        value: function (objectDescriptor) {
            if (objectDescriptor !== null) {
                var index = this.objectDescriptors.indexOf(objectDescriptor);
                if (index < 0) {
                    if ((objectDescriptor.model !== null) && (objectDescriptor.model !== this)) {
                        objectDescriptor.model.removeObjectDescriptor(objectDescriptor);
                    }
                    this.objectDescriptors.push(objectDescriptor);
                    objectDescriptor.model = this;
                }
            }
            return objectDescriptor;
        }
    },

    /**
     * @function
     * @param {ObjectDescriptor} objectDescriptor
     * @returns objectDescriptor
     */
    removeObjectDescriptor: {
        value: function (objectDescriptor) {
            if (objectDescriptor !== null) {
                var index = this.objectDescriptors.indexOf(objectDescriptor);
                if (index >= 0) {
                    this.objectDescriptors.splice(index, 1);
                    objectDescriptor.model = null;
                }
            }
            return objectDescriptor;
        }
    },

    /**
     * @function
     * @param {string} name
     * @param {string} moduleID
     * @returns {ObjectDescriptor} The new objectDescriptor
     */
    addObjectDescriptorNamed: {
        value: function (name) {
            return this.addObjectDescriptor(new ObjectDescriptorModule.ObjectDescriptor().initWithName(name));
        }
    },

    /**
     * Return the object descriptor associated with this prototype.
     * @function
     * @param {string} prototypeName
     * @param {string} moduleId
     * @returns {?ObjectDescriptor} objectDescriptor
     */
    objectDescriptorForPrototype: {
        value: deprecate.deprecateMethod(void 0, function (prototypeName) {
            return this.objectDescriptorForName(prototypeName);
        }, "objectDescriptorForPrototype", "objectDescriptorForName")
    },

    /**
     *
     * @param {string} name
     * @returns {?ObjectDescriptor} if this model has an object descriptor
     * with the provided name.  Otherwise, returns null.
     */
    objectDescriptorForName: {
        value: function (name) {
            var objectDescriptors = this.objectDescriptors,
                objectDescriptor = null,
                length = objectDescriptors.length;
            for (var i = 0; i < length && !objectDescriptor; i++) {
                if (objectDescriptors[i].name === name) {
                    objectDescriptor = objectDescriptors[i];
                }
            }
            return objectDescriptor;
        }
    },

    /**
     * @private
     */
    _objectDescriptorObjectProperty: {
        value: null
    },

    /**
     * Return the object descriptor object property for this model.
     * This will return the default if none is declared.
     * @type {ObjectProperty}
     */
    ObjectProperty: {
        get: function () {
            if (!this._objectDescriptorObjectProperty) {
                this._objectDescriptorObjectProperty = Model.group.defaultObjectDescriptorObjectProperty;
            }
            return this._objectDescriptorObjectProperty;
        }
    },

    objectDescriptorModuleId: require("../core")._objectDescriptorModuleIdDescriptor,
    objectDescriptor: require("../core")._objectDescriptorDescriptor,

    /******************************************************************************
     * Deprecated Methods
     */


    /**
     * The list of object descriptors in this model.
     * @deprecated
     * @readonly
     * @returns {Array.<ObjectDescriptor>}
     */
    blueprints: {
        get: deprecate.deprecateMethod(void 0, function () {
            return this.objectDescriptors;
        }, "blueprints", "objectDescriptors")
    },

    /**
     * @deprecated
     * @function
     * @param {?ObjectDescriptor} objectDescriptor
     * @returns objectDescriptor
     */
    addBlueprint: {
        value: deprecate.deprecateMethod(void 0, function (blueprint) {
            return this.addObjectDescriptor(blueprint);
        }, "addBlueprint", "addObjectDescriptor")
    },

    /**
     * @deprecated
     * @function
     * @param {ObjectDescriptor} objectDescriptor
     * @returns objectDescriptor
     */
    removeBlueprint: {
        value: deprecate.deprecateMethod(void 0, function (blueprint) {
            return this.removeObjectDescriptor(blueprint);
        }, "removeBlueprint", "removeObjectDescriptor")
    },

    /**
     * @deprecated
     * @function
     * @param {string} name
     * @param {string} moduleID
     * @returns {ObjectDescriptor} The new objectDescriptor
     */
    addBlueprintNamed: {
        value: deprecate.deprecateMethod(void 0, function (name) {
            return this.addObjectDescriptorNamed(name);
        }, "addBlueprintNamed", "addObjectDescriptorNamed")
    },

    /**
     * @deprecated
     * Return the objectDescriptor associated with this prototype.
     * @function
     * @param {string} prototypeName
     * @param {string} moduleId
     * @returns {?ObjectDescriptor} objectDescriptor
     */
    blueprintForPrototype: {
        value: deprecate.deprecateMethod(void 0, function (prototypeName) {
            return this.blueprintForName(prototypeName);
        }, "blueprintForPrototype", "blueprintForName")
    },

    /**
     * @deprecated
     * @param {string} name
     * @returns {?ObjectDescriptor}
     */
    blueprintForName: {
        value: deprecate.deprecateMethod(void 0, function (name) {
            return this.objectDescriptorForName(name);
        }, "blueprintForName", "objectDescriptorForName")
    },

    blueprintModuleId: require("../core")._objectDescriptorModuleIdDescriptor,
    blueprint: require("../core")._objectDescriptorDescriptor

}, {

    /**
     * Returns the model group.
     * @returns {ModelGroup}
     */
    group: {
        get: function () {
            if (_group === null) {
                _group = new ModelGroup();
                _group.name = application ? application.name : "";
                console.log("Default ModelGroup name is ",_group.name);
            }
            return _group;
        }
    },

    /******************************************************************************
     * Deprecated Methods
     */

    /**
     * @deprecated
     * Returns the model group.
     * @returns {ModelGroup}
     */
    manager: {
        get: deprecate.deprecateMethod(void 0, function () {
            return exports.Model.group;
        }, "Binder.manager", "Model.group")
    }

});
