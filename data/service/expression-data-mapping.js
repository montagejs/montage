var DataMapping = require("./data-mapping").DataMapping,
    assign = require("frb/assign"),
    compile = require("frb/compile-evaluator"),
    ObjectDescriptorReference = require("core/meta/object-descriptor-reference").ObjectDescriptorReference,
    parse = require("frb/parse"),
    Map = require("collections/map"),
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
                this._mapRawDataMappingRules(value.rules);
                this._mapObjectMappingRules(value.rules, true);
            }
            value = deserializer.getProperty("rawDataMapping");
            if (value) {
                this._mapObjectMappingRules(value.rules);
                this._mapRawDataMappingRules(value.rules, true);
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
     * Array of expressions that combine to make the primary key for objects
     * of the type defined by this.objectDescriptor
     * @type {Array<string>}
     */
    rawDataPrimaryKeys: {
        value: undefined
    },

    _ownRequisitePropertyNames: {
        get: function () {
            if (!this.__ownRequisitePropertyNames) {
                this.__ownRequisitePropertyNames = new Set();
            }
            return this.__ownRequisitePropertyNames;
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

    requisitePropertyNames: {
        get: function () {
            var parent, parentMapping,
                propertyName, iterator;

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
                parentMapping, promises, propertyName, result;


            if (this.requisitePropertyNames.size) {
                promises = [];
                while ((propertyName = iterator.next().value)) {
                    promises.push(this.mapRawDataToObjectProperty(data, object, propertyName));
                }
                result = Promise.all(promises);
            } else {
                result  = Promise.resolve(null);
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
            var rules = this.rawDataMappingRules,
                promises = [],
                keys = Object.keys(rules),
                key, i;

            for (i = 0; (key = keys[i]); ++i) {
                promises.push(this.mapObjectToRawDataProperty(object, data, key));
            }
            return promises && promises.length && Promise.all(promises) || Promise.resolve(null);
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
            var rules = this.rawDataMappingRules,
                rule = this.objectMappingRules[propertyName],
                requiredRawProperties = rule ? rule.requirements : [],
                rawRequirementsToMap = new Set(requiredRawProperties),
                promises = [], key;


            for (key in rules) {
                if (rules.hasOwnProperty(key) && rawRequirementsToMap.has(key)) {
                    promises.push(this._getAndMapObjectProperty(object, data, key, true));
                }
            }
            return promises && promises.length && Promise.all(promises) || Promise.resolve(null);
        }
    },

    /**
     * Returns the value of a single raw data property evaluated against the model object
     *
     * @method
     * @argument {Object} object                 - An object whose properties' values
     *                                             hold the model data.
     * @argument {Object} data                   - The object on which to assign the property
     * @argument {string} propertyName           - The name of the raw property to which
     *                                             to assign the values.
     * @argument {Boolean} prefetchRequirements  - Declare whether to fetch the object properties required to 
     *                                             evaluate the raw property. 
     */
    mapObjectToRawDataProperty: {
        value: function(object, data, property, prefetchRequirements) {
            var self = this,
                rules = this.rawDataMappingRules,
                scope = new Scope(object),
                rule = rules[property],
                propertyDescriptor = rule && rule.propertyDescriptor,
                requiredObjectProperties = rule ? rule.requirements : [],
                promise;

                if (property === "position" || property === "childPosition") {
                    console.log(object, rule);
                    debugger;
                }
            
            if (prefetchRequirements) {
                promise = this.service.rootService.getObjectPropertyExpressions(object, requiredObjectProperties);
            } else {
                promise = this.nullPromise;
            }

            return promise.then(function () {
                if (propertyDescriptor) {
                    return propertyDescriptor.valueDescriptor.then(function (descriptor) {
                        self._prepareObjectToRawPropertyRule(rule);
                        return descriptor && rule.converter ? self._convertRelationshipToRawData(object, propertyDescriptor, rule, scope) :
                                                              self._parse(rule, scope);
                    });
                } else {
                    return self._parse(rule, scope);
                }
            }).then(function(value) {
                data[property] = value;
            });
        }
    },

    
    /**
     * Prepares a rule's converter for the property being mapped. This allows 
     * converters to be shared across multiple rules.
     *
     * @method
     * @argument {MappingRule} rule   - A MappingRule to go from an object to a raw property
     */
    _prepareObjectToRawPropertyRule: {
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
            var rule = this.objectMappingRules[propertyName];
            return rule && rule.serviceIdentifier;
        }
    },
    

    

    _convertRelationshipToRawData: {
        value: function (object, propertyDescriptor, rule, scope) {
            if (!rule.converter.revert) {
                console.log("Converter does not have a revert function for property (" + propertyDescriptor.name + ")");
            }
            return rule.converter.revert(rule.expression(scope));
        }
    },


    


    /**
     * Returns the value of a single model property evaluated against the raw data object
     *
     * @method
     * @argument {Object} data           - An object whose properties' values
     *                                     hold the raw data.
     * @argument {Object} object         - The object on which to assign the property
     * @argument {string} propertyName   - The name of the model property to which
     *                                     to assign the values.
     */

    mapRawDataToObjectProperty: {
        value: function (data, object, propertyName) {
            //We should probably shift rules to be a Map rather than an anonymous object.
            var rules = this.objectMappingRules,
                rule = rules[propertyName],
                propertyDescriptor = rule && this.objectDescriptor.propertyDescriptorForName(propertyName),
                scope = this._scope,
                self = this,
                result;
                
            if (propertyName === "budget") {
                debugger;
            }

            scope.value = data;
            if (!propertyDescriptor || propertyDescriptor.definition) {
                result = Promise.resolve(null);
            } else {
                result = propertyDescriptor.valueDescriptor.then(function (descriptor) {
                    var isRelationship = !!descriptor;
                    self._prepareRawDataToObjectPropertyRule(rule, propertyDescriptor);
                    return isRelationship ? self._resolveRelationship(object, propertyDescriptor, rule, scope) :
                                            self._resolvePrimitive(object, propertyDescriptor, rule, scope);
                });
            }
            return result;
        }
    },

    /**
     * Prepares a rule's converter for the property being mapped. This allows 
     * converters to be shared across multiple rules.
     *
     * @method
     * @argument {MappingRule} rule   - A MappingRule to go from raw data to an object property
     */
    _prepareRawDataToObjectPropertyRule: {
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
            var rule = this.objectMappingRules[propertyName],
                prerequisites = rule && rule.prerequisitePropertyNames || null;
            if (!rule) {
                console.log("No Rule For:", propertyName);
            }

            return prerequisites ? this.service.rootService.getObjectProperties(object, prerequisites) : Promise.resolve(null);
        }
    },

    _resolvePrimitive: {
        value: function (object, propertyDescriptor, rule, scope) {
            var value = this._parse(rule, scope),
                self = this;


            return new Promise(function (resolve, reject) {
                if (self._isThenable(value)) {
                    value.then(function (data) {
                        self._assignDataToObjectProperty(object, propertyDescriptor, data);
                        resolve(null);
                    });
                } else {
                    object[propertyDescriptor.name] = value;
                    resolve(null);
                }
            });
        }
    },

    _isThenable: {
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

    _assignObjectToDataInverseProperty: {
        value: function (object, propertyDescriptor, data, inversePropertyName) {
            return propertyDescriptor.valueDescriptor.then(function (valueDescriptor) {
                var inversePropertyDescriptor = valueDescriptor.propertyDescriptorForName(inversePropertyName);
                if (inversePropertyDescriptor.cardinality === 1) {
                    data.forEach(function (item) {
                        item[inversePropertyName] = object;
                    });
                }
                return null;
            });
        }
    },

    _resolveRelationship: {
        value: function (object, propertyDescriptor, rule, scope) {
            var self = this;
            return rule.converter.convert(rule.expression(scope)).then(function (data) {
                self._assignDataToObjectProperty(object, propertyDescriptor, data);
                return rule.inversePropertyName && data && data.length ? self._assignObjectToDataInverseProperty(object, propertyDescriptor, data, rule.inversePropertyName) :
                                                                         null;

            });
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

            this._mapObjectMappingRules(rawRule, true);
            this._mapRawDataMappingRules(rawRule);
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
            this._mapRawDataMappingRules(rawRule, true);
            this._mapObjectMappingRules(rawRule);
            this._objectMappingRules = null; //To ensure all arguments are added to this.objectMappingRules
            this._rawDataMappingRules = null; //To ensure all arguments are added to this.rawDataMappingRules
        }
    },

    _ownObjectMappingRules: {
        get: function () {
            if (!this.__ownObjectMappingRules) {
                this.__ownObjectMappingRules = {};
            }
            return this.__ownObjectMappingRules;
        }
    },

    objectMappingRules: {
        get: function () {
            if (!this._objectMappingRules) {
                this._objectMappingRules = {};
                if (this.parent) {
                    Object.assign(this._objectMappingRules, this.parent.objectMappingRules);
                }
                Object.assign(this._objectMappingRules, this._ownObjectMappingRules);
            }
            return this._objectMappingRules;
        }
    },


    _ownRawDataMappingRules: {
        get: function () {
            if (!this.__ownRawDataMappingRules) {
                this.__ownRawDataMappingRules = {};
            }
            return this.__ownRawDataMappingRules;
        }
    },

    rawDataMappingRules: {
        get: function () {
            if (!this._rawDataMappingRules) {
                this._rawDataMappingRules = {};
                if (this.parent) {
                    Object.assign(this._rawDataMappingRules, this.parent.rawDataMappingRules);
                }
                Object.assign(this._rawDataMappingRules, this._ownRawDataMappingRules);
            }
            return this._rawDataMappingRules;
        }
    },

    _mapObjectMappingRules: {
        value: function (rawRules, addOneWayBindings) {
            var rules = this._ownObjectMappingRules,
                propertyNames = rawRules ? Object.keys(rawRules) : [],
                propertyName, rawRule, rule, i;

            for (i = 0; (propertyName = propertyNames[i]); ++i) {
                rawRule = rawRules[propertyName];
                if (this._shouldMapRule(rawRule, addOneWayBindings)) {
                    rule = this._makeRuleFromRawRule(rawRule, propertyName, addOneWayBindings, true);
                    rules[rule.targetPath] = rule;
                }
            }
        }
    },

    _mapRawDataMappingRules: {
        value: function (rawRules, addOneWayBindings) {
            var rules = this._ownRawDataMappingRules,
                propertyNames = rawRules ? Object.keys(rawRules) : [],
                propertyName, rawRule, rule, i;
            for (i = 0; (propertyName = propertyNames[i]); ++i) {
                rawRule = rawRules[propertyName];
                if (this._shouldMapRule(rawRule, addOneWayBindings)) {
                    rule = this._makeRuleFromRawRule(rawRule, propertyName, addOneWayBindings, false);
                    rules[rule.targetPath] = rule;
                }
            }
        }
    },

    _makeRuleFromRawRule: {
        value: function (rawRule, propertyName, addOneWayBindings, isObjectMappingRule) {
            if (propertyName === "budget") {
                debugger;
            }
            var propertyDescriptorName = !isObjectMappingRule && addOneWayBindings ? rawRule[ONE_WAY_BINDING] || rawRule[TWO_WAY_BINDING] : propertyName,
                propertyDescriptor = this.objectDescriptor.propertyDescriptorForName(propertyDescriptorName),
                sourcePath = addOneWayBindings ? rawRule[ONE_WAY_BINDING] || rawRule[TWO_WAY_BINDING] : propertyName,
                targetPath = addOneWayBindings && propertyName || rawRule[TWO_WAY_BINDING],
                compiled = this._compileRuleExpression(sourcePath),
                rule = new MappingRule();

            

            rule.converter = rawRule.converter || this._defaultConverter(sourcePath, targetPath, isObjectMappingRule);
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

    _parseObject: {
        value: function (rule, scope) {
            var value = rule.expression(scope);
            return rule.converter && rule.converter.revert(value) || value;
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

            return  shouldUseDefaultConverter ? this._converterForValueTypes(targetDescriptorValueType, sourceDescriptorValueType) :
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
