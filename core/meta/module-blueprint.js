var Montage = require("../core").Montage;
var Promise = require("../promise").Promise;
var Blueprint = require("./blueprint").Blueprint;
var Deserializer = require("../serialization/deserializer/montage-deserializer").MontageDeserializer;
var ModuleReference = require("../module-reference").ModuleReference;

// Cache all loaded blueprints
var BLUEPRINT_CACHE = Object.create(null);

/**
 * @class ModuleBlueprint
 * @extends Blueprint
 */
var ModuleBlueprint = exports.ModuleBlueprint = Blueprint.specialize(/** @lends ModuleBlueprint# */ {

    /**
     * @function
     * @param {ModuleReference} module
     * @param {string} name
     * @returns this
     */
    initWithModuleAndExportName: {
        value: function (module, exportName) {
            var self = Blueprint.prototype.initWithName.call(this, exportName);

            self.module = module;
            self.exportName = exportName;

            return self;
        }
    },

    initWithNameAndModuleId: {
        value: function  () {
            throw new Error("Use initWithModuleAndExportName");
        }
    },

    serializeSelf: {
        value: function (serializer) {
            if (!this.module) {
                throw new Error("Cannot serialize blueprint without a module reference");
            }
            if (!this.exportName) {
                throw new Error("Cannot serialize blueprint without an exportName");
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
                throw new Error("Cannot deserialize blueprint without a module reference");
            }
            if (!this.exportName) {
                throw new Error("Cannot deserialize blueprint without an exportName");
            }
        }
    },

    /**
     * A reference to the module that this blueprint is for.
     * @type {ModuleReference}
     */
    module: {
        value: null
    },

    /**
     * The name of the export this blueprint is for.
     * @type {string}
     */
    exportName: {
        value: null
    }

}, /** @lends ModuleBlueprint. */ {

    /**
     * Gets a blueprint from a serialized file at the given module id.
     * @function
     * @param {string} blueprint module id
     * @param {function} require function
     */
    getBlueprintWithModuleId: {
        value: function (moduleId, _require) {
            if (moduleId.search(/\.meta$/) === -1) {
                throw new Error(moduleId + " blueprint module id does not end in '.meta'");
            }
            if (!_require) {
                throw new Error("Require needed to get blueprint " + moduleId);
            }

            var targetRequire;

            var key = _require.location + "#" + moduleId;
            if (key in BLUEPRINT_CACHE) {
                return BLUEPRINT_CACHE[key];
            }

            return BLUEPRINT_CACHE[key] = _require.async(moduleId)
            .then(function (object) {
                // Need to get the require from the module, because thats
                // what all the moduleId references are relative to.
                targetRequire = getModuleRequire(_require, moduleId);
                return new Deserializer().init(JSON.stringify(object), targetRequire).deserializeObject();
            }).then(function (blueprint) {
                // TODO: May want to relax this to being just a Blueprint
                if (!ModuleBlueprint.prototype.isPrototypeOf(blueprint)) {
                    throw new Error("Object in " + moduleId + " is not a module-blueprint");
                }

                blueprint.blueprintInstanceModule = new ModuleReference().initWithIdAndRequire(moduleId, _require);

                if (blueprint._parentReference) {
                    // Load parent "synchronously" so that all the properties
                    // through the blueprint chain are available
                    return blueprint._parentReference.promise(targetRequire) // MARK
                    .then(function (parentBlueprint) {
                        blueprint._parent = parentBlueprint;
                        return blueprint;
                    });
                } else {
                    return blueprint;
                }

                return blueprint;
            });
        }
    },

    createDefaultBlueprintForObject: {
        value: function (object) {
            var target = Montage.getInfoForObject(object).isInstance ? Object.getPrototypeOf(object) : object;
            var info = Montage.getInfoForObject(target);
            if (!info.objectName || !info.moduleId) {
                return Promise.reject("Cannot create module-blueprint for an object that has no been loaded from a module");
            }

            return this.super(object)
            .then(function (blueprint) {
                blueprint.module = new ModuleReference().initWithIdAndRequire(info.moduleId, info.require);
                blueprint.exportName = info.objectName;

                return blueprint;
            });

        }
    }
});

// Adapted from mr/sandbox
function getModuleRequire(parentRequire, moduleId) {
    var topId = parentRequire.resolve(moduleId);
    var module = parentRequire.getModuleDescriptor(topId);

    while (module.redirect || module.mappingRedirect) {
        if (module.redirect) {
            topId = module.redirect;
        } else {
            parentRequire = module.mappingRequire;
            topId = module.mappingRedirect;
        }
        module = parentRequire.getModuleDescriptor(topId);
    }

    return module.require;
}

