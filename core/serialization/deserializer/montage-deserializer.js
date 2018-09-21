var Montage = require("../../core").Montage,
    MontageContext = require("./montage-interpreter").MontageContext,
    MontageReviver = require("./montage-reviver").MontageReviver,
    BindingsModule = require("../bindings"),
    Map = require("collections/map").Map,
    Promise = require("core/promise").Promise,
    deprecate = require("../../deprecate");

var MontageDeserializer = exports.MontageDeserializer = Montage.specialize({

    _serializationString: {
        value: null
    },

    _serialization: {
        value: null
    },

    serialization: {
        value: {
            get: function () {
                return this._serialization;
            }
        }
    },

    init: {
        value: function (serialization, _require, objectRequires, locationId) {
            if (typeof serialization === "string") {
                this._serializationString = serialization;
            } else {
                this._serializationString = JSON.stringify(serialization);
            }
            this._require = _require;
            this._locationId = locationId ? locationId.indexOf(_require.location) === 0 ? locationId : _require.location + locationId : locationId;

            this._reviver = new MontageReviver().init(
                _require, objectRequires, this.constructor
            );

            return this;
        }
    },


    /**
     * @param {Object} instances Map-like object of external user objects to
     * link against the serialization.
     * @param {Element} element The root element to resolve element references
     * against.
     * @return {Promise}
     */
    deserialize: {
        value: function (instances, element) {
            var context = this._locationId && MontageDeserializer.moduleContexts.get(this._locationId);
            if (context) {
                if (context._objects.root) {
                    return Promise.resolve(context._objects);
                } else {
                    return Promise.reject(new Error(
                        "Unable to deserialize because a circular dependency was detected. " +
                        "Module \"" + this._locationId + "\" has already been loaded but " +
                        "its root could not be resolved."
                    ));
                }
            }

            try {
                var serialization = JSON.parse(this._serializationString);
                context = new MontageContext()
                    .init(serialization, this._reviver, instances, element, this._require);
                if (this._locationId) {
                    MontageDeserializer.moduleContexts.set(this._locationId, context);
                }
                return context.getObjects();
            } catch (ex) {
                return this._formatSerializationSyntaxError(this._serializationString);
            }
        }
    },

    deserializeObject: {
        value: function(objects) {
            return this.deserialize(objects).then(function(objects) {
                return objects.root;
            });
        }
    },

    preloadModules: {
        value: function () {
            var serialization = JSON.parse(this._serializationString),
                reviver = this._reviver,
                moduleLoader = reviver.moduleLoader,
                i,
                labels,
                label,
                object,
                locationId,
                locationDesc,
                module,
                promises;

            if (serialization !== null) {
                labels = Object.keys(serialization);
                for (i = 0; (label = labels[i]); ++i) {
                    object = serialization[label];
                    locationId = object.prototype || object.object;

                    if (locationId) {
                        if (typeof locationId !== "string") {
                            throw new Error(
                                "Property 'object' of the object with the label '" +
                                label + "' must be a module id"
                            );
                        }
                        locationDesc = MontageReviver.parseObjectLocationId(locationId);
                        module = moduleLoader.getModule(locationDesc.moduleId, label);
                        if (Promise.is(module)) {
                            (promises || (promises = [])).push(module);
                        }
                    }
                }
            }

            if (promises) {
                return Promise.all(promises);
            }
        }
    },

    getExternalObjectLabels: {
        value: function () {
            var serialization = this._serialization,
                labels = [];

            for (var label in serialization) {
                if (Object.keys(serialization[label]).length === 0) {
                    labels.push(label);
                }
            }

            return labels;
        }
    },

    _formatSerializationSyntaxError: {
        value: function (source) {
            var gutterPadding = "   ",
                origin = this._origin,
                message,
                error,
                lines,
                gutterSize,
                line;

            return require.async("core/jshint").then(function (module) {
                if (!module.JSHINT(source)) {
                    error = module.JSHINT.errors[0];
                    lines = source.split("\n");
                    gutterSize = (gutterPadding + lines.length).length;
                    line = error.line - 1;

                    for (var i = 0, l = lines.length; i < l; i++) {
                        lines[i] = (new Array(gutterSize - (i + 1 + "").length + 1)).join(i === line ? ">" : " ") +
                            (i + 1) + " " + lines[i];
                    }
                    message = "Syntax error at line " + error.line +
                        (origin ? " from " + origin : "") + ":\n" +
                        error.evidence + "\n" + error.reason + "\n" +
                        lines.join("\n");
                } else {
                    message = "Syntax error in the serialization but not able to find it!\n" + source;
                }

                throw new Error(message);
            });
        }
    },

    // Deprecated methods

    initWithObject: {
        value: deprecate.deprecateMethod(void 0, function (serialization, _require, objectRequires, locationId, moduleContexts) {
            return this.init(serialization, _require, objectRequires, locationId, moduleContexts);
        }, "initWithObject", "init")
    },

    initWithObjectAndRequire: {
        value: deprecate.deprecateMethod(void 0, function (serialization, _require, objectRequires) {
            return this.init(serialization, _require, objectRequires);
        }, "initWithObjectAndRequire", "init")
    }

}, {
    // Adapted from mr/sandbox
    getModuleRequire: {
        value: function (parentRequire, moduleId) {
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
    },

    _cache: {
        value: null
    },

    moduleContexts: {
        get: function () {
            if (!this._cache) {
                this._cache = new Map();
            }
            return this._cache;
        }
    }
});


MontageDeserializer.defineDeserializationUnit = function (name, funktion) {
    MontageReviver.defineUnitReviver(name, funktion);
};

//deprecated
MontageDeserializer.defineDeserializationUnit("bindings", BindingsModule.deserializeObjectBindings);

exports.deserialize = function (serializationString, _require) {
    return new MontageDeserializer().init(serializationString, _require).deserializeObject();
};
