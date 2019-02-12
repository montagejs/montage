var ExpressionDataMappingConverter = require("./expression-data-mapping-converter").ExpressionDataMappingConverter,
Criteria = require("core/criteria").Criteria,
DataQuery = require("data/model/data-query").DataQuery,
ObjectDescriptorReference = require("core/meta/object-descriptor-reference").ObjectDescriptorReference,
Promise = require("core/promise").Promise,
Scope = require("frb/scope"),
parse = require("frb/parse"),
compile = require("frb/compile-evaluator");

/**
 * @class RawEmbeddedRelationshipValueToObjectConverter
 * @classdesc Converts a property value of raw data to the referenced object.
 * @extends ExpressionDataMappingConverter
 */
exports.RawEmbeddedValueToObjectConverter = ExpressionDataMappingConverter.specialize( /** @lends RawPropertyValueToObjectConverter# */ {

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
                result,
                criteria = this.convertSyntax
                                ? new Criteria().initWithSyntax(self.convertSyntax, v)
                                : null,
                query;



            return Promise.all([this._descriptorToFetch, this.service]).then(function (values) {
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
                        return this._convertOneValue(v,typeToFetch, service);
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
                result = Promise.resolve(undefined);
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
            if (v) {
                if (!this.compiledRevertSyntax) {
                    return Promise.resolve(v);
                } else {
                    var scope = this.scope;
                    //Parameter is what is accessed as $ in expressions
                    scope.value = v;
                    return Promise.resolve(this.compiledRevertSyntax(scope));
                }

            }
            return Promise.resolve(undefined);
        }
    }

});
