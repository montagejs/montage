var Montage = require("../../core").Montage,
    MontageInterpreter = require("./montage-interpreter").MontageInterpreter,
    MontageReviver = require("./montage-reviver").MontageReviver,
    deprecate = require("../../deprecate");

var MontageDeserializer = exports.MontageDeserializer = Montage.specialize({

    _interpreter: {
        value: null
    },

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
        value: function (serializationString, _require, objectRequires) {
            this._serializationString = serializationString;
            this._interpreter = new MontageInterpreter().init(_require, objectRequires);

            return this;
        }
    },

    initWithObject: {
        value: function (serialization, _require, objectRequires) {
            this._serializationString = JSON.stringify(serialization);
            this._interpreter = new MontageInterpreter().init(_require, objectRequires);
            return this;
        }
    },


    initWithObjectAndRequire: {
         value: deprecate.deprecateMethod(void 0, function (serialization, _require, objectRequires) {
            return this.initWithObject(serialization, _require, objectRequires);
        }, "initWithObjectAndRequire", "initWithObject")
    },

    deserialize: {
        value: function (instances, element) {
            try {
              var serialization = JSON.parse(this._serializationString);
            } catch (ex) {
                return this._formatSerializationSyntaxError(this._serializationString);
            }

            return this._interpreter.instantiate(serialization, instances, element);
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
            var serialization = JSON.parse(this._serializationString);

            return this._interpreter.preloadModules(serialization);
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

            return require.async("jshint/dist/jshint").then(function (module) {
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
    }
});


MontageDeserializer.defineDeserializationUnit = function (name, funktion) {
    MontageReviver.defineUnitReviver(name, funktion);
};

exports.deserialize = function (serializationString, _require) {
    return new MontageDeserializer().init(serializationString, _require).deserializeObject();
};
