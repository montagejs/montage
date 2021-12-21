/**
 * @module montage/core/converter/key-value-array-to-map-converter
 * @requires montage/core/converter/converter
 */
var Converter = require("./converter").Converter,
    Promise = require("../../core/promise").Promise;


/**
 * @class ArrayToMapConverter
 * @classdesc Converts key/value arrays or an array of pairs to a Map.
 * @extends Converter
 */
exports.KeyValueArrayToMapConverter = Converter.specialize( /** @lends ArrayToMapConverter# */ {
    /*********************************************************************
     * Serialization
     */

    serializeSelf: {
        value: function (serializer) {

            serializer.setProperty("convertedValueDescriptor", this.convertedValueDescriptor);
            serializer.setProperty("keysConverter", this.keysConverter);
            serializer.setProperty("valuesConverter", this.valuesConverter);

        }
    },
    deserializeSelf: {
        value: function (deserializer) {
            var value = deserializer.getProperty("convertedValueDescriptor");
            if (value) {
                this.convertedValueDescriptor = value;
            }

            value = deserializer.getProperty("keysConverter");
            if (value) {
                this.keysConverter = value;
            }
            value = deserializer.getProperty("valuesConverter");
            if (value) {
                this.valuesConverter = value;
            }
        }
    },

    /**
     * @type {ObjectDescriptor}
     * @default {Converter} undefined
     */
    convertedValueDescriptor: {
        value: undefined
    },

    /**
     * @type {Converter}
     * @default {Converter} undefined
     */
    keysConverter: {
        value: undefined
    },

    /**
     * @type {Converter}
     * @default {Converter} undefined
     */
    valuesConverter: {
        value: undefined
    },

    /**
     * @function
     * @param {object} value - object expected to have a keys and a values properties, or an array in whcih case we expect pairs.
     * @returns {string} The formatted currency value.
     */
    convert: {
        value: function (value) {
            var keys, values,
                convertedValue,
                convertedValueType = this.convertedValueDescriptor.object,
                convertedKeys,
                convertedValues,
                promises;


            if(value) {
                if(Array.isArray(value)) {
                    /*
                        We expect an array ok key/value pairs, per
                        https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/Map

                        constructor.

                        If we have a converter, we need to iterate.
                        For efficiency, we should group all values, convert, and then re-assign matching the pairs.

                        We might need a setting to be explicit about that.
                    */
                    if(this.keysConverter || this.valuesConverter) {

                        keys = [];
                        values = [];

                        for(var i=0, countI = value.length; (i<countI); i++) {
                            keys.push(value[i][0]);
                            values.push(value[i][1]);
                        }

                    } else {
                        return new Map(value);
                    }
                } else {


                    if(!value.hasOwnProperty("keys")) {
                        throw "KeyValueArrayToMapConverter couldn't find keys property in value to convert";
                    }
                    if(!value.hasOwnProperty("values")) {
                        throw "KeyValueArrayToMapConverter couldn't find values property in value to convert";
                    }

                    if(convertedValueType === Object && value.keys && typeof value.keys[0] !== "string") {
                        throw "KeyValueArrayToMapConverter can't create an Object-based map with keys that aren't string";
                    }

                    keys = value.keys;
                    values = value.values;
                }

                if(this.keysConverter) {
                    convertedKeys = this._convertValuesWithConverter(keys,this.keysConverter);
                } else {
                    convertedKeys = keys;
                }

                if(this.valuesConverter) {
                    convertedValues = this._convertValuesWithConverter(values,this.valuesConverter);
                } else {
                    convertedValues = values;
                }

                if(Promise.is(convertedKeys) || Promise.is(convertedValues)) {

                    if(Promise.is(convertedKeys)) {
                        (promises || (promises = []).push(convertedKeys));
                    } else {
                        (promises || (promises = []).push(Promise.resolve(convertedKeys)));
                    }

                    if(Promise.is(convertedValues)) {
                        (promises || (promises = []).push(convertedValues));
                    } else {
                        (promises || (promises = []).push(Promise.resolve(convertedValues)));
                    }

                    return Promise.all(promises)
                    .then((resolvedValues) => {
                        var resolvedKeys = resolvedValues[0],
                        resolvedValues = resolvedValues[1];

                        return this._createConvertedValue(resolvedKeys,resolvedValues);
                    });
                } else {
                    return this._createConvertedValue(convertedKeys,convertedValues);
                }
            }
            else {
                return this._createConvertedValue(null,null);
            }
        }
    },

    _createConvertedValue: {
        value: function(keys, values) {
            var convertedValueType = this.convertedValueDescriptor.object,
                isConvertingToObject = convertedValueType === Object,
                convertedValue = isConvertingToObject ? Object.create(null) : new Map(),
                i, countI;

            if(keys) {
                for(i=0, countI = keys.length; (i<countI); i++) {
                    if(isConvertingToObject) {
                        convertedValue[keys[i]] = values[i];
                    } else {
                        convertedValue.set(keys[i],values[i]);
                    }
                }
            }
            return convertedValue;
        }
    },

    _convertValuesWithConverter: {
        value: function(values, aConverter) {
            var convertedValues;

            if(aConverter) {
                if(aConverter.canConvertValueArray) {
                    convertedValues = aConverter.convert(values);
                } else if(values) {
                    var i, countI, iValue, iConvertedValue, hasPromise = false, hasNonPromise = false, hasMix = false, mixSolved = false, iConvertedValuePromise;

                    convertedValues = [];
                    for(i=0, countI = values.length; (i<countI); i++) {
                        iConvertedValue = aConverter.convert(values[i]);
                        if((iConvertedValuePromise = Promise.is(iConvertedValue))) {
                            hasPromise = true;
                            if(hasNonPromise) {
                                hasMix = true;
                            }
                        } else {
                            hasNonPromise = true;
                            if(hasPromise) {
                                hasMix = true;
                            }
                        }

                        if(hasMix && !mixSolved) {
                            //go back and fix it:
                            for(var j=0, countJ = convertedValues.length; (j < countJ); j++) {
                                if(!Promise.is(convertedValues[j] = Promise.resolve())) {
                                    convertedValues[j] = Promise.resolve(onvertedValues[j]);
                                }
                            }
                        }

                        if(hasPromise && !iConvertedValuePromise) {
                            iConvertedValue = Promise.resolve(iConvertedValue);
                        }

                        convertedValues.push(iConvertedValue);
                    }
                } else {
                    convertedValues = values;
                }
            } else {
                convertedValues = values;
            }
            return convertedValues;
        }
    },

    /**
     * Optionally, reverts values from the output range, back into the input
     * range. This may not be possible with high fidelity depending on the
     * relationship between these domains.
     * @function
     * @default null
     */
    // revert: {
    //     enumerable: false,
    //     value: function(value) {
    //         var convertedValueType = this.convertedValueDescriptor.object,
    //             isConvertingToObject = convertedValueType === Object,
    //             revertedKeys = [],
    //             revertedValues = [],
    //             i, countI;

    //         if(isConvertingToObject) {
    //             var keys = Object.keys(value);

    //             for(i=0, countI = keys.length; (i<countI); i++) {
    //                 if(isConvertingToObject) {
    //                     convertedValue[keys[i]] = values[i];
    //                 } else {
    //                     convertedValue.set(keys[i],values[i]);
    //                 }
    //             }

    //         } else {
    //             var keyIterator = value.keys();

    //             while(keyIterator.next().value) {

    //             }
    //         }
    //     }
    // }

});

