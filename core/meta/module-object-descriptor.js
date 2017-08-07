var Montage = require("../core").Montage,
    Promise = require("../promise").Promise,
    ObjectDescriptor = require("./object-descriptor").ObjectDescriptor,
    Deserializer = require("../serialization/deserializer/montage-deserializer").MontageDeserializer,
    ModuleReference = require("../module-reference").ModuleReference,
    deprecate = require("../deprecate");

// Cache all loaded object descriptors
var OBJECT_DESCRIPTOR_CACHE = Object.create(null);

/**
 * @class ModuleObjectDescriptor
 * @extends ObjectDescriptor
 */
var ModuleObjectDescriptor = exports.ModuleObjectDescriptor = ObjectDescriptor.specialize(/** @lends ModuleObjectDescriptor# */ {

    /**
     * @function
     * @param {ModuleReference} module
     * @param {string} name
     * @returns this
     */
    initWithModuleAndExportName: {
        value: function (module, exportName) {
            var self = ObjectDescriptor.prototype.initWithName.call(this, exportName);
            self.module = module;
            self.exportName = exportName;
            return self;
        }
    },

    serializeSelf: {
        value: function (serializer) {
            if (!this.module) {
                throw new Error("Cannot serialize object descriptor without a module reference");
            }
            if (!this.exportName) {
                throw new Error("Cannot serialize object descriptor without an exportName");
            }

            this.super(serializer);
            this._setPropertyWithDefaults(serializer, "module", this.module);
            this._setPropertyWithDefaults(serializer, "exportName", this.exportName);
        }
    },

    deserializeSelf: {
        value: function (deserializer) {
            this.super(deserializer);
            this.module = deserializer.getProperty("module");
            this.exportName = deserializer.getProperty("exportName");

            if (!this.module) {
                throw new Error("Cannot deserialize object descriptor without a module reference");
            }
            if (!this.exportName) {
                throw new Error("Cannot deserialize object descriptor without an exportName");
            }
        }
    },

    /**
     * A reference to the module that this object descriptor is for.
     * @type {ModuleReference}
     */
    module: {
        value: null
    },

    /**
     * The name of the export this object descriptor is for.
     * @type {string}
     */
    exportName: {
        value: null
    },

    objectDescriptorInstanceModule: {
        serializable: false,
        value: null
    }

}, /** @lends ModuleObjectDescriptor. */ {

    /**
     * Gets an object descriptor from a serialized file at the given module id.
     * @function
     * @param {string} object descriptor module id
     * @param {function} require function
     */
    getObjectDescriptorWithModuleId: {
        value: function (moduleId, _require) {
            if (moduleId.search(/\.meta$/) === -1 && moduleId.search(/\.mjson$/) === -1) {
                throw new Error(moduleId + " object descriptor module id does not end in '.meta' or '.mjson'");
            }
            if (!_require) {
                throw new Error("Require needed to get object descriptor " + moduleId);
            }

            var targetRequire;

            var key = _require.location + "#" + moduleId;
            if (key in OBJECT_DESCRIPTOR_CACHE) {
                return OBJECT_DESCRIPTOR_CACHE[key];
            }

            return OBJECT_DESCRIPTOR_CACHE[key] = _require.async(moduleId)
                .then(function (object) {
                    // Need to get the require from the module, because thats
                    // what all the moduleId references are relative to.
                    targetRequire = Deserializer.getModuleRequire(_require, moduleId);
                    return new Deserializer().init(JSON.stringify(object), targetRequire).deserializeObject();
                }).then(function (objectDescriptor) {
                    
                    // TODO: May want to relax this to being just an Object Descriptor
                    if (!ModuleObjectDescriptor.prototype.isPrototypeOf(objectDescriptor)) {
                        throw new Error("Object in " + moduleId + " is not a module-object-descriptor");
                    }

                    objectDescriptor.objectDescriptorInstanceModule = new ModuleReference().initWithIdAndRequire(moduleId, _require);

                    if (objectDescriptor._parentReference) {
                        // Load parent "synchronously" so that all the properties
                        // through the object descriptor chain are available
                        return objectDescriptor._parentReference.promise(targetRequire) // MARK
                            .then(function (parentObjectDescriptor) {
                                objectDescriptor._parent = parentObjectDescriptor;
                                return objectDescriptor;
                            });
                    }

                    return objectDescriptor;
                });
        }
    },

    createDefaultObjectDescriptorForObject: {
        value: function (object) {
            var target = Montage.getInfoForObject(object).isInstance ? Object.getPrototypeOf(object) : object;
            var info = Montage.getInfoForObject(target);
            if (!info.objectName || !info.moduleId) {
                return Promise.reject("Cannot create module-object-descriptor for an object that has no been loaded from a module");
            }

            return this.super(object)
                .then(function (objectDescriptor) {
                    objectDescriptor.module = new ModuleReference().initWithIdAndRequire(info.moduleId, info.require);
                    objectDescriptor.exportName = info.objectName;
                    return objectDescriptor;
                });
        }
    },

    /***************************************************************
     * Deprecated methods.
     */

    /**
     * Gets an object descriptor from a serialized file at the given module id.
     * @deprecated
     * @function
     * @param {string} object descriptor module id
     * @param {function} require function
     */
    getBlueprintWithModuleId: {
        value: deprecate.deprecateMethod(void 0, function (moduleId, _require) {
            return ModuleObjectDescriptor.getObjectDescriptorWithModuleId(moduleId, _require);
        }, "ModuleBlueprint.getBlueprintWithModuleId", "ModuleObjectDescriptor.getObjectDescriptorWithModuleId")
    },

    /**
     * @deprecated
     */
    createDefaultBlueprintForObject: {
        value: deprecate.deprecateMethod(void 0, function (object) {
            return ModuleObjectDescriptor.createDefaultObjectDescriptorForObject(object);
        }, "ModuleBlueprint.createDefaultBlueprintForObject", "ModuleObjectDescriptor.createDefaultObjectDescriptorForObject")
    }


});
