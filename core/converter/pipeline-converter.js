var Converter = require("./converter").Converter,
    Promise = require("core/promise").Promise;


exports.PipelineConverter = Converter.specialize({

    _convertWithNextConverter: {
        value: function (input, converters) {
            var self = this,
                converter = converters.shift(),
                output = converter.convert(input),
                isFinalOutput = converters.length === 0,
                isPromise = this._isThenable(output),
                result;

            if (isFinalOutput) {
                result = isPromise ? output : Promise.resolve(output);
            } else if (isPromise) {
                result = output.then(function (value) {
                    return self._convertWithNextConverter(value, converters);
                });
            } else {
                result = this._convertWithNextConverter(output, converters);
            }

            return result;
        }
    },

    _isThenable: {
        value: function (value) {
            return !!(value && value.then && typeof value.then === "function");
        }
    },

    _revertWithNextConverter: {
        value: function (input, converters) {
            var self = this,
                converter = converters.pop(),
                output = converter.revert(input),
                isFinalOutput = converters.length === 0,
                isPromise = this._isThenable(output),
                result;

            if (isFinalOutput) {
                result = isPromise ? output : Promise.resolve(output);
            } else if (isPromise) {
                result = output.then(function (value) {
                    return self._revertWithNextConverter(value, converters);
                });
            } else {
                result = this._revertWithNextConverter(output, converters);
            }

            return result;
        }
    },

    convert: {
        value: function (value) {
            return this._convertWithNextConverter(value, this.converters.slice());
        }
    },

    converters: {
        value: undefined
    },

    deserializeSelf: {
        value: function (deserializer) {
            this.converters = deserializer.getProperty("converters");
        }
    },


    revert: {
        value: function (value) {
            return this._revertWithNextConverter(value, this.converters.slice());
        }
    }

});
