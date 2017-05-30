var Converter = require("./converter").Converter,
    Promise = require("core/promise").Promise;


exports.PipelineConverter = Converter.specialize({

    converters: {
        value: undefined
    },

    convert: {
        value: function (value) {
            return this._convertWithNextConverter(value, this.converters.slice());
        }
    },

    _convertWithNextConverter: {
        value: function (input, converters) {
            var self = this,
                converter = converters.shift(),
                output = converter.convert(input),
                result;

            if (converters.length) {
                output = output instanceof Promise ? output : Promise.resolve(output);
                result = output.then(function (value) {
                            return self._convertWithNextConverter(value, converters);
                         });
            } else {
                result = output instanceof Promise ? output : Promise.resolve(output);
            }

            return result;
        }
    },

    revert: {
        value: function (v) {
            return v;
        }
    }

});
