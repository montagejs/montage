var DataMapping = require("./data-mapping").DataMapping,
    assign = require("frb/assign"),
    compile = require("frb/compile-evaluator"),
    DataService = require("data/service/data-service").DataService,
    ObjectDescriptorReference = require("core/meta/object-descriptor-reference").ObjectDescriptorReference,
    parse = require("frb/parse"),
    Map = require("collections/map"),
    MappingRule = require("data/service/mapping-rule").MappingRule,
    Promise = require("core/promise").Promise,
    Scope = require("frb/scope"),
    Set = require("collections/set"),
    deprecate = require("core/deprecate");

var Montage = require("montage").Montage;

var ONE_WAY_BINDING = "<-";
var TWO_WAY_BINDING = "<->";

/**
 * Maps raw data to data objects, using FRB expressions, of a specific type.
 *
 * TODO: Write more thorough description.
 *
 * @class
 * @extends external:DataMapping
 */
exports.ExpressionDataMapping = DataMapping.specialize(/** @lends ExpressionDataMapping.prototype */ {

    /***************************************************************************
     * Initialization
     */


    /**
     * @param   {ObjectDescriptor} objectDescriptor       - the definition of the objects
     *                                   mapped by this mapping.
     * @param   {DataService} service  - the data service this mapping should use.
     * @return itself
     */
    initWithServiceObjectDescriptorAndSchema: {
        value: function (service, objectDescriptor, schema) {
            this.service = service;
            this.objectDescriptor = objectDescriptor;
            this.schemaDescriptor = schema;
            return this;
        }
    },


    /***************************************************************************
     * Serialization
     */

    serializeSelf: {
        value: function (serializer) {
            // serializer.setProperty("name", this.name);
            // if ((this._model) && (!this.model.isDefault)) {
            //     serializer.setProperty("model", this._model, "reference");
            // }
            //
            // if (this.objectDescriptorInstanceModule) {
            //     serializer.setProperty("objectDescriptorModule", this.objectDescriptorInstanceModule);
            // }
        }
    },

    deserializeSelf: {
        value: function (deserializer) {
            var value = deserializer.getProperty("objectDescriptor"),
                self = this,
                hasReferences = false,
                result = this;
            if (value instanceof ObjectDescriptorReference) {
                this.objectDescriptorReference = value;
                hasReferences = true;
            } else {
                this.objectDescriptor = value;
            }

            this.schemaReference = deserializer.getProperty("schema");
            if (this.schemaReference) {
                hasReferences = true;
            }

            value = deserializer.getProperty("requisitePropertyNames");
            if (value) {
                this.addRequisitePropertyName.apply(this, value);
            }

            value = deserializer.getProperty("rawDataPrimaryKeys");
            if (value) {
                this.rawDataPrimaryKeys = value;
            }

            if (hasReferences) {
                result = this.resolveReferences().then(function () {
                    value = deserializer.getProperty("objectMapping");
                    if (value) {
                        self._rawOwnObjectMappingRules = value.rules;
                    }
                    value = deserializer.getProperty("rawDataMapping");
                    if (value) {
                        self._rawOwnRawDataMappingRules = value.rules;
                    }
                    return self;
                });
            } else {
                value = deserializer.getProperty("objectMapping");
                if (value) {
                    self._rawOwnObjectMappingRules = value.rules;
                }
                value = deserializer.getProperty("rawDataMapping");
                if (value) {
                    self._rawOwnRawDataMappingRules = value.rules;
                }
            }
            return result;
        }
    },


    resolveReferences: {
        value: function () {
            var self = this;
            return this._resolveObjectDescriptorReferenceIfNecessary().then(function () {
                return self._resolveSchemaReferenceIfNecessary();
            });
        }
    },

    _resolveObjectDescriptorReferenceIfNecessary: {
        value: function () {
            var self = this,
                requiresInitialization = !this.objectDescriptor && this.objectDescriptorReference,
                promise = requiresInitialization ?  this.objectDescriptorReference :
                                                    Promise.resolve(null);
            return promise.then(function (objectDescriptor) {
                if (objectDescriptor) {
                    self.objectDescriptor = objectDescriptor;
                }
                return null;
            });
        }
    },

    _resolveSchemaReferenceIfNecessary: {
        value: function () {
            var self = this,
                requiresInitialization = !this.schemaDescriptor && this.schemaDescriptorReference,
                promise = requiresInitialization ?  this.schemaDescriptorReference :
                    Promise.resolve(null);
            return promise.then(function (objectDescriptor) {
                if (objectDescriptor) {
                    self.schemaDescriptor = objectDescriptor;
                }
                return null;
            });
        }
    },


    /***************************************************************************
     * Properties
     */

     /**
     * The scope against which rule expressions will be evaluated
     * @type {Scope}
     */

    __scope: {
        value: null
    },

    _scope: {
        get: function() {
            return this.__scope || new Scope();
        }
    },

    /***************************************************************************
     * Schema
     */

    /**
     * The descriptor of the objects that are mapped to by this
     * data mapping.
     * @type {ObjectDescriptor}
     */
    objectDescriptor: {
        get: function () {
            return this._objectDescriptor;
        },
        set: function (value) {
            this._objectDescriptor = value;
            this._objectDescriptorReference = new ObjectDescriptorReference().initWithValue(value);
        }
    },

    /**
     * A reference to the object descriptor that is used
     * by this mapping.  Used by serialized data mappings.
     * @type {ObjectDescriptorReference}
     */
    objectDescriptorReference: {
        get: deprecate.deprecateMethod(void 0, function () {
            return this._objectDescriptorReference ? this._objectDescriptorReference.promise(require) :
                                                     Promise.resolve(null);
        }, "objectDescriptorReference", "objectDescriptor", true),
        set: deprecate.deprecateMethod(void 0, function (value) {
            this._objectDescriptorReference = value;
        }, "objectDescriptorReference", "objectDescriptor", true)
    },

    /**
     * The mapping for the parent object descriptor to
     * this mapping's object descriptor.
     * @type {DataMapping}
     */
    parent: {
        get: function () {
            if (!this._parent && this.objectDescriptor && this.objectDescriptor.parent && this.service) {
                this._parent = this.service.mappingWithType(this.objectDescriptor.parent);
            }
            return this._parent;
        }
    },

    /**
     * Array of expressions that combine to make the primary key for objects
     * of the type defined by this.objectDescriptor. Will use this.parent.rawDataPrimaryKeys
     * if this.rawDataPrimaryKeys is not set
     * @type {Array<string>}
     */
    rawDataPrimaryKeys: {
        get: function () {
            return this._rawDataPrimaryKeys || this.parent && this.parent.rawDataPrimaryKeys;
        },
        set: function (value) {
            this._rawDataPrimaryKeys = value;
        }
    },

    rawDataPrimaryKeyExpressions: {
        get: function () {
            if (!this._rawDataPrimaryKeyExpressions && this.rawDataPrimaryKeys) {
                this._rawDataPrimaryKeyExpressions = this.rawDataPrimaryKeys.map(
                    function (key) {
                        return compile(parse(key));
                    }
                );
            }
            return this._rawDataPrimaryKeyExpressions;
        }
    },

    /**
     * Adds a name to the list of rawDataPrimaryKeys
     * Array of expressions that combine to make the primary key for objects
     * of the type defined by this.objectDescriptor
     * @param {...string} propertyName
     */
    addRawDataPrimaryKey: {
        value: function () {
            var i, length, arg;
            for (i = 0, length = arguments.length; i < length; i += 1) {
                arg = arguments[i];
                if (!this._ownRequisitePropertyNames.has(arg)) {
                    this._ownRequisitePropertyNames.add(arg);
                    this._requisitePropertyNames = null; //To ensure all arguments are added to this.requisitePropertyNames
                }
            }
        }
    },

    /**
     * The required properties specific to this objectDescriptor. The
     * full requisitePropertyNames will be the union of these
     * and this.parent.requesitePropertyNames.
     */
    _ownRequisitePropertyNames: {
        get: function () {
            if (!this.__ownRequisitePropertyNames) {
                this.__ownRequisitePropertyNames = new Set();
            }
            return this.__ownRequisitePropertyNames;
        }
    },

    /**
     * The properties that will be eagerly mapped (I.E. mapped before
     * an instance can be returned from a fetch).
     *
     * For example, take an objectDescriptor and mapping for a class Foo:
     *    Foo {
     *      id
     *      name
     *      description
     *      bar
     *    }
     *
     *    FooMapping {
     *       requisitePropertyNames: ["id", "name", "description"]
     *    }
     *
     * A Foo object shall not be returned from a fetchData() call until
     * it's id, name, and description are mapped. Foo#bar will loaded
     * lazily only once it referenced on the returned Foo instance.
     * @property {Set}
     */
    requisitePropertyNames: {
        get: function () {
            var propertyName, iterator;

            if (!this._requisitePropertyNames) {
                this._requisitePropertyNames = new Set(this._ownRequisitePropertyNames);
                if (this.parent) {
                    iterator = this.parent.requisitePropertyNames.values();
                    while ((propertyName = iterator.next().value)) {
                        if (!this._requisitePropertyNames.has(propertyName)) {
                            this._requisitePropertyNames.add(propertyName);
                        }
                    }
                }
            }
            return this._requisitePropertyNames;
        }
    },

    /**
     * Adds a name to the list of properties that will participate in
     * eager mapping.  The requisite property names will be mapped
     * during the map from raw data phase.
     * @param {...string} propertyName
     */
    addRequisitePropertyName: {
        value: function () {
            var i, length, arg;
            for (i = 0, length = arguments.length; i < length; i += 1) {
                arg = arguments[i];
                if (!this._ownRequisitePropertyNames.has(arg)) {
                    this._ownRequisitePropertyNames.add(arg);
                    this._requisitePropertyNames = null; //To ensure all arguments are added to this.requisitePropertyNames
                }
            }
        }
    },


    /**
     * The descriptor of the "raw data" mapped from by this
     * data mapping.
     * @type {ObjectDescriptor}
     */
    schemaDescriptor: {
        get: function () {
            return this._schemaDescriptor;
        },
        set: function (value) {
            this._schemaDescriptor = value;
            if (value) {
                this._schemaDescriptorReference = new ObjectDescriptorReference().initWithValue(value);
            }
        }
    },

    /**
     * A reference to the object descriptor of the "raw data" that
     * is used by this mapping.  Used by serialized data mappings.
     * @type {ObjectDescriptorReference}
     */
    schemaDescriptorReference: {
        get: deprecate.deprecateMethod(void 0, function () {
            return this._schemaDescriptorReference ? this._schemaDescriptorReference.promise(require) :
                                                     Promise.resolve(null);
        }, "schemaDescriptorReference", "schemaDescriptor", true),
        set: deprecate.deprecateMethod(void 0, function (value) {
            this._schemaDescriptorReference = value;
        }, "schemaDescriptorReference", "schemaDescriptor", true)
    },


    /**
     * The service that owns this mapping object.
     * Used to create fetches for relationships.
     * @type {DataService}
     */
    service: {
        value: undefined
    },




    /***************************************************************************
     * Mapping
     */

    /**
     * Convert raw data to data objects of an appropriate type.
     *
     * Subclasses should override this method to map properties of the raw data
     * to data objects, as in the following:
     *
     *     mapRawDataToObject: {
     *         value: function (data, object) {
     *             object.firstName = data.GIVEN_NAME;
     *             object.lastName = data.FAMILY_NAME;
     *         }
     *     }
     *
     * The default implementation of this method copies the properties defined
     * by the raw data object to the data object.
     *
     * @method
     * @argument {Object} data   - An object whose properties' values hold
     *                             the raw data.
     * @argument {Object} object - An object whose properties must be set or
     *                             modified to represent the raw data.
     */
    mapRawDataToObject: {
        value: function (data, object) {
            var iterator = this.requisitePropertyNames.values(),
                promises, propertyName, result;


            if (this.requisitePropertyNames.size) {
                while ((propertyName = iterator.next().value)) {
                    result = this.mapRawDataToObjectProperty(data, object, propertyName);
                    if (this._isAsync(result)) {
                        (promises || (promises = [])).push(result);
                    }
                }
            }

            return promises && promises.length && Promise.all(promises);
        }
    },

    /**
     * Maps the value of a single raw data property onto the model object
     *
     * @method
     * @argument {Object} data           - An object whose properties' values
     *                                     hold the raw data.
     * @argument {Object} object         - The object on which to assign the property
     * @argument {string} propertyName   - The name of the model property to which
     *                                     to assign the value(s).
     * @returns {DataStream|Promise|?}   - Either the value or a "promise" for it
     *
     */
    mapRawDataToObjectProperty: {
        value: function (data, object, propertyName) {
            var rule = this.objectMappingRules.get(propertyName),
                propertyDescriptor = rule && this.objectDescriptor.propertyDescriptorForName(propertyName),
                isRelationship = propertyDescriptor && !propertyDescriptor.definition && propertyDescriptor.valueDescriptor,
                isDerived = propertyDescriptor && !!propertyDescriptor.definition,
                scope = this._scope,
                debug = DataService.debugProperties.has(propertyName);


            // Check if property is included in the DataService.debugProperties collection. Intended for debugging.
            if (debug) {
                console.debug("ExpressionDataMapping.mapRawDataToObjectProperty", object, propertyName);
                console.debug("To debug ExpressionDataMapping.mapRawDataToObjectProperty for " + propertyName + ", set a breakpoint here.");
            }

            scope.value = data;

            this._prepareRawDataToObjectRule(rule, propertyDescriptor);

            return  isRelationship ?                                this._resolveRelationship(object, propertyDescriptor, rule, scope) :
                    propertyDescriptor && !isDerived ?              this._resolveProperty(object, propertyDescriptor, rule, scope) :
                                                                    null;
        }
    },

    _resolveRelationship: {
        value: function (object, propertyDescriptor, rule, scope) {
            var self = this,
                hasInverse = !!propertyDescriptor.inversePropertyName || !!rule.inversePropertyName,
                data;
            return rule.evaluate(scope).then(function (result) {
                data = result;
                return hasInverse ? self._assignInversePropertyValue(data, object, propertyDescriptor, rule) : null;
            }).then(function () {
                self._setObjectValueForPropertyDescriptor(object, data, propertyDescriptor);
                return null;
            });
        }
    },

    _assignInversePropertyValue: {
        value: function (data, object, propertyDescriptor, rule) {
            var self = this,
                inversePropertyName = propertyDescriptor.inversePropertyName || rule.inversePropertyName;

            return propertyDescriptor.valueDescriptor.then(function (objectDescriptor) {
                var inversePropertyDescriptor = objectDescriptor.propertyDescriptorForName(inversePropertyName);
                
                if (data) {
                    self._setObjectsValueForPropertyDescriptor(data, object, inversePropertyDescriptor);
                }
                return null;
            });
        }
    },

    _revertRelationshipToRawData: {
        value: function (rawData, propertyDescriptor, rule, scope) {
            var propertyName = propertyDescriptor.name,
                self, result;

            if (!rule.converter.revert) {
                console.log("Converter does not have a revert function for property (" + propertyDescriptor.name + ")");
            }
            result = rule.evaluate(scope);

            if (this._isAsync(result)) {
                self = this;
                result.then(function (value) {
                    rawData[propertyName] = result;
                    return null;
                });
            } else {
                rawData[propertyName] = result;
            }
            return result;
        }
    },

    _revertPropertyToRawData: {
        value: function (rawData, propertyName, rule, scope) {
            var result = rule.evaluate(scope),
                self;

            if (this._isAsync(result)) {
                self = this;
                result.then(function (value) {
                    rawData[propertyName] = result;
                    return null;
                });
            } else {
                rawData[propertyName] = result;
            }
            return result;
        }
    },


    _resolveProperty: {
        value: function (object, propertyDescriptor, rule, scope) {
            var result = rule.evaluate(scope),
                propertyName = typeof propertyDescriptor === "object" ? propertyDescriptor.name : propertyDescriptor,
                self = this;

            if (this._isAsync(result)) {
                result.then(function (value) {
                    self._setObjectValueForPropertyDescriptor(object, value, propertyDescriptor);
                    return null;
                });
            } else {
                object[propertyName] = result;
            }
            return result;
        }
    },

    /**
     * Convert model objects to raw data objects of an appropriate type.
     *
     * Subclasses should override this method to map properties of the model objects
     * to raw data, as in the following:
     *
     *     mapObjectToRawData: {
     *         value: function (object, data) {
     *             data.GIVEN_NAME = object.firstName;
     *             data.FAMILY_NAME = object.lastName;
     *         }
     *     }
     *
     * The default implementation of this method copies the properties defined
     * by the model object to the raw data object.
     *
     * @method
     * @argument {Object} object - An object whose properties' values
     *                             hold the model data.
     * @argument {Object} data   - An object whose properties must be set or
     *                             modified to represent the model data
     */
    mapObjectToRawData: {
        value: function (object, data) {
            var keys = this.rawDataMappingRules.keys(),
                promises = [],
                key, result;

            while ((key = keys.next().value)) {
                result = this.mapObjectToRawDataProperty(object, data, key);
                if (this._isAsync(result)) {
                    promises = promises || [];
                    promises.push(result);
                }
            }

            return promises && promises.length && Promise.all(promises) || Promise.resolve(null);
        }
    },

    /**
     * Maps the value of a single object property to raw data. Assumes that 
     * the object property has been resolved
     *
     * @method
     * @argument {Object} object         - An object whose properties' values
     *                                     hold the model data.
     * @argument {Object} data           - The object on which to assign the property
     * @argument {string} propertyName   - The name of the raw property to which
     *                                     to assign the values.
     */
    _mapObjectToRawDataProperty: {
        value: function(object, data, propertyName) {
            var rule = this.rawDataMappingRules.get(propertyName),
                scope = new Scope(object),
                propertyDescriptor = rule && rule.propertyDescriptor,
                isRelationship = propertyDescriptor && propertyDescriptor.valueDescriptor,
                result;


            if (isRelationship && rule.converter) {
                this._prepareObjectToRawDataRule(rule);
                result = this._revertRelationshipToRawData(data, propertyDescriptor, rule, scope);
            } else if (rule.converter || rule.reverter) {
                result = this._revertPropertyToRawData(data, propertyName, rule, scope);
            } else /*if (propertyDescriptor)*/ { //relaxing this for now
                data[propertyName] = rule.expression(scope);
            }

            return result;
        }
    },

     /**
     * Prefetches any object properties required to map the rawData property 
     * and maps once the fetch is complete.
     *
     * @method
     * @argument {Object} object         - An object whose properties' values
     *                                     hold the model data.
     * @argument {Object} data           - The object on which to assign the property
     * @argument {string} propertyName   - The name of the raw property to which
     *                                     to assign the values.
     */
    mapObjectToRawDataProperty: {
        value: function (object, data, propertyName) {
            var rule = this.rawDataMappingRules.get(propertyName),
                requiredObjectProperties = rule ? rule.requirements : [],
                result, self;

            result = this.service.rootService.getObjectPropertyExpressions(object, requiredObjectProperties);

            if (this._isAsync(result)) {
                self = this;
                result = result.then(function () {
                    return self._mapObjectToRawDataProperty(object, data, propertyName);
                });
            } else {
                result = this._mapObjectToRawDataProperty(object, data, propertyName);
            }
            return result;
        }
    },
    
    /**
     * Convert model object properties to the raw data properties present in the requirements
     * for a given propertyName
     *
     * @method
     * @argument {Object} object         - An object whose properties' values
     *                                     hold the model data.
     * @argument {Object} data           - An object whose properties must be set or
     *                                     modified to represent the model data.
     * @argument {string} propertyName   - The name of the property whose requirements
     *                                     need to be populated in the raw data.
     */
    mapObjectToCriteriaSourceForProperty: {
        value: function (object, data, propertyName) {
            var keys = this.rawDataMappingRules.keys(),
                rule = this.objectMappingRules.get(propertyName),
                requiredRawProperties = rule ? rule.requirements : [],
                rawRequirementsToMap = new Set(requiredRawProperties),
                promises, key, result;

            while ((key = keys.next().value)) {
                if (rawRequirementsToMap.has(key)) {
                    result = this.mapObjectToRawDataProperty(object, data, key, propertyName);
                    if (this._isAsync(result)) {
                        promises = promises || [];
                        promises.push(result);
                    }
                }
            }
            return promises ? Promise.all(promises) : null;
        }
    },
    
    _prepareObjectToRawDataRule: {
        value: function (rule) {
            var converter = rule.converter,
                propertyDescriptor = rule.propertyDescriptor;

            if (converter) {
                converter.expression = converter.expression || rule.expression;
                converter.foreignDescriptor = converter.foreignDescriptor || propertyDescriptor.valueDescriptor;
            }
        }
    },

    /**
     * Returns the identifier of the child service of .service that is used to
     * fetch propertyName
     *
     * @method
     * @argument {string} propertyName   - The name of a model property
     */
    serviceIdentifierForProperty: {
        value: function (propertyName) {
            var rule = this.objectMappingRules.get(propertyName);
            return rule && rule.serviceIdentifier;
        }
    },

    _rawDataMappingRules: {
        value: undefined
    },

    _setObjectsValueForPropertyDescriptor: {
        value: function (objects, value, propertyDescriptor) {
            var i, n;
            for (i = 0, n = objects.length; i < n; i += 1) {
                this._setObjectValueForPropertyDescriptor(objects[i], value, propertyDescriptor);
            }
        }
    },

    _setObjectValueForPropertyDescriptor: {
        value: function (object, value, propertyDescriptor) {
            var propertyName = propertyDescriptor.name,
                isToMany;
            //Add checks to make sure that data matches expectations of propertyDescriptor.cardinality

            if (Array.isArray(value)) {
                isToMany = propertyDescriptor.cardinality !== 1;
                if (isToMany && Array.isArray(object[propertyName])) {
                    object[propertyName].splice.apply(object[propertyName], [0, Infinity].concat(value));
                } else if (isToMany) {
                    object[propertyName] = value;
                } else if (value.length) {
                    //Cardinality is 1, if data contains more than 1 item, we throw
                    if (value.length > 1) {
                        throw new Error("ExpressionDataMapping for property \""+ this.objectDescriptor.name + "." + propertyName+"\" expects a cardinality of 1 but data to map doesn't match: "+value);
                    }
                    object[propertyName] = value[0];
                }
            } else {
                object[propertyName] = value;
            }
        }
    },


    /**
     * Prepares a rule's converter for the property being mapped. This allows
     * converters to be shared across multiple rules.
     *
     * @method
     * @argument {MappingRule} rule   - A MappingRule to go from raw data to an object property
     */
    _prepareRawDataToObjectRule: {
        value: function (rule, propertyDescriptor) {
            var converter = rule && rule.converter;
            if (converter) {
                converter.expression = converter.expression || rule.expression;
                converter.foreignDescriptor = converter.foreignDescriptor || propertyDescriptor.valueDescriptor;
                converter.objectDescriptor = this.objectDescriptor;
                converter.serviceIdentifier = rule.serviceIdentifier;
            }
        }
    },

    /**
     * Pre-fetches the model properties that are required to map another model property
     *
     * @method
     * @argument {Object} object         - The object on which to prefetch properties
     * @argument {string} propertyName   - The name of the model property for which
     *                                     there are prerequisites
     */
    resolvePrerequisitesForProperty: {
        value: function (object, propertyName) {
            var rule = this.objectMappingRules.get(propertyName),
                prerequisites = rule && rule.prerequisitePropertyNames || null;
            if (!rule) {
                console.log("No Rule For:", propertyName);
            }

            return prerequisites ? this.service.rootService.getObjectProperties(object, prerequisites) : Promise.resolve(null);
        }
    },

    _isAsync: {
        value: function (object) {
            return object && object.then && typeof object.then === "function";
        }
    },

    _assignDataToObjectProperty: {
        value: function (object, propertyDescriptor, data) {
            var hasData = data && data.length,
                isToMany = propertyDescriptor.cardinality !== 1,
                propertyName = propertyDescriptor.name;

            //Add checks to make sure that data matches expectations of propertyDescriptor.cardinality
            //

            if (Array.isArray(data)) {
                if (isToMany && Array.isArray(object[propertyName])) {
                    object[propertyName].splice.apply(object[propertyName], [0, Infinity].concat(data));
                } else if (isToMany) {
                    object[propertyName] = data;
                } else if (hasData) {
                    //Cardinality is 1, if data contains more than 1 item, we throw
                    if (data.length && data.length > 1) {
                            throw new Error("ExpressionDataMapping for property \""+ this.objectDescriptor.name + "." + propertyName+"\" expects a cardinality of 1 but data to map doesn't match: "+data);
                    }
                    object[propertyName] = data[0];
                }
            } else {
                object[propertyName] = data;
            }
        }
    },
    /***************************************************************************
     * Rules
     */

     /**
     * Adds a rule to be used for mapping objects to raw data.
     * @param {string} targetPath   - The path to assign on the target
     * @param {object} rule         - The rule to be used when processing
     *                                the mapping.  The rule must contain
     *                                the direction and path of the properties
     *                                to map.  Optionally can include
     *                                a converter.
     */
    addObjectMappingRule: {
        value: function (targetPath, rule) {
            var rawRule = {};
            rawRule[targetPath] = rule;

            this._mapObjectMappingRules(rawRule);
            this._objectMappingRules = null; //To ensure all arguments are added to this.objectMappingRules
            this._rawDataMappingRules = null; //To ensure all arguments are added to this.rawDataMappingRules
        }
    },

    /**
     * Adds a rule to be used for mapping raw data to objects.
     * @param {string} targetPath   - The path to assign on the target
     * @param {object} rule         - The rule to be used when processing
     *                                the mapping.  The rule must contain
     *                                the direction and path of the properties
     *                                to map.  Optionally can include
     *                                a converter.
     */
    addRawDataMappingRule: {
        value: function (targetPath, rule) {
            var rawRule = {};
            rawRule[targetPath] = rule;
            this._mapRawDataMappingRules(rawRule);
            this._objectMappingRules = null; //To ensure all arguments are added to this.objectMappingRules
            this._rawDataMappingRules = null; //To ensure all arguments are added to this.rawDataMappingRules
        }
    },

    _assignAllEntriesTo: {
        value: function (source, target) {
            source.forEach(function (value, key) {
                target.set(key, value);
            });
        }
    },

    _areRulesInitialized: {
        value: false
    },

    _initializeRules: {
        value: function () {
            if (!this._areRulesInitialized) {
                this._areRulesInitialized = true;
                this._mapObjectMappingRules(this._rawOwnObjectMappingRules || {});
                this._mapRawDataMappingRules(this._rawOwnRawDataMappingRules || {});
            }
        }
    },

    _rawOwnObjectMappingRules: {
        value: undefined
    },

    _ownObjectMappingRules: {
        get: function () {
            if (!this.__ownObjectMappingRules) {
                this.__ownObjectMappingRules = new Map();
                this._initializeRules();
            }
            return this.__ownObjectMappingRules;
        }
    },

    objectMappingRules: {
        get: function () {
            if (!this._objectMappingRules) {
                this._objectMappingRules = new Map();
                if (this.parent) {
                    this._assignAllEntriesTo(this.parent.objectMappingRules, this._objectMappingRules);
                }
                this._assignAllEntriesTo(this._ownObjectMappingRules, this._objectMappingRules);
            }
            return this._objectMappingRules;
        }
    },

    _rawOwnRawDataMappingRules: {
        value: undefined
    },

    _ownRawDataMappingRules: {
        get: function () {
            if (!this.__ownRawDataMappingRules) {
                this.__ownRawDataMappingRules = new Map();
                this._initializeRules();
            }
            return this.__ownRawDataMappingRules;
        }
    },

    rawDataMappingRules: {
        get: function () {
            if (!this._rawDataMappingRules) {
                this._rawDataMappingRules = new Map();
                if (this.parent) {
                    this._assignAllEntriesTo(this.parent.rawDataMappingRules, this._rawDataMappingRules);
                }
                this._assignAllEntriesTo(this._ownRawDataMappingRules, this._rawDataMappingRules);
            }
            return this._rawDataMappingRules;
        }
    },

    /**
     * Maps raw rawData to object rules to MappingRule objects
     * @param {Object<string:Object>} rawRules - Object whose keys are object property
     *                                           names and whose values are raw rules
     * @param {Boolean} addOneWayBindings      - Whether or not to add one way bindings.
     */
    _mapObjectMappingRules: {
        value: function (rawRules) {
            var propertyNames = rawRules ? Object.keys(rawRules) : [],
                propertyName, rawRule, rule, i;

            //TODO Add path change listener for objectDescriptor to
            //account for chance that objectDescriptor is added after the rules
            if (this.objectDescriptor) {
                for (i = 0; (propertyName = propertyNames[i]); ++i) {
                    rawRule = rawRules[propertyName];
                    if (this._shouldMapRule(rawRule, true)) {
                        rule = this._makeRuleFromRawRule(rawRule, propertyName, true, true);
                        this._ownObjectMappingRules.set(rule.targetPath, rule);
                    }

                    if (this._shouldMapRule(rawRule, false)) {
                        rule = this._makeRuleFromRawRule(rawRule, propertyName, false, true);
                        this._ownRawDataMappingRules.set(rule.targetPath, rule);
                    }
                }
            }
        }
    },


    /**
     * Maps raw object to rawData rules to MappingRule objects
     * @param {Object<string:Object>} rawRules - Object whose keys are raw property
     *                                           names and whose values are object rules
     * @param {Boolean} addOneWayBindings      - Whether or not to add one way bindings.
     */
    _mapRawDataMappingRules: {
        value: function (rawRules) {
            var propertyNames = rawRules ? Object.keys(rawRules) : [],
                propertyName, rawRule, rule, i;


            //TODO Add path change listener for objectDescriptor to
            //account for chance that objectDescriptor is added after the rules
            if (this.objectDescriptor) {
                for (i = 0; (propertyName = propertyNames[i]); ++i) {
                    rawRule = rawRules[propertyName];
                    if (this._shouldMapRule(rawRule, false)) {
                        rule = this._makeRuleFromRawRule(rawRule, propertyName, false, false);
                        this._ownObjectMappingRules.set(rule.targetPath, rule);
                    }
                    if (this._shouldMapRule(rawRule, true)) {
                        rule = this._makeRuleFromRawRule(rawRule, propertyName, true, false);
                        this._ownRawDataMappingRules.set(rule.targetPath, rule);
                    }
                }
            }

        }
    },

    _makeRuleFromRawRule: {
        value: function (rawRule, propertyName, addOneWayBindings, isObjectMappingRule) {
            var propertyDescriptorName = !isObjectMappingRule && addOneWayBindings ? rawRule[ONE_WAY_BINDING] || rawRule[TWO_WAY_BINDING] : propertyName,
                propertyDescriptor = this.objectDescriptor.propertyDescriptorForName(propertyDescriptorName),
                rule = MappingRule.withRawRuleAndPropertyName(rawRule, propertyName, addOneWayBindings);

            rule.propertyDescriptor = propertyDescriptor;
            if (rawRule.converter && addOneWayBindings) {
                rule.converter = rawRule.converter;
            } else if (rawRule.converter && !addOneWayBindings) {
                rule.reverter = rawRule.converter;
            } else if (rawRule.reverter && addOneWayBindings) {
                rule.reverter = rawRule.reverter;
            } else if (rawRule.reverter && !addOneWayBindings) {
                rule.converter = rawRule.reverter;
            } else if (addOneWayBindings) {
                rule.converter = this._defaultConverter(rule.sourcePath, rule.targetPath, isObjectMappingRule);
            } else {
                rule.reverter = this._defaultConverter(rule.sourcePath, rule.targetPath, isObjectMappingRule);
            }
            return rule;
        }
    },

    _shouldMapRule: {
        value: function (rawRule, addOneWayBindings) {
            var isOneWayBinding = rawRule.hasOwnProperty(ONE_WAY_BINDING),
                isTwoWayBinding = !isOneWayBinding && rawRule.hasOwnProperty(TWO_WAY_BINDING);
            return isOneWayBinding && addOneWayBindings || isTwoWayBinding;
        }
    },

    _defaultConverter: {
        value: function (sourcePath, targetPath, isObjectMappingRule) {
            var sourceObjectDescriptor = isObjectMappingRule ? this.schemaDescriptor : this.objectDescriptor,
                targetObjectDescriptor = isObjectMappingRule ? this.objectDescriptor : this.schemaDescriptor,
                sourceDescriptor = sourceObjectDescriptor && sourceObjectDescriptor.propertyDescriptorForName(sourcePath),
                targetDescriptor = targetObjectDescriptor && targetObjectDescriptor.propertyDescriptorForName(targetPath),
                sourceDescriptorValueType = sourceDescriptor && sourceDescriptor.valueType,
                targetDescriptorValueType = targetDescriptor && targetDescriptor.valueType,
                shouldUseDefaultConverter = sourceDescriptor && targetDescriptor &&
                    sourceDescriptorValueType !== targetDescriptorValueType;

            return  shouldUseDefaultConverter ?  this._converterForValueTypes(targetDescriptorValueType, sourceDescriptorValueType) :
                                                 null;

        }
    },


    _converterForValueTypes: {
        value: function (sourceType, destinationType) {
            var converters = exports.ExpressionDataMapping.defaultConverters;
            return converters[sourceType] && converters[sourceType][destinationType] || null;
        }
    },

    /***************************************************************************
     * Deprecated
     */

    /**
     * @todo Document deprecation in favor of
     * [mapRawDataToObject()]{@link DataMapping#mapRawDataToObject}
     */
    mapFromRawData: {
        value: function (object, record, context) {
            return this.mapRawDataToObject(record, object, context);
        }
    },

    /**
     * @todo Document deprecation in favor of
     * [mapObjectToRawData()]{@link DataMapping#mapObjectToRawData}
     */
    mapToRawData: {
        value: function (object, record) {
            this.mapObjectToRawData(object, record);
        }
    }

}, {

    defaultConverters: {
        get: function () {
            if (!exports.ExpressionDataMapping._defaultConverters) {
                var defaultConverters = {};
                exports.ExpressionDataMapping._addDefaultConvertersToMap(defaultConverters);
                exports.ExpressionDataMapping._defaultConverters = defaultConverters;
            }
            return exports.ExpressionDataMapping._defaultConverters;
        }
    },

    _addDefaultConvertersToMap: {
        value: function (converters) {
            exports.ExpressionDataMapping._addDefaultBooleanConvertersToConverters(converters);
            exports.ExpressionDataMapping._addDefaultNumberConvertersToConverters(converters);
            exports.ExpressionDataMapping._addDefaultStringConvertersToConverters(converters);
        }
    },

    _addDefaultBooleanConvertersToConverters: {
        value: function (converters) {
            var booleanConverters = {};
            booleanConverters["string"] = Object.create({}, {
                convert: {
                    value: function (value) {
                        return Boolean(value);
                    }
                },
                revert: {
                    value: function (value) {
                        return String(value);
                    }
                }
            });
            booleanConverters["number"] = Object.create({}, {
                convert: {
                    value: function (value) {
                        return Boolean(value);
                    }
                },
                revert: {
                    value: function (value) {
                        return Number(value);
                    }
                }
            });
            converters["boolean"] = booleanConverters;
        }
    },

    _addDefaultNumberConvertersToConverters: {
        value: function (converters) {
            var numberConverters = {};
            numberConverters["string"] = Object.create({}, {
                convert: {
                    value: function (value) {
                        return Number(value);
                    }
                },
                revert: {
                    value: function (value) {
                        return String(value);
                    }
                },
                identifier: {
                    value: "String -> Number"
                }
            });
            numberConverters["boolean"] = Object.create({}, {
                convert: {
                    value: function (value) {
                        return Number(value);
                    }
                },
                revert: {
                    value: function (value) {
                        return Boolean(value);
                    }
                }
            });
            converters["number"] = numberConverters;
        }
    },

    _addDefaultStringConvertersToConverters: {
        value: function (converters) {
            var stringConverters = {};
            stringConverters["number"] = Object.create({}, {
                convert: {
                    value: function (value) {
                        return String(value);
                    }
                },
                revert: {
                    value: function (value) {
                        return Number(value);
                    }
                },
                identifier: {
                    value: "Number -> String"
                }
            });
            stringConverters["boolean"] = Object.create({}, {
                convert: {
                    value: function (value) {
                        return String(value);
                    }
                },
                revert: {
                    value: function (value) {
                        return Boolean(value);
                    }
                }
            });
            converters["string"] = stringConverters;
        }
    }

});
