var RawValueToObjectConverter = require("./raw-value-to-object-converter").RawValueToObjectConverter,
    Criteria = require("core/criteria").Criteria,
    DataQuery = require("data/model/data-query").DataQuery,
    Map = require("core/collections/map").Map,
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


    /*
        cache:

        Map: ObjectDescriptor -> Map: criteriaExpression -> Map: JSON.stringify(criteria.parameters) -> Promise

    */
    _fetchPromiseByObjectDescriptorByCriteriaExpressionByCriteriaParameters: {
        value: new Map()
    },

    _fetchPromiseMapForObjectDescriptor: {
        value: function(objectDescriptor) {
            var map = this._fetchPromiseByObjectDescriptorByCriteriaExpressionByCriteriaParameters.get(objectDescriptor);
            if(!map) {
                map = new Map();
                this._fetchPromiseByObjectDescriptorByCriteriaExpressionByCriteriaParameters.set(objectDescriptor,map);
            }
            return map;
        }
    },

    _fetchPromiseMapForObjectDescriptorCriteria: {
        value: function(objectDescriptor, criteria) {
            var objectDescriptorMap = this._fetchPromiseMapForObjectDescriptor(objectDescriptor),
                criteriaExpressionMap = objectDescriptorMap.get(criteria.expression);
            if(!criteriaExpressionMap) {
                criteriaExpressionMap = new Map();
                objectDescriptorMap.set(criteria.expression,criteriaExpressionMap);
            }
            return criteriaExpressionMap;
        }
    },

    _registeredFetchPromiseMapForObjectDescriptorCriteria: {
        value: function(objectDescriptor, criteria) {
            var criteriaExpressionMap = this._fetchPromiseMapForObjectDescriptorCriteria(objectDescriptor,criteria),
                parametersKey = typeof criteria.parameters === "string" ? criteria.parameters : JSON.stringify(criteria.parameters);

            return fetchPromise = criteriaExpressionMap.get(parametersKey);
        }
    },

    _registerFetchPromiseForObjectDescriptorCriteria: {
        value: function(fetchPromise, objectDescriptor, criteria) {
            var criteriaExpressionMap = this._fetchPromiseMapForObjectDescriptorCriteria(objectDescriptor,criteria),
                parametersKey = typeof criteria.parameters === "string" ? criteria.parameters : JSON.stringify(criteria.parameters);

            return criteriaExpressionMap.set(parametersKey,fetchPromise);
        }
    },
    _unregisterFetchPromiseForObjectDescriptorCriteria: {
        value: function(objectDescriptor, criteria) {
            var criteriaExpressionMap = this._fetchPromiseMapForObjectDescriptorCriteria(objectDescriptor,criteria),
            parametersKey = typeof criteria.parameters === "string" ? criteria.parameters : JSON.stringify(criteria.parameters);

            return criteriaExpressionMap.delete(parametersKey);
        }
    },
    _lookupExistingObjectForObjectDescriptorCriteria: {
        value: function(typeToFetch, criteria, service) {
            var dataIdentifier, existingObject = null;
            /*
            1) dataIdentifierForTypePrimaryKey(type, primaryKey)

            2) objectForDataIdentifier
            */
           /*
            Simplifying assumptions for now:
            if parameters is a string, it's the primary key
            if parameters is an array, it's an array of primaryKeys
            */
            if(typeof criteria.parameters === "string") {
                dataIdentifier = service.dataIdentifierForTypePrimaryKey(typeToFetch,criteria.parameters);
                existingObject = service.rootService.objectForDataIdentifier(dataIdentifier);
            } else if(Array.isArray(criteria.parameters)) {
                var rootService = service.rootService,
                    array = criteria.parameters, i=0, countI = array.length, iObject;

                for(; (i<countI); i++) {
                    dataIdentifier = service.dataIdentifierForTypePrimaryKey(typeToFetch,array[i]);
                    iObject = rootService.objectForDataIdentifier(dataIdentifier);
                    if(iObject) {
                        //Add to result
                        (existingObject || (existingObject = [])).push(iObject);
                        //remove from criteria since found
                        array.splice(i,1);
                    }
                }

            }
            return existingObject;
        }
    },
    _fetchConvertedDataForObjectDescriptorCriteria: {
        value: function(typeToFetch, criteria) {
            var self = this;

            return this.service ? this.service.then(function (service) {

                var localResult = self._lookupExistingObjectForObjectDescriptorCriteria(typeToFetch, criteria, service),
                //var localResult,
                    localPartialResultPromise;

                if(localResult) {
                    if(Array.isArray(localResult)) {
                        if(criteria.parameters.length > 0) {
                            if(localResult.length) {
                                //We found some locally but not all
                                localPartialResultPromise = Promise.resolve(localResult);
                            } else {
                                //we didn't find anything locally
                                localPartialResultPromise = null;
                            }
                        } else {
                            //We found everything locally, we're done:
                            return Promise.resolve(localResult);
                        }

                    } else {
                        //We found it, we're done:
                        return Promise.resolve(localResult);
                    }
                }


                if (self.serviceIdentifier) {
                    criteria.parameters.serviceIdentifier = this.serviceIdentifier;
                }

                var fetchPromise = self._registeredFetchPromiseMapForObjectDescriptorCriteria(typeToFetch,criteria);

                if(!fetchPromise) {
                    var query = DataQuery.withTypeAndCriteria(typeToFetch, criteria);

                /*
                    When we fetch objects that have inverse relationships on each others none can complete their mapRawDataProcess because the first one's promise for mapping the relationship to the second never commpletes because the second one itself has it's raw data the foreignKey to the first and attemps to do so by default on processing operations, where the previous way was only looping on requisite proprties. If both relationships were requisite, on each side we'd end up with the same problem.

                    When the second try to map it's foreignKey relationship back to the first, the first exists, and is being mapped, which we can know by checking:
                            if(!this.service._objectsBeingMapped.has(object)) {}

                    So let's try to find a local object that we may already have. This is a specific converter to resolve foreign keys, but we should be able to run the criteria on all local instances' snapshots. We don't have right now an indexation of the snapshots by type, just by dataIdentifier.

                    However, we could start by identifying if the criteria's property involves the typeToFetch's primary key.

                    We also now know currentRule = this.currentRule;

                    Quick draft bellow, un-tested to be refined and continued to.

                    One more thought that's been on my mind. We want to leverage indexedDB anyway so the app has data offline as needed, or to be able to do edge machine learning or keep private data there. If we need to build an index to find objects known client side, we might be able to kill 2 birds with one stone to look for them in the indexedDB directly, where we wou;d build index to match foreign relationships etc...
                */

                /*

                var criteria = query.criteria;

                if(criteria.syntax.type === "equals") {
                    var args = criteria.syntax.args,
                        parameters = criteria.parameters,
                        parameterValue,
                        propertySyntax;

                        // propertySyntax = args[0].type === "property"
                        //     ? args[0]
                        //     : args[1].type === "property"
                        //         ? args[1]
                        //         : null;
                    if(args[0].type === "property") {
                        if(args[1].type === "parameters") {
                            //parameterSyntax = args[1];
                            parameterValue = parameters;
                            propertySyntax = args[0];
                        } else if(args[1].type === "property") {
                            if(args[1].args[0].type === "parameters") {
                                parameterValue = parameters[args[1].args[1].value];
                                propertySyntax = args[0];
                            } else {
                                parameterValue = parameters[args[0].args[1].value];
                                propertySyntax = args[1];
                            }
                        }
                    } else if(args[1].type === "property") {
                        if(args[0].type === "parameters") {
                            //parameterSyntax = args[1];
                            parameterValue = parameters;
                            propertySyntax = args[1];
                        } else if(args[0].type === "property") {
                            if(args[0].args[0].type === "parameters") {
                                parameterValue = parameters[args[0].args[1].value];
                                propertySyntax = args[1];
                            } else {
                                parameterValue = parameters[args[1].args[1].value];
                                propertySyntax = args[0];
                            }
                        }
                    }

                    if(propertySyntax) {
                        var propertyArgs = propertySyntax.args,
                            propertyName = propertyArgs[0].type === "literal"
                                ? propertyArgs[0].value
                                : propertyArgs[1].type === "literal"
                                    ? propertyArgs[1].value
                                    : null;

                        if(propertyName && self._owner.rawDataPrimaryKeys.indexOf(propertyName) !== -1) {
                            //Our criteria is about a primary key, let's find the value:
                            var primaryKeyValue = parameterValue;

                        }
                    }
                }

                */

                    fetchPromise = service.rootService.fetchData(query)
                            .then(function(value) {
                                self._unregisterFetchPromiseForObjectDescriptorCriteria(typeToFetch, criteria);
                                return value;
                            });

                    self._registerFetchPromiseForObjectDescriptorCriteria(fetchPromise, typeToFetch, criteria);
                }

                if(localPartialResultPromise) {
                    fetchPromise = Promise.all([localPartialResultPromise,fetchPromise]);
                }

                return fetchPromise;
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
            var criteria = new Criteria().initWithSyntax(this.convertSyntax, value);
            criteria._expression = this.convertExpression;
            return criteria;
        }
    },

    __foreignDescriptorMappingsByObjectyDescriptor: {
        value: undefined
    },
    _foreignDescriptorMappingsByObjectyDescriptor: {
        get: function() {
            if(!this.__foreignDescriptorMappingsByObjectyDescriptor) {
                for(var i=0, mappings = this.foreignDescriptorMappings, countI = mappings.length, iMapping, mappingByObjectDescriptor = new Map();(i<countI);i++) {
                    mappingByObjectDescriptor.set(mappings[i].type,mappings[i]);
                }
                this.__foreignDescriptorMappingsByObjectyDescriptor = mappingByObjectDescriptor;
            }
            return this.__foreignDescriptorMappingsByObjectyDescriptor;
        }
    },

    rawDataTypeMappingForForeignDescriptor: {
        value: function(anObjectDescriptor) {
            return this._foreignDescriptorMappingsByObjectyDescriptor.get(anObjectDescriptor);
        }
    },

    _convertFetchPromisesByValue: {
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

    convert: {
        value: function (v) {

            if((v && !(v instanceof Array )) || (v instanceof Array && v.length > 0)) {
                var self = this,
                criteria,
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

                    } else {
                        /*
                            if valueDescriptor were a Promise, we'd have a problem.
                            Keep an eye on that.
                        */
                        var valueDescriptor = this.foreignDescriptorForValue(v),
                            rawDataProperty = self.rawDataPropertyForForeignDescriptor(valueDescriptor),
                            foreignKeyValue = v[rawDataProperty],
                            aCriteria = this.convertCriteriaForValue(foreignKeyValue);

                        return this._fetchConvertedDataForObjectDescriptorCriteria(valueDescriptor, aCriteria);
                    }

                } else {
                    criteria = this.convertCriteriaForValue(v);

                    // console.log("RawForeignValueToObjectConverter fetching for value:",v);

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

    _rawDataPropertyByForeignDescriptor: {
        value: undefined
    },
    rawDataPropertyForForeignDescriptor: {
        value: function(anObjectDescriptor) {
            var rawProperty;

            if(!anObjectDescriptor) return null;

            if(!this._rawDataPropertyByForeignDescriptor) {
                this._rawDataPropertyByForeignDescriptor = new Map();
            } else {
                rawProperty = this._rawDataPropertyByForeignDescriptor.get(anObjectDescriptor);
            }

            if(!rawProperty) {
                var rawDataTypeMapping = this.rawDataTypeMappingForForeignDescriptor(anObjectDescriptor),
                    rawDataTypeMappingExpressionSyntax = rawDataTypeMapping.expressionSyntax;

                /*
                    Assuming the raw-data-type-mapping expressions are of the form: "aForeignKeyId.defined()"
                */

                if(rawDataTypeMappingExpressionSyntax.type === "defined" && rawDataTypeMappingExpressionSyntax.args[0].type === "property") {
                    rawProperty = rawDataTypeMappingExpressionSyntax.args[0].args[1].value;

                    this._rawDataPropertyByForeignDescriptor.set(anObjectDescriptor,rawProperty);

                } else {
                    console.error("Couldn't map mapObjectPropertyToRawProperty with rawDataTypeMappingExpressionSyntax", object, property, rawDataTypeMappingExpressionSyntax);
                }
            }

            return rawProperty;

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
                    var self = this,
                        //We put it in a local variable so we have the right value in the closure
                        currentRule = this.currentRule;
                    return this.service ? this.service.then(function (service) {

                        if(v instanceof Array) {
                            var result=[];
                            //forEach skipps over holes of a sparse array
                            v.forEach(function(value) {
                                /*
                                    Make sure we have a valid data object anf not null nor undefined before  trying to get their primary key
                                */
                                if(value) {
                                    result.push(service.dataIdentifierForObject(value).primaryKey);
                                }
                            });
                            currentRule = null;
                            return result;
                        }
                        else {
                            if(self.foreignDescriptorMappings) {
                                var valueObjectDescriptor = service.objectDescriptorForObject(v),
                                    rawDataProperty = self.rawDataPropertyForForeignDescriptor(valueObjectDescriptor);

                                if(rawDataProperty === currentRule.targetPath) {
                                    currentRule = null;
                                    return service.dataIdentifierForObject(v).primaryKey;
                                } else {
                                    currentRule = null;
                                    return undefined;
                                }
                            } else {
                                currentRule = null;
                                return service.dataIdentifierForObject(v).primaryKey;
                            }
                        }

                    }) : (currentRule = null) && Promise.resolve(service.dataIdentifierForObject(v).primaryKey);
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
