var DataMapping = require("./data-mapping").DataMapping,
    assign = require("frb/assign"),
    compile = require("frb/compile-evaluator"),
    ObjectDescriptorReference = require("core/meta/object-descriptor-reference").ObjectDescriptorReference,
    parse = require("frb/parse"),
    MappingRule = require("data/service/mapping-rule").MappingRule,
    Promise = require("core/promise").Promise,
    Scope = require("frb/scope"),
    Set = require("collections/set");

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
            var value = deserializer.getProperty("objectDescriptor");
            if (value instanceof ObjectDescriptorReference) {
                this.objectDescriptorReference = value;
            } else {
                this.objectDescriptor = value;
            }
            
            this.schemaReference = deserializer.getProperty("schema");
            
            value = deserializer.getProperty("objectMapping");
            if (value) {
                this._objectMappingRules = value.rules;
            }
            value = deserializer.getProperty("rawDataMapping");
            if (value) {
                this._rawDataMappingRules = value.rules;
            }
            value = deserializer.getProperty("requisitePropertyNames");
            if (value) {
                this.addRequisitePropertyName.apply(this, value);
            }
            
            value = deserializer.getProperty("rawDataPrimaryKeys");
            if (value) {
                this.rawDataPrimaryKeys = value;
            }
            
        }
    },
    
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
                promise = requiresInitialization ?  this.objectDescriptorReference.promise(require) :
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
                promise = requiresInitialization ?  this.schemaReference.promise(require) :
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
            this._schemaDescriptorReference = new ObjectDescriptorReference().initWithValue(value);
        }
    },
    
    /**
     * A reference to the object descriptor that is used
     * by this mapping.  Used by serialized data mappings.
     * @type {ObjectDescriptorReference}
     */
    objectDescriptorReference: {
        get: function () {
            return  this._objectDescriptorReference ?   this._objectDescriptorReference.promise(require) :
                                                        Promise.resolve(null);
        },
        set: function (value) {
            this._objectDescriptorReference = value;
        }
    },
    
    /**
     * A reference to the object descriptor of the "raw data" that
     * is used by this mapping.  Used by serialized data mappings.
     * @type {ObjectDescriptorReference}
     */
    schemaDescriptorReference: {
        get: function () {
            return  this._schemaDescriptorReference ?   this._schemaDescriptorReference.promise(require) :
                                                        Promise.resolve(null);
        },
        set: function (value) {
            this._schemaDescriptorReference = value;
        }
    },
    
    /**
     * The service that owns this mapping object.
     * Used to create fetches for relationships.
     * @type {DataService}
     */
    service: {
        value: undefined
    },
    
    /**
     * Adds a name to the list of properties that will participate in
     * eager mapping.  The requisite property names will be mapped
     * during the map from raw data phase.
     * @param {...string} propertyName
     */
    addRequisitePropertyName: {
        value: function () {
            // TODO: update after changing requisitePropertyNames to a set.
            var i, length, arg;
            for (i = 0, length = arguments.length; i < length; i += 1) {
                arg = arguments[i];
                if (!this._requisitePropertyNames.has(arg)) {
                    this._requisitePropertyNames.add(arg);
                }
            }
        }
    },
    
    /**
     * @property {Set}
     */
    requisitePropertyNames: {
        get: function () {
            return this._requisitePropertyNames;
        }
    },
    
    /***************************************************************************
     * Mapping
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
            this._mapObjectMappingRules(rawRule, true);
            this._mapRawDataMappingRules(rawRule);
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
            this._mapRawDataMappingRules(rawRule, true);
            this._mapObjectMappingRules(rawRule);
        }
    },
    
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
            var requisitePropertyNames = this.requisitePropertyNames,
                iterator = requisitePropertyNames.values(),
                promises, propertyName, result;
            
            if (requisitePropertyNames.size) {
                while ((propertyName = iterator.next().value)) {
                    result = this.mapRawDataToObjectProperty(data, object, propertyName);
                    if (this._isAsync(result)) {
                        promises = promises || [];
                        promises.push(result);
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
            //We should probably shift rules to be a Map rather than an anonymous object.
            var rules = this._compiledObjectMappingRules,
                rule = rules.hasOwnProperty(propertyName) && rules[propertyName],
                propertyDescriptor = rule && this.objectDescriptor.propertyDescriptorForName(propertyName),
                isRelationship = propertyDescriptor && !propertyDescriptor.definition && propertyDescriptor.valueDescriptor,
                scope = this._scope;
            
            scope.value = data;
            
            // if (!propertyDescriptor || propertyDescriptor.definition) {
            //     return null;
            // }
            
            this._prepareRawDataToObjectRule(rule, propertyDescriptor);
            
            return  isRelationship && rule.inversePropertyName ?    this._resolveBothSidesOfRelationship(object, propertyDescriptor, rule, scope) :
                    isRelationship ?                                this._resolveRelationship(object, propertyDescriptor, rule, scope) :
                    propertyDescriptor ?                            this._resolveProperty(object, propertyDescriptor, rule, scope) :
                                                                    null;
        }
    },
    
    _resolveBothSidesOfRelationship: {
        value: function (object, propertyDescriptor, rule, scope) {
            var self = this;
            return this._resolveRelationship(object, propertyDescriptor, rule, scope).then(function () {
                return propertyDescriptor.valueDescriptor;
            }).then(function (objectDescriptor) {
                var inversePropertyDescriptor = objectDescriptor.propertyDescriptorForName(rule.inversePropertyName),
                    data = object[propertyDescriptor.name];
                if (Array.isArray(data) && propertyDescriptor) {
                    self._setObjectsValueForPropertyDescriptor(data, object, inversePropertyDescriptor);
                }
                return null;
            });
        }
    },
    
    _resolveRelationship: {
        value: function (object, propertyDescriptor, rule, scope) {
            var self = this;
            return rule.converter.convert(rule.expression(scope)).then(function (data) {
                self._setObjectValueForPropertyDescriptor(object, data, propertyDescriptor);
                return null;
            });
        }
    },
    
    _revertRelationshipToRawData: {
        value: function (rawData, propertyDescriptor, rule, scope) {
            if (!rule.converter.revert) {
                console.log("Converter does not have a revert function for property (" + propertyDescriptor.name + ")");
            }
            return rule.converter.revert(rule.expression(scope)).then(function (result) {
                rawData[propertyDescriptor.name] = result;
                return null;
            });
        }
    },
    
    _revertPropertyToRawData: {
        value: function (rawData, propertyName, rule, scope) {
            var result = rule.converter.revert(rule.expression(scope)),
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
            var result = this._parse(rule, scope),
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
            var rules = this._compiledRawDataMappingRules,
                promises = [],
                keys = Object.keys(rules),
                key, i, result;
            
            for (i = 0; (key = keys[i]); ++i) {
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
     * Maps the value of a single object property to raw data
     *
     * @method
     * @argument {Object} object         - An object whose properties' values
     *                                     hold the model data.
     * @argument {Object} data           - The object on which to assign the property
     * @argument {string} propertyName   - The name of the raw property to which
     *                                     to assign the values.
     */
    mapObjectToRawDataProperty: {
        value: function(object, data, propertyName) {
            var rules = this._compiledRawDataMappingRules,
                scope = new Scope(object),
                rule = rules[propertyName],
                propertyDescriptor = rule && rule.propertyDescriptor,
                isRelationship = propertyDescriptor && propertyDescriptor.valueDescriptor,
                result;
            
            if (isRelationship && rule.converter) {
                this._prepareObjectToRawDataRule(rule);
                result = this._revertRelationshipToRawData(data, propertyDescriptor, rule, scope);
            } else if(rule.converter) {
                result = this._revertPropertyToRawData(data, propertyName, rule, scope);
            } else /*if (propertyDescriptor)*/ { //relaxing this for now
                data[propertyName] = rule.expression(scope);
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
            var rules = this._compiledRawDataMappingRules,
                rule = this._compiledObjectMappingRules[propertyName],
                requiredRawProperties = rule ? rule.requirements : [],
                rawRequirementsToMap = new Set(requiredRawProperties),
                promises, key, result;
            
            for (key in rules) {
                if (rules.hasOwnProperty(key) && rawRequirementsToMap.has(key)) {
                    result = this._getAndMapObjectProperty(object, data, key, propertyName);
                    if (this._isAsync(result)) {
                        promises = promises || [];
                        promises.push(result);
                    }
                }
            }
            return promises && promises.length && Promise.all(promises) || Promise.resolve(null);
        }
    },
    
    _getAndMapObjectProperty: {
        value: function (object, data, propertyName) {
            var rules = this._compiledRawDataMappingRules,
                rule = rules[propertyName],
                requiredObjectProperties = rule ? rule.requirements : [],
                result, self;
            
            result = this.service.rootService.getObjectPropertyExpressions(object, requiredObjectProperties);
            
            if (this._isAsync(result)) {
                self = this;
                result = result.then(function () {
                    return self.mapObjectToRawDataProperty(object, data, propertyName);
                });
            } else {
                result = this.mapObjectToRawDataProperty(object, data, propertyName);
            }
            return result;
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
            var rule = this._compiledObjectMappingRules[propertyName];
            return rule && rule.serviceIdentifier;
        }
    },
    
    _compiledObjectMappingRules: {
        get: function () {
            if (!this.__compiledObjectMappingRules) {
                this.__compiledObjectMappingRules = {};
                this._mapObjectMappingRules(this._rawDataMappingRules);
                this._mapObjectMappingRules(this._objectMappingRules, true);
            }
            
            return this.__compiledObjectMappingRules;
        }
    },
    
    _compiledRawDataMappingRules: {
        get: function () {
            if (!this.__compiledRawDataMappingRules) {
                this.__compiledRawDataMappingRules = {};
                this._mapRawDataMappingRules(this._objectMappingRules);
                this._mapRawDataMappingRules(this._rawDataMappingRules, true);
            }
            return this.__compiledRawDataMappingRules;
        }
    },
    
    _rawDataMappingRules: {
        value: undefined
    },
    
    rawDataPrimaryKeys: {
        value: undefined
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
    
    _requisitePropertyNames: {
        get: function () {
            if (!this.__requisitePropertyNames) {
                this.__requisitePropertyNames = new Set();
            }
            return this.__requisitePropertyNames;
        }
    },
    
    _mapObjectMappingRules: {
        value: function (rawRules, addOneWayBindings) {
            var rules = this._compiledObjectMappingRules,
                propertyNames = rawRules ? Object.keys(rawRules) : [],
                propertyName, rawRule, rule, i;
            
            for (i = 0; (propertyName = propertyNames[i]); ++i) {
                rawRule = rawRules[propertyName];
                if (this._shouldMapRule(rawRule, addOneWayBindings)) {
                    rule = addOneWayBindings ?  this._objectMappingRuleWithPropertyNameAndObjectMappingRule(propertyName, rawRule) :
                        this._objectMappingRuleWithPropertyNameAndRawDataMappingRule(propertyName, rawRule);
                    rules[rule.targetPath] = rule;
                }
            }
        }
    },
    
    _mapRawDataMappingRules: {
        value: function (rawRules, addOneWayBindings) {
            var rules = this._compiledRawDataMappingRules,
                propertyNames = rawRules ? Object.keys(rawRules) : [],
                propertyName, rawRule, rule, i;
            for (i = 0; (propertyName = propertyNames[i]); ++i) {
                rawRule = rawRules[propertyName];
                if (this._shouldMapRule(rawRule, addOneWayBindings)) {
                    rule = addOneWayBindings ?  this._rawDataMappingRuleWithPropertyNameAndRawDataMappingRule(propertyName, rawRule) :
                        this._rawDataMappingRuleWithPropertyNameAndObjectMappingRule(propertyName, rawRule);
                    rules[rule.targetPath] = rule;
                }
            }
        }
    },
    
    // example: foo: {"<-": "bar"}
    _objectMappingRuleWithPropertyNameAndObjectMappingRule: {
        value: function (propertyName, rawRule) {
            var propertyDescriptor = this.objectDescriptor.propertyDescriptorForName[propertyName],
                sourcePath = rawRule[ONE_WAY_BINDING] || rawRule[TWO_WAY_BINDING],
                rule = this._makeRule(sourcePath, propertyName);
            
            rule.converter = rawRule.converter || this._defaultConverter(sourcePath, propertyName, true);
            rule.inversePropertyName = rawRule.inversePropertyName;
            rule.isReverter = false;
            rule.propertyDescriptor = propertyDescriptor;
            rule.serviceIdentifier = rawRule.serviceIdentifier;
            
            return rule;
        }
    },
    
    _rawDataMappingRuleWithPropertyNameAndRawDataMappingRule: {
        value: function (propertyName, rawRule) {
            var schemaDescriptor = this.schemaDescriptor,
                propertyDescriptor = this.schemaDescriptor && schemaDescriptor.propertyDescriptorForName[propertyName],
                sourcePath = rawRule[ONE_WAY_BINDING] || rawRule[TWO_WAY_BINDING],
                rule = this._makeRule(sourcePath, propertyName);
            
            rule.converter = rawRule.converter || this._defaultConverter(sourcePath, propertyName, false);
            rule.inversePropertyName = rawRule.inversePropertyName;
            rule.isReverter = false;
            rule.propertyDescriptor = propertyDescriptor;
            rule.serviceIdentifier = rawRule.serviceIdentifier;
            
            return rule;
            
        }
    },
    
    _objectMappingRuleWithPropertyNameAndRawDataMappingRule: {
        value: function (propertyName, rawRule) {
            var targetPath = rawRule[TWO_WAY_BINDING],
                propertyDescriptor = this.objectDescriptor.propertyDescriptorForName[targetPath],
                rule = this._makeRule(propertyName, targetPath);
            
            rule.converter = rawRule.converter || this._defaultConverter(propertyName, targetPath, true);
            rule.inversePropertyName = rawRule.inversePropertyName;
            rule.isReverter = true;
            rule.propertyDescriptor = propertyDescriptor;
            rule.serviceIdentifier = rawRule.serviceIdentifier;
            return rule;
        }
    },
    
    _rawDataMappingRuleWithPropertyNameAndObjectMappingRule: {
        value: function (propertyName, rawRule) {
            var targetPath = rawRule[TWO_WAY_BINDING],
                schemaDescriptor = this.schemaDescriptor,
                propertyDescriptor = this.schemaDescriptor && schemaDescriptor.propertyDescriptorForName[propertyName],
                rule = this._makeRule(propertyName, targetPath);
            
            rule.converter = rawRule.converter || this._defaultConverter(propertyName, targetPath, false);
            rule.inversePropertyName = rawRule.inversePropertyName;
            rule.isReverter = true;
            rule.propertyDescriptor = propertyDescriptor;
            rule.serviceIdentifier = rawRule.serviceIdentifier;
            return rule;
        }
    },
    
    _makeRule: {
        value: function (source, target) {
            var compiled = this._compileRuleExpression(source),
                rule = new MappingRule();
            rule.expression = compiled.expression;
            rule.requirements = this._parseRequirementsFromParsedExpression(compiled.parsed);
            rule.targetPath = target;
            return rule;
        }
    },
    
    _makeRuleFromRawRule: {
        value: function (rawRule, propertyName, addOneWayBindings) {
            var propertyDescriptorName = addOneWayBindings ? rawRule[ONE_WAY_BINDING] || rawRule[TWO_WAY_BINDING] : propertyName,
                propertyDescriptor = this.objectDescriptor.propertyDescriptorForName(propertyDescriptorName),
                sourcePath = addOneWayBindings ? rawRule[ONE_WAY_BINDING] || rawRule[TWO_WAY_BINDING] : propertyName,
                targetPath = addOneWayBindings && propertyName || rawRule[TWO_WAY_BINDING],
                compiled = this._compileRuleExpression(sourcePath),
                rule = new MappingRule();
            
            rule.converter = rawRule.converter || this._defaultConverter(sourcePath, targetPath);
            rule.expression = compiled.expression;
            rule.inversePropertyName = rawRule.inversePropertyName;
            rule.isReverter = rawRule.converter && !addOneWayBindings;
            rule.propertyDescriptor = propertyDescriptor;
            rule.requirements = this._parseRequirementsFromParsedExpression(compiled.parsed);
            rule.serviceIdentifier = rawRule.serviceIdentifier;
            rule.targetPath = targetPath;
            
            return rule;
        }
    },
    
    __scope: {
        value: null
    },
    
    _scope: {
        get: function() {
            if (!this.__scope) {
                this.__scope = new Scope();
            }
            return this.__scope;
        }
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
    
    _prepareRawDataToObjectRule: {
        value: function (rule, propertyDescriptor) {
            var converter = rule.converter;
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
            var rule = this._compiledObjectMappingRules[propertyName],
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
    
    _compileRuleExpression: {
        value: function (rule) {
            var parsed = parse(rule),
                expression = compile(parsed);
            
            return {
                parsed: parsed,
                expression: expression
            };
        }
    },
    
    _parseRequirementsFromParsedExpression: {
        value: function (parsedExpression, requirements) {
            var args = parsedExpression.args,
                type = parsedExpression.type;
            
            requirements = requirements || [];
            
            if (type === "property" && args[0].type === "value") {
                requirements.push(args[1].value);
            } else if (type === "property" && args[0].type === "property") {
                var subProperty = [args[1].value];
                this._parseRequirementsFromParsedExpression(args[0], subProperty);
                requirements.push(subProperty.reverse().join("."));
            } else if (type === "record") {
                this._parseRequirementsFromParsedRecord(parsedExpression, requirements);
            }
            
            return requirements;
        }
    },
    
    _parseRequirementsFromParsedRecord: {
        value: function (parsedExpression, requirements) {
            var self = this,
                args = parsedExpression.args,
                keys = Object.keys(args);
            
            keys.forEach(function (key) {
                self._parseRequirementsFromParsedExpression(args[key], requirements);
            });
        }
    },
    
    _parse: {
        value: function (rule, scope) {
            var value = rule.expression(scope);
            return rule.converter ? rule.isReverter ?
                rule.converter.revert(value) :
                rule.converter.convert(value) :
                value;
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
            
            return  shouldUseDefaultConverter && isObjectMappingRule ?  this._converterForValueTypes(targetDescriptorValueType, sourceDescriptorValueType) :
                    shouldUseDefaultConverter && !isObjectMappingRule ? this._converterForValueTypes(sourceDescriptorValueType, targetDescriptorValueType) :
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
