var RawValueToObjectConverter = require("./raw-value-to-object-converter").RawValueToObjectConverter,
Promise = require("../../core/promise").Promise;
/**
 * @class RawEmbeddedRelationshipValueToObjectConverter
 * @classdesc Converts a property value of raw data to the referenced object.
 * @extends RawValueToObjectConverter
 */
exports.RawEmbeddedValueToObjectConverter = RawValueToObjectConverter.specialize( /** @lends RawEmbeddedValueToObjectConverter# */ {

    /*********************************************************************
     * Properties
     */

    /*********************************************************************
     * Public API
     */

    /**
     * Converts the fault for the relationship to an actual object that has an ObjectDescriptor.
     * @function
     * @param {Property} v The value to format.
     * @returns {Promise} A promise for the referenced object.  The promise is
     * fulfilled after the object is successfully fetched.
     */
    convert: {
        value: function (v) {
            var self = this,
                convertedValue,
                result;

            /*
                besides returning a default value, or a shared "Missing value" singleton, a feature we don't have, there's not much we can do here:
            */
            if(v === null) {
                return Promise.resolveNull;
            } else if( v === undefined) {
                return Promise.resolveUndefined;
            } else return Promise.all([this._descriptorToFetch, this.service]).then(function (values) {
                var typeToFetch = values[0],
                    service = values[1];

                if(Array.isArray(v)) {
                    if(v.length) {
                        convertedValue = [];
                        for(var i=0, countI=v.length, promises;(i<countI);i++) {
                            result =  self._convertOneValue(v[i],typeToFetch, service, convertedValue, i);
                            if (Promise.is(result)) {
                                (promises || (promises = [])).push(result);
                            }
                        }
                        return Promise.all(promises).then(function() {
                            return convertedValue;
                        });
                    }
                    else {
                        return Promise.resolve(v);
                    }
                }
                else {
                    if(v) {
                        return self._convertOneValue(v,typeToFetch, service);
                    }
                }
            });
        }
    },

    _convertOneValue:  {
        value: function (v, typeToFetch, service, valueArray, index) {
            var result = service.resolveObjectForTypeRawData(typeToFetch, v);

            if (result) {
                result = result.then(function (dataObject) {
                    if(valueArray) {
                        //Wondering if we need to do this in a property-change compatible way,
                        //[] direct modification of an Array doesn't send property-changes
                        valueArray[index] = dataObject;
                    }
                    return dataObject;
                });
            }
            else  {
                result = Promise.resolve();
            }
            return result;
        }
    },

    /**
     * Reverts the relationship back to raw data.
     * @function
     * @param {Scope} v The value to revert.
     * @returns {string} v
     */
    revert: {
        value: function (v) {
            var self = this;

            if(!v) {
                return v;
            } else {
                return Promise.all([this._descriptorToFetch, this.service]).then(function (values) {
                    var revertedValue,
                    result,
                    revertedValuePromise;


                    var objectDescriptor = values[0],
                        service = values[1];

                    if(Array.isArray(v)) {
                        if(v.length) {
                            revertedValue = [];
                            for(var i=0, countI=v.length, promises;(i<countI);i++) {
                                result =  self._revertOneValue(v[i],objectDescriptor, service, revertedValue, i);
                                if (Promise.is(result)) {
                                    (promises || (promises = [])).push(result);
                                }
                            }
                            revertedValuePromise =  Promise.all(promises).then(function() {
                                return revertedValue;
                            });
                        }
                        else {
                            revertedValuePromise = Promise.resolve(v);
                        }
                    }
                    else {
                        if(v) {
                            revertedValuePromise = self._revertOneValue(v,objectDescriptor, service);
                        }
                    }

                    if (self.compiledRevertSyntax) {
                        if (Promise.is(revertedValuePromise)) {
                            return revertedValuePromise.then(function(value) {
                                return self._revertValueWithExpression(value);
                            });
                        } else {
                            return self._revertValueWithExpression(revertedValuePromise);
                        }
                    } else {
                        return revertedValuePromise;
                    }
                });
            }
        }
    },

    _revertValueWithExpression: {
        value: function(value) {
            var scope = this.scope;
            //Parameter is what is accessed as $ in expressions
            scope.value = value;
            return Promise.resolve(this.compiledRevertSyntax(scope));
        }
    },

    _revertOneValue:  {
        value: function (v, objectDescriptor, service, valueArray, index) {
            var record = {},
                mapResult = service._mapObjectToRawData(v, record);

            if (Promise.is(mapResult)) {
                return mapResult.then(function(rawData) {
                    if(valueArray) {
                        valueArray[index] = record;
                    }
                    return record;
                });
            } else {
                if(valueArray) {
                    valueArray[index] = record;
                }
                return record;
            }
        }
    }

});
