var Converter = require("./converter").Converter,
    Promise = require("core/promise").Promise;


exports.PipelineConverter = Converter.specialize({


    /********************************************
     * Serialization
     */

    deserializeSelf: {
        value: function (deserializer) {
            this.converters = deserializer.getProperty("converters");
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
            return this._convertWithNextConverter(value, 0);
        }
    },

    _convertWithNextConverter: {
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
                if (this.converters[0].isRolesConverter) {
                    debugger;
                }
                result = output.then(function (value) {
                    if (self.converters[0].isRolesConverter) {
                        debugger;
                    }
                    return self._convertWithNextConverter(value, index);
                });
            } else {
                result = this._convertWithNextConverter(output, index);
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
            return this._revertWithNextConverter(value, this.converters.length - 1);
        }
    },

    _revertWithNextConverter: {
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
                    return self._revertWithNextConverter(value, index);
                });
            } else {
                result = this._revertWithNextConverter(output, index);
            }

            return result;
        }
    }

});
