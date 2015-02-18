var Montage = require("../../core").Montage;
var Interpreter = require("mousse/deserialization/interpreter").Interpreter;
var Deserializer = require("mousse/deserialization/deserializer").Deserializer;
var MontageInterpreter = require("./montage-interpreter").MontageInterpreter;
var MontageReviver = require("./montage-reviver").MontageReviver;
var Promise = require("../../promise").Promise;
var JSHINT = require("../../jshint").JSHINT;

var logger = require("../../logger").logger("montage-deserializer");

var MontageDeserializer = Montage.specialize.call(Deserializer, {
    _interpreter: {value: null},
    _serializationString: {value: null},
    _serialization: {value: null},

    init: {
        value: function (serializationString, _require, objectRequires, origin) {
            if (! this.isSerializationStringValid(serializationString)) {
                throw new Error(
                    this._formatSerializationSyntaxError(serializationString)
                );
            }

            Deserializer.call(this, serializationString);
            this._origin;
            this._serialization = null;
            this._interpreter = new MontageInterpreter()
                .init(_require, objectRequires);

            return this;
        }
    },

    serialization: {
        get: function () {
            var serialization = this._serialization;

            if (!serialization) {
                serialization = JSON.parse(this._serializationString);
                this._serialization = serialization;
            }

            return serialization;
        }
    },

    deserialize: {
        value: function (instances, element) {
            var serialization;

            try {
                serialization = JSON.parse(this._serializationString);
            } catch (error) {
                return Promise.reject(error);
            }

            return this._interpreter.instantiate(
                serialization, instances, element);
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
            var serialization = this.serialization,
                labels = [];

            for (var label in serialization) {
                if (Object.keys(serialization[label]).length === 0) {
                    labels.push(label);
                }
            }

            return labels;
        }
    },

    isSerializationStringValid: {
        value: function (serializationString) {
            try {
                JSON.parse(serializationString);
                return true;
            } catch (ex) {
                return false;
            }
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

            if (!JSHINT(source)) {
                error = JSHINT.errors[0];
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

            return message;
        }
    }

}, {

    defineDeserializationUnit: {
        value: function (name, funktion) {
            MontageReviver.defineUnitReviver(name, funktion);
        }
    }

});

exports.MontageDeserializer = MontageDeserializer;
exports.deserialize = function (serializationString, _require) {
    return new MontageDeserializer().
        init(serializationString, _require)
        .deserializeObject();
};

