var Converter = require("./converter").Converter,
    Promise = require("core/promise").Promise;


exports.PipelineConverter = Converter.specialize({


    /********************************************
     * Serialization
     */

    deserializeSelf: {
        value: function (deserializer) {
            var value;
            value = deserializer.getProperty("converters");
            if (value !== void 0) {
                this.converters = value;
            }
        }
    },

    serializeSelf: {
        value: function (serializer) {
            if (this.converters.length > 0) {
                serializer.setProperty("converters", this.converters);
            }
        }
    },

    /********************************************
     * Convert/Revert
     */

    converters: {
        value: undefined
    },

    convert: {
        value: function (value) {
            return this._convertWithConverterAtIndex(value, 0);
        }
    },

    _convertWithConverterAtIndex: {
        value: function (input, index) {
            var self = this,
                converter = this.converters[index],
                output = converter.convert(input),
                isFinalOutput = index === (this.converters.length - 1),
                isPromise = this._isThenable(output),
                result;

            index++;



            if (isFinalOutput) {
                result = isPromise ? output : Promise.resolve(output);
            } else if (isPromise) {
                result = output.then(function (value) {
                    return self._convertWithConverterAtIndex(value, index);
                });
            } else {
                result = this._convertWithConverterAtIndex(output, index);
            }

            return result;
        }
    },

    _isThenable: {
        value: function (value) {
            return !!(value && value.then && typeof value.then === "function");
        }
    },


    revert: {
        value: function (value) {
            return this._revertWithConverterAtIndex(value, this.converters.length - 1);
        }
    },

    _revertWithConverterAtIndex: {
        value: function (input, index) {
            var self = this,
                converter = this.converters[index],
                output = converter.revert(input),
                isFinalOutput = index === 0,
                isPromise = this._isThenable(output),
                result;

            index--;

            if (isFinalOutput) {
                result = isPromise ? output : Promise.resolve(output);
            } else if (isPromise) {
                result = output.then(function (value) {
                    return self._revertWithConverterAtIndex(value, index);
                });
            } else {
                result = this._revertWithConverterAtIndex(output, index);
            }

            return result;
        }
    }

});
