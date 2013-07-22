var Binder = require("core/meta/binder").Binder;
var Deserializer = require("core/serialization").Deserializer;

var ModuleBinder = exports.ModuleBinder = Binder.specialize({

    constructor: {
        value: function ModuleBinder() {
            var self = this.super();
            this._exports = {};
            this.addRangeAtPathChangeListener("_blueprints", this, "handleBlueprintsRangeChange");
            return self;
        }
    },

    serializeSelf: {
        value: function(serializer) {
            if (!this.binderInstanceModuleId) {
                throw new Error("Cannot serialize binder without a module id");
            }

            this.super(serializer);
        }
    },

    deserializeSelf: {
        value: function(deserializer) {
            this.super(deserializer);
            this.moduleId = deserializer.getProperty("moduleId");
        }
    },

    /**
     * The id of the module that this binder is for
     * @type {string}
     */
    moduleId: {
        value: null
    },

    _exports: {
        value: null
    },

    handleBlueprintsRangeChange: {
        value: function (plus, minus) {
            var isDeserializing = this.isDeserializing;
            // TODO check that all blueprints come from the same require when
            // added
            plus.forEach(function (blueprint) {
                if (blueprint.prototypeName) {
                    this.handlePrototypeNameChange(blueprint.prototypeName, "prototypeName", blueprint);
                } else if (!isDeserializing) {
                    // TODO throw error? Perhaps in a beforeRangeChange to prevent
                    // the change from taking. But might leave things in an
                    // inconsistent state.
                    console.error("ModuleBinder blueprint must have a prototypeName");
                }
                blueprint.addOwnPropertyChangeListener("prototypeName", this);
            }, this);
            minus.forEach(function (blueprint) {
                blueprint.removeOwnPropertyChangeListener("prototypeName", this);
                delete this._exports[blueprint.prototypeName];
            }, this);
        }
    },

    handlePrototypeNameChange: {
        value: function (value, key, blueprint) {
            var _exports = this._exports;
            if (
                blueprint.prototypeName in _exports &&
                _exports[blueprint.prototypeName] !== blueprint
            ) {
                console.error(
                    "Two different blueprints with the same prototypeName added to a module binder",
                    _exports[blueprint.prototypeName],
                    blueprint
                );
            }
            _exports[value] = blueprint;
        }
    },

    /**
     * Gets the blueprint in this ModuleBinder with the given exportName/prototypeName
     * @function
     * @param {string} exportName Name of the export to get the blueprint for.
     * @returns {Blueprint}
     */
    getBlueprintForExport: {
        value: function (exportName) {
            return this._exports[exportName];
        }
    }
}, {

    /**
     * Gets the binder from a .meta module.
     * @function
     * @param {string} blueprintModuleId The module id of a .meta module
     * @param {function} targetRequire The require that the module id is relative to
     * @returns {Promise.<ModuleBinder>} A promise for the ModuleBinder in the .meta module
     */
    getBinder: {
        value: function(blueprintModuleId, targetRequire) {
            if (blueprintModuleId.search(/\.meta$/) === -1) {
                throw new Error(blueprintModuleId + " blueprint module id does not end in '.meta'");
            }

            // FIXME cache module-binders
            return targetRequire.async(blueprintModuleId)
            .then(function (object) {
                // Need to get the require from the module, because thats
                // what all the moduleId references are relative to.
                targetRequire = getModuleRequire(targetRequire, blueprintModuleId);
                return new Deserializer().init(JSON.stringify(object), targetRequire).deserializeObject();
            }).then(function (binder) {
                if (!ModuleBinder.prototype.isPrototypeOf(binder)) {
                    throw new Error(blueprintModuleId + " does not contain a ModuleBinder");
                }

                // FIXME do in deserialization
                binder._require = targetRequire;

                var moduleId = binder.moduleId;
                binder._blueprints.forEach(function (blueprint) {
                    if (blueprint.moduleId && blueprint.moduleId !== moduleId) {
                        throw new Error(
                            "ModuleBinder blueprint had unexpected module id '" +
                            blueprint.moduleId + "', expecting '" + moduleId + "'"
                        );
                    }
                    blueprint.moduleId = moduleId;
                });

                return binder;
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
