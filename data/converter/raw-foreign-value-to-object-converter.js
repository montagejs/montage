var RawValueToObjectConverter = require("./raw-value-to-object-converter").RawValueToObjectConverter,
    Criteria = require("core/criteria").Criteria,
        DataQuery = require("data/model/data-query").DataQuery,
    Promise = require("core/promise").Promise;
/**
 * @class RawForeignValueToObjectConverter
 * @classdesc Converts a property value of raw data to the referenced object.
 * @extends RawValueToObjectConverter
 */
exports.RawForeignValueToObjectConverter = RawValueToObjectConverter.specialize( /** @lends RawForeignValueToObjectConverter# */ {


    /*********************************************************************
     * Serialization
     */

    serializeSelf: {
        value: function (serializer) {

            this.super(serializer);

            serializer.setProperty("foreignDescriptorMappings", this.foreignDescriptorMappings);

        }
    },

    deserializeSelf: {
        value: function (deserializer) {

            this.super(deserializer);

            var value = deserializer.getProperty("foreignDescriptorMappings");
            if (value) {
                this.foreignDescriptorMappings = value;
            }

        }
    },

    /**
     * foreignDescriptorMappings enables the converter to handle polymorphic relationships
     * where the object that need to be found from a foreign key can be of different type,
     * and potentially be stored in different raw-level storage, diffferent table in a database
     * or different API endpoint. The arrau contains RawDataTypeMappings which have an expression,
     * which if it evaluates as true on a value means this RawDataTypeMapping's object descriptor
     * should be used. When present, the converter will evaluate the value passed,
     * in polyporphic case a record like:
     * {
     *      foreignKeyOfTypeA: null,
     *      foreignKeyOfTypeB: "foreign-key-value",
     *      foreignKeyOfTypeC: null
     * }
     *
     * Only one of those properties can be not null at a time
     *
     * @type {?Array<RawDataTypeMapping>}
     * */

    foreignDescriptorMappings: {
        value: undefined
    },

    /*********************************************************************
     * Public API
     */

    /**
     * Converts the fault for the relationship to an actual object that has an ObjectDescriptor.
     * @function
     * @param {Property} v The value to format.
     * @returns {Promise} A promise for the referenced object.  The promise is
     * fulfilled after the object is successfully fetched.
     *
     */

    _fetchConvertedDataForObjectDescriptorCriteria: {
        value: function(typeToFetch, criteria) {
            if (this.serviceIdentifier) {
                criteria.parameters.serviceIdentifier = this.serviceIdentifier;
            }

            var query = DataQuery.withTypeAndCriteria(typeToFetch, criteria);

            return this.service ? this.service.then(function (service) {
                return service.rootService.fetchData(query);
            }) : null;

        }
    },

    /**
     * Uses foreignDescriptorMappings to find an ObjectDescriptor that matches
     * the passed raw data, delegating to iindividual RawDataTypeMappings
     * the job of assessing if their condition match the raw data or not.
     *
     * Such expression might consider a combination of raw data key/value,
     * an type property, a mutually exclusive list of potential foreignKeys,
     * and eventually one foreign primary key if it were to contain the type of
     * the data it represents.
     *
     * @method
     * @argument {Object} value The raw data to evaluate.
     * @returns {ObjectDescriptor} An ObjectDescriptor if one is found or null.
     *
     */

    foreignDescriptorForValue: {
        value: function(value) {

            for(var i=0, mappings = this.foreignDescriptorMappings, countI = mappings.length, iMapping;(i<countI);i++) {
                if(mappings[i].match(value)) {
                    return mappings[i].type;
                }
            }
            return null;
        }
    },

    convertCriteriaForValue: {
        value: function(value) {
            return new Criteria().initWithSyntax(this.convertSyntax, value);
        }
    },

    convert: {
        value: function (v) {

            if((v && !(v instanceof Array )) || (v instanceof Array && v.length > 0)) {
                var self = this,
                criteria = this.convertCriteriaForValue(v),
                query;

                if(this.foreignDescriptorMappings) {
                    /*
                        Needs to loop on the mapping and evaluate value. If v is an array, it's possible
                        there could be foreignKeys in that array going to different ObjectDescriptor
                        and therefore requiring different queries, but there could be multiple of the same kind. So we need to loop on values and group by it before building a criteria for each.
                    */

                    if((v instanceof Array )) {
                        var i, countI, iValue, iValueDescriptor, groupMap = new Map(), iGroupValue;
                        for(i=0, countI = v.length;(i<countI);i++) {
                            iValue = v[i];
                            iValueDescriptor = this.foreignDescriptorForValue(iValue);
                            if(!iValueDescriptor) {
                                console.warn("Didn't find a RawDataTypeMapping matching rawData to convert:",this.foreignDescriptorMappings,iValue);
                            } else {
                                iGroupValue = groupMap.get(iValueDescriptor);
                                if(!iGroupValue) {
                                    groupMap.set(iValueDescriptor, (iGroupValue = []))
                                }
                                iGroupValue.push(iValue);
                            }
                        }

                        //Now walk the map and build the queries:
                        var mapIterator = groupMap.keys(),
                            anObjectDescriptor,
                            promises = [],
                            aCriteria;
                        while (anObjectDescriptor = mapIterator.next().value) {
                            aCriteria = this.convertCriteriaForValue(groupMap.get(anObjectDescriptor));
                            promises.push(this._fetchConvertedDataForObjectDescriptorCriteria(anObjectDescriptor, aCriteria));

                        }

                        return Promise.all(promises).then(function(fetchResults) {
                            //each fetchResults contains a DataStream. So we need to gather each dataStream's data into one array.
                            var result = [], i, countI, iDataStream;

                            for(i=0, countI = fetchResults.length;(i<countI); i++) {
                                result.push(fetchResults[i].data);
                            }

                            return result;
                        })

                    }

                } else {
                    return this._descriptorToFetch.then(function (typeToFetch) {

                        return self._fetchConvertedDataForObjectDescriptorCriteria(typeToFetch, criteria);

                        // if (self.serviceIdentifier) {
                        //     criteria.parameters.serviceIdentifier = self.serviceIdentifier;
                        // }

                        // query = DataQuery.withTypeAndCriteria(typeToFetch, criteria);

                        // return self.service ? self.service.then(function (service) {
                        //     return service.rootService.fetchData(query);
                        // }) : null;
                    });
                }
            }
            else {
                return Promise.resolve(null);
            }
        }
    },



    /**
     * Reverts the relationship back to raw data.
     * @function
     * @param {Scope} v The value to revert.
     * @returns {Promise} v
     */
    revert: {
        value: function (v) {
            if (v) {
                //No specific instruction, so we return the primary keys using default assumptions.
                if (!this.compiledRevertSyntax) {
                    return this.service ? this.service.then(function (service) {

                        if(v instanceof Array) {
                            var result=[];
                            //forEach skipps over holes of a sparse array
                            v.forEach(function(value) {
                                result.push(service.dataIdentifierForObject(value).primaryKey);
                            });
                            return result;
                        }
                        else {
                            return service.dataIdentifierForObject(v).primaryKey;
                        }

                    }) : Promise.resolve(v);
                } else {
                    var scope = this.scope;
                    //Parameter is what is accessed as $ in expressions
                    scope.parameters = v;
                    scope.value = this;
                    return Promise.resolve(this.compiledRevertSyntax(scope));
                }

            }
            return Promise.resolve();
        }
    }

});
