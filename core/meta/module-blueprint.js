var Montage = require("montage").Montage;
var Promise = require("core/promise").Promise;
var Blueprint = require("core/meta/blueprint").Blueprint;
var Deserializer = require("core/serialization").Deserializer;
var ModuleReference = require("core/module-reference").ModuleReference;

// Increment for backwards incompatible format changes, where old versions of
// deserializeSelf will no longer be able to handle the serialization.
var MAJOR_VERSION = 2;
// Increment for format changes compatible with the MAJOR_VERSION. This
// includes any changes that add new properties to the serialization.
var MINOR_VERSION = 0;
// The version to assume when the `version` property does not appear in the
// serialization.
var MISSING_VERSION = "1.0";

// Cache all loaded blueprints
var BLUEPRINT_CACHE = Object.create(null);

function version1DeserializeSelf(deserializer) {
    this.deserializedFromSerialization = function () {
        Blueprint.deserializeSelf.call(this, deserializer);
        delete this.deserializedFromSerialization;
    };
}

var ModuleBlueprint = exports.ModuleBlueprint = Blueprint.specialize({

    /**
     @function
     @param {String} name TODO
     @param {String} module A ModuleReference
     @returns this
     */
    initWithModuleAndExportName: {
        value: function(module, exportName) {
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
        value: function(serializer) {
            if (!this.module) {
                throw new Error("Cannot serialize blueprint without a module reference");
            }
            if (!this.exportName) {
                throw new Error("Cannot serialize blueprint without an exportName");
            }

            this.super(serializer);
            serializer.setProperty("version", MAJOR_VERSION + "." + MINOR_VERSION);
            this._setPropertyWithDefaults(serializer, "module", this.module);
            this._setPropertyWithDefaults(serializer, "exportName", this.exportName);
        }
    },

    deserializeSelf: {
        value: function(deserializer) {
            var version = deserializer.getProperty("version") || MISSING_VERSION;
            version = version.split(".").map(function (n) { return parseInt(n, 10); });

            if (version[0] > MAJOR_VERSION) {
                throw new Error(
                    "Cannot deserialize module-blueprint version " +
                    version.join(".") + " with version " +
                    MAJOR_VERSION + "." + MINOR_VERSION + " deserializer"
                );
            }

            if (version[0] === 1) {
                version1DeserializeSelf.call(this, deserializer);
            } else {
                this.super(deserializer);
            }

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

}, {
    /**
     Gets a blueprint from a serialized file at the given module id.
     @function
     @param {String} blueprint module id
     @param {Function} require function
     */
    getBlueprintWithModuleId: {
        value: function(moduleId, _require) {
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
                    .then(function(parentBlueprint) {
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
